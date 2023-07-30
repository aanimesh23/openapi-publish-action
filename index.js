const fs = require('fs');
const converter = require('openapi-to-postmanv2');
const axios = require('axios');
const core = require('@actions/core');
const repoName = require('git-repo-name');
const YAML = require('yaml')

const updateCollection = async (postmanCollectionId, postmanCollection, postmanApiKey) => {
    return await axios.put(`https://api.getpostman.com/collections/${postmanCollectionId}`, postmanCollection,
        {
            headers:
                {
                    'X-API-Key': postmanApiKey
                }
        });
}

const createCollection = async (workspaceId, postmanCollection, postmanApiKey) => {
    return await axios.post(`https://api.getpostman.com/collections?workspace=${workspaceId}`, postmanCollection,
        {
            headers:
                {
                    'X-API-Key': postmanApiKey
                }
        });
}

const getWorkspaceId = async (workspaceName, postmanApiKey) => {
    const workspaces = await axios.get(`https://api.getpostman.com/workspaces`,
        {
            headers:
                {
                    'X-API-Key': postmanApiKey
                }
        });
    const workspaceObj = workspaces.data?.workspaces?.find((workspace) => workspace.name===workspaceName)
    return workspaceObj?.id
}

const getCollectionId = async (workspaceid, collectionName, postmanApiKey) => {
    const workspace = await axios.get(`https://api.getpostman.com/workspaces/${workspaceid}`,
        {
            headers:
                {
                    'X-API-Key': postmanApiKey
                }
        });
    const collectionObj = workspace.data?.workspace?.collections?.find((collection) => collection.name===collectionName)
    return collectionObj?.id
}

const postToPostman = async (collectionName, workspaceName, postmanApiKey, openApiSpecYaml) => {
    const postmanCollection = await convertToPostman(YAML.stringify(openApiSpecYaml));
    core.debug(`Postman Collection ${postmanCollection}`)
    const workspaceId = await getWorkspaceId(workspaceName, postmanApiKey);
    core.debug(`Workspace Id ${workspaceId}`)
    if (typeof workspaceId === 'undefined') {
        core.setFailed(`No Workspace found. Please create a workspace with name ${workspaceName}`);
    }
    const collectionId = await getCollectionId(workspaceId, collectionName, postmanApiKey);
    core.debug(`Collection Id ${collectionId}`)
    if (typeof collectionId === 'undefined') {
        core.debug("creating collection")
        await createCollection(workspaceId, postmanCollection, postmanApiKey);
    } else {
        core.debug("updating collection")
        await updateCollection(collectionId, postmanCollection, postmanApiKey);
    }
}

const getSpecFromUrl = async (url) => {
    const data = await axios.get(url);
    return data.data;
}

const getSpecFromFile = (path) => {
    return fs.readFileSync(path, {encoding: 'UTF8'});
}

const convertToPostman = async (openapiData) => {

    return new Promise((resolve, reject) => {
        converter.convert({type: 'string', data: openapiData},
            {}, (err, conversionResult) => {
                if (err ||
                    !conversionResult.result ||
                    !conversionResult.output ||
                    conversionResult.output.length == 0 ||
                    !conversionResult.output[0].data) {
                    if (conversionResult.reason) {
                        return reject('Could not convert', conversionResult.reason);
                    }
                    return reject('Something went wrong');
                } else {
                    const collection = {collection: conversionResult.output[0].data};
                    return resolve(collection);
                }
            });
    });
}

const main = async () => {

    try {
        let collectionName = core.getInput('collectionName');
        const workspaceName = core.getInput('workspaceName');
        const postmanApiKey = core.getInput('postmanApiKey');
        const openApiSpec = core.getInput('openApiSpec');

        const isUrl = (openApiSpec.startsWith("https") || openApiSpec.startsWith("http"));
        core.debug(`isUrl ${isUrl}`)
        const openapiData = isUrl ? await getSpecFromUrl(openApiSpec) : getSpecFromFile(openApiSpec);
        core.debug(`isUrl ${openapiData}`)
        if (!collectionName || collectionName === '') {
            const repositoryName = 'Test Swagger'//await repoName();
            collectionName = `${repositoryName} Auto Generated`;
        }
        core.debug(`collection name ${collectionName}`)
        let openapiDataYaml = YAML.parse(openapiData)
        openapiDataYaml.info.title = collectionName;

        // Publish to postman
        core.debug(`Updating Postman`)
        await postToPostman(collectionName, workspaceName, postmanApiKey, openapiDataYaml)

    } catch (e) {
        console.log(e)
        core.setFailed(e.message);
    }
}

main();