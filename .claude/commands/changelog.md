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

With that infromation, please create a changelog entry following the format you should have already read. Thanks! Think carefully.