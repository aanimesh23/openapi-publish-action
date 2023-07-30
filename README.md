# Openapi Publish Action to Postman

This is a Github Action used to create and update your API documentation in postman using OpenApi Spec.
## Usage

### Requirements
 
 - Postman Api Token [generate a Postman API token](https://dream11.postman.co/settings/me/api-keys) ([Documentation](https://learning.postman.com/docs/developer/postman-api/authentication/))
 - Add Api key to secrets in github [Documentation](https://docs.github.com/en/actions/reference/encrypted-secrets)
 - Create a workspace your team will use

### Example workflow

```yaml
name: My Workflow
on:
  push:
    branches:
      - master
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: aanimesh23/openapi-publish-action@master
      with:
        collectionName: Backend Apis
        workspaceName: Team Workspace
        postmanApiKey: PMAK-xxxxx
        openApiSpec: resources/spec.yml
```

### Inputs

| Input                      | Description                                                                   |
|----------------------------|-------------------------------------------------------------------------------|
| `collectionName` _(optional)_          | Name with which the collection should be made / collection name to be updated |
| `workspaceName` | Name of he workspace where the collection should be made                      |
| `postmanApiKey` | Postman API key to access workspaces and create collection                    |
| `openApiSpec` | File path or link to open api spec YAML                                       |