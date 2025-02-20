![LOGO](https://github.com/elevenlabs/elevenlabs-python/assets/12028621/21267d89-5e82-4e7e-9c81-caf30b237683)

# ElevenLabs Documentation

Our documentation is hosted at https://elevenlabs.io/docs and all of the content lives inside the `fern/` folder.

## Running the docs

The [Fern CLI](https://www.npmjs.com/package/fern-api) is what builds the documentation.

Install [pnpm](https://pnpm.io/installation)

```
npm install -g pnpm
```

Install the dependencies

```
pnpm install
```

Run the following command at the root of the folder

```
pnpm run dev
```

Run the following command to lint/format the project

```
pnpm run format
```

## Other developer resources

### SDKs

We support the following SDKs which can be used to interact with the ElevenLabs platform:

- [Python](https://github.com/elevenlabs/elevenlabs-python)
- [Typescript](https://github.com/elevenlabs/elevenlabs-js)

# SDK generation (internal)

This repository contains your Fern Configuration:

- [OpenAPI spec](./fern/apis/api/openapi.json)
- [Generators config](./fern/apis/api/generators.yml)

## How to update the SDKs

1. Deploy the backend with the updated OpenAPI spec
2. Update openapi.json in this repo with the new OpenAPI spec (`pnpm run openapi:latest`)
3. (Optional but recommended) Run `fern check` to validate the API and `fern generate --group python-sdk --preview` to create the generated intermediate step locally
4. (Optional) Test the changes locally by running `fern generate --group python-sdk --preview` and inspecting the generated folder
5. Add in appropriate overrides to the `openapi-overrides.yml` doc, and repeat steps 3 and 4 until it's correct
6. Trigger the Python and Typescript Github Actions. To do this, go to the `Actions` tab and click `Release TypeScript SDK` or `Release Python SDK`. Enter in the appropriate version number e.g. `1.1.1` (bumped from what's currently released). This will create PRs into the elevenlabs-python or elevenlabs-js repos
7. Review and merge the PRs into the elevenlabs-python or elevenlabs-js repos.
8. Create a release tag on both the Python and Typescript repos to release them

## Validating your API Definition

To validate your API, run:

```sh
pnpm install
pnpm run fern:check
```

To view the changes locally run

```sh
fern generate --group python-sdk --preview
# `fern write-definition` shows you the intermediate step
```
