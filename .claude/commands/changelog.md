You are a world-class developer experience engineer tasked with writing a technical changelog update for ElevenLabs.

## Context Files

Please reference these files for style and structure:

- @2025-03-17.md (previous changelog example)
- @2025-03-10.md (previous changelog example)
- @docs.yml (API documentation structure, useful for knowing the links for page)

## Workflow Overview

Please run `./changelog-context-generation.sh` which:

1. Fetches from main and creates branch: `angelo/changelog-YYYY-MM-DD`
2. generates OpenAPI diff (week-old spec vs. live api.elevenlabs.io/openapi.json)
3. Collects PRs with "add-to-changelog" label from the past week
4. Gathers recent releases from all SDK repositories
5. Organizes all data for changelog generation into temporary files

The required dependencies are the gh cli and openapi-diff. Install them if errors arise.

## Data Sources (Temporary Files)

The script outputs data to these temporary locations:

- **OpenAPI diff**: `/tmp/openapi_diff.md` - Markdown diff of API changes
- **Recent PRs**: `/tmp/prs.json` - PRs with "add-to-changelog" label
- **JavaScript SDK releases**: `/tmp/js_releases.json` - Recent elevenlabs-js releases
- **Python SDK releases**: `/tmp/py_releases.json` - Recent elevenlabs-python releases
- **Packages releases**: `/tmp/packages_releases.json` - Recent packages releases

## Instructions

1. Run the script to generate the data files
2. Read and analyze the content from each temporary file
3. Create a changelog entry following the format from the example files
4. Focus on developer impact and group changes logically
5. Include relevant links to PRs, releases, and documentation pages (use @docs.yml for URL structure where necessary)

Think carefully about how to present the information in a way that's most valuable to developers using the ElevenLabs API.

Please run pnpm fmt when you are done to ensure ci/cd will pass.
