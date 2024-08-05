# Contributing

> If you see any issues you are welcome to create a PR

## Running the docs

Install the [Mintlify CLI](https://www.npmjs.com/package/mintlify) to preview the documentation changes locally. To install, use the following command

```
npm install -g mintlify@4.0.38
```

Run the following command at the root of your documentation (where mint.json is)

```
mintlify dev
```

## Updating the OpenAPI spec and SDK snippets

To update the OpenAI spec and corresponding SDK snippets:

1. Update the Fern SDKs
2. Run the GitHub workflow "Create OpenAPI with Snippets" (located within the Github Actions tab of this repo) ![Update instructions](/resources/update-openapi.png)
3. Merge in the corresponding PR

## Publishing Changes

Changes will be deployed to production automatically after pushing to the default branch.

You can also preview changes using PRs, which generates a preview link of the docs.
