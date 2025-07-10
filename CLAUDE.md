# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is the ElevenLabs documentation repository containing:

- **Documentation site** (`/fern/`) - Fern-based documentation using YAML configuration
- **Next.js example app** (`/examples/elevenlabs-nextjs/`) - Comprehensive demo of ElevenLabs features
- **Code snippets** (`/examples/snippets/`) - Tested examples for documentation
- **SDK generation** - OpenAPI-based SDK generation for Python and TypeScript

The repository is structured as a monorepo with PNPM workspaces managing multiple packages.

## Common Commands

### Development

```bash
# Install dependencies
pnpm install

# Start documentation development server
pnpm run dev

# Format and lint all files
pnpm run fmt

# Check formatting without making changes
pnpm run fmt:check

# Validate Fern configuration
pnpm run fern:check
```

### Code Snippets

```bash
# Test all snippets for syntax validity
pnpm run snippets:test

# Type check TypeScript snippets
pnpm run snippets:typecheck

# Generate MDX files from snippets for documentation
pnpm run snippets:generate
```

### SDK Generation (ElevenLabs employees only)

```bash
# Update OpenAPI spec from production
pnpm run openapi:update

# Preview SDK generation locally
fern generate --group python-sdk --preview
fern generate --group typescript-sdk --preview

# Preview documentation changes
pnpm run docs:preview
```

### Quality Assurance

```bash
# Run full CI pipeline locally
pnpm run ci

# Check for broken links in documentation
pnpm run fern:broken-links

# Lint OpenAPI specification
pnpm run openapi:lint
```

## Architecture Overview

### Documentation System

- **Fern-based**: Uses `/fern/docs.yml` for navigation and structure
- **Three main tabs**:
  - `docs` - General documentation with capabilities, guides, and product info
  - `conversational-ai` - Conversational AI specific documentation
  - `api-reference` - Auto-generated API reference from OpenAPI spec
- **Assets**: All images stored in `/fern/assets/images/` (non-nested structure)
- **Content organization**: Different content types for different audiences (technical vs non-technical)

### Content Guidelines (from .cursorrules)

- Scientific, clear, and concise writing style
- Structured like research papers with logical flow
- Avoid marketing language and jargon
- Use components (Accordions, Cards, Frames, Steps) to enhance readability
- Every image must be wrapped in Frame components with `background="subtle"`
- Code examples always start with Python as default

### Code Snippets Workflow

1. **Create**: Write examples in `/examples/snippets/python/` and `/examples/snippets/node/`
2. **Test**: Run `pnpm run snippets:test` and `pnpm run snippets:typecheck`
3. **Generate**: Run `pnpm run snippets:generate` to create MDX files
4. **Use**: Import generated MDX into documentation with `<Markdown src="/snippets/generated/filename.mdx" />`

### SDK Generation Process

1. Backend deploys with updated OpenAPI spec
2. Update `openapi.json` with `pnpm run openapi:latest`
3. Validate with `fern check` and preview with `fern generate --group python-sdk --preview`
4. Apply overrides in `openapi-overrides.yml` if needed
5. Trigger GitHub Actions for SDK releases (ElevenLabs employees only)

## File Naming Conventions

- Documentation files: `.mdx` format with frontmatter (title, subtitle)
- Changelog files: `YYYY-MM-DD.md` format in `/fern/docs/pages/changelog/`
- Snippet files: Consistent naming across languages (e.g., `quickstart_tts.py` and `quickstart_tts.mts`)

## Changelog Style Guidelines

When writing changelog entries:

- **Format**: Use `YYYY-MM-DD.md` filename format with frontmatter containing `title: "Month Day, Year"`
- **Language**: Use descriptive, professional language without marketing jargon
- **Formatting**: Avoid all-caps formatting like `**NEW**`, `**ENHANCED**`, `**MOVED**`, `**UPDATED**`, `**DEPRECATED**`, `**REMOVED**`
- **Style**: Use natural language instead:
  - "Added support for..." instead of "**NEW**: Support for..."
  - "Phone number endpoint moved from..." instead of "**MOVED**: Phone number endpoint from..."
  - "Deprecated `field_name`..." instead of "**DEPRECATED**: `field_name`..."
  - "Removed `schema_name`..." instead of "**REMOVED**: `schema_name`..."
- **Links**: Always include relevant links to documentation pages, API references, and guides
- **Structure**: Follow the established pattern of other changelog files with clear sections and subsections
- **Features**: Lead with feature names in bold (e.g., "**HIPAA Compliance**:", "**Post-call Audio**:")
- **Consistency**: Maintain consistent formatting and structure across all changelog entries

## Important Notes

- Never commit sensitive information (API keys, tokens)
- OpenAPI spec is automatically formatted with `openapi-format`
- Documentation uses specific redirect patterns defined in `docs.yml`
- All external links and assets should be properly validated
- The repository supports both Python (Poetry) and Node.js (PNPM) development workflows

## Linting and Testing

Before committing changes, ensure:

1. All code is properly formatted (`pnpm run fmt`)
2. Fern configuration is valid (`pnpm run fern:check`)
3. Snippets are tested and type-checked (`pnpm run snippets:test && pnpm run snippets:typecheck`)
4. No broken links exist (`pnpm run fern:broken-links`)

The CI pipeline runs all these checks automatically via `pnpm run ci`.
