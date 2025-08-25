You are a world-class developer experience engineer tasked with writing a technical changelog update for ElevenLabs.

## Context Files

Please reference these files for style and structure:

- @2025-03-17.md (previous changelog example)
- @2025-03-10.md (previous changelog example)
- @docs.yml (API documentation structure, useful for knowing the links for page)

## Workflow Overview

Please run `./scripts/changelog-context-generation.sh` which:

1. Fetches from main and creates branch: `changelog/changelog-YYYY-MM-DD`
2. generates OpenAPI diff (week-old spec vs. live api.elevenlabs.io/openapi.json)
3. Collects PRs with "add-to-changelog" label from the past week
4. Gathers recent releases from all SDK repositories
5. Organizes all data for changelog generation into temporary files

Then run the detailed OpenAPI field-level analysis script:

```bash
python3 scripts/openapi-detailed-diff.py --from-date YYYY-MM-DD --output-file scripts/detailed-api-changes.md
```

This will generate specific field-level API changes with exact details about new endpoints, modified fields, type changes, and breaking vs. backward-compatible changes.

The required dependencies are the gh cli, openapi-diff, and python3. Install them if errors arise.

## Data Sources (Temporary Files)

The scripts output data to these locations:

### From changelog-context-generation.sh:
- **OpenAPI diff**: `/changelog_data/openapi_diff.md` - High-level diff of API changes
- **Recent PRs**: `/changelog_data/prs.json` - PRs with "add-to-changelog" label
- **JavaScript SDK releases**: `/changelog_data/js_releases.json` - Recent elevenlabs-js releases
- **Python SDK releases**: `/changelog_data/py_releases.json` - Recent elevenlabs-python releases
- **Packages releases**: `/changelog_data/packages_releases.json` - Recent packages releases

### From openapi-detailed-diff.py:
- **Detailed API changes**: `scripts/detailed-api-changes.md` - Field-level analysis with specific endpoint changes, added/removed fields, type changes, and breaking vs. backward-compatible classifications

## Instructions

1. Run `./scripts/changelog-context-generation.sh` to generate the initial data files
2. Run the detailed OpenAPI analysis script: `python3 scripts/openapi-detailed-diff.py --from-date YYYY-MM-DD --output-file scripts/detailed-api-changes.md`
3. Read and analyze the content from each data file
4. Create a changelog entry following the format from the example files
5. **Use the detailed API changes file for exact field-level details** - specify exact field names, types, requirement changes, and breaking vs. backward-compatible classifications
6. Focus on developer impact and group changes logically
7. Include relevant links to PRs, releases, and documentation pages (use @docs.yml for URL structure where necessary)

Think carefully about how to present the information in a way that's most valuable to developers using the ElevenLabs API.

Please run pnpm fmt when you are done to ensure ci/cd will pass.

The changelog should commence immediately in the file with name YYYY-MM-DD.md, do not add a title like:
---
title: "July 14, 2025"
---

You can read the output of the context generated in changelog_data/

Discard the generated context before finishing

The structure of the changelog should be

first product updates grouped by product, in order of importance of the update

then sdk releases

then api schema updates in an accordion. you can read the other changelog updates to get a sense of the desired format.

## API Changes Requirements

When documenting API changes, be specific about:

- **New endpoints**: List exact HTTP method and path (e.g., `POST /v1/convai/agent-testing/create`)
- **Field changes**: Name exact field names, types, and whether they're required
- **Breaking vs. backward-compatible**: Clearly classify each change
- **Schema modifications**: Specify what was added, removed, or changed in request/response schemas

Use the detailed analysis from `scripts/detailed-api-changes.md` to ensure accuracy and completeness.
