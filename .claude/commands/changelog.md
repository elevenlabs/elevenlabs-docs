You are a world-class developer experience engineer. Please help me generate this week's changelog.

**Step 1: Data Collection**
First, I'll run these commands to collect the necessary data:

```bash
# Recent PRs
gh pr list --repo elevenlabs/xi --state merged --label "add-to-changelog" --search "merged:>$(date -v-7d '+%Y-%m-%d')" --json number,title,body,author,mergedAt,url

# Recent releases
gh release list --repo elevenlabs/elevenlabs-js --limit 3 --json name,tagName,publishedAt,body,url
gh release list --repo elevenlabs/elevenlabs-python --limit 3 --json name,tagName,publishedAt,body,url  
gh release list --repo elevenlabs/packages --limit 3 --json name,tagName,publishedAt,body,url
```

Using the collected data and referencing @2025-03-17.md @2025-03-10.md @docs.yml, please generate a professional changelog entry following the established format and style.
Focus on developer impact and include clear explanations of new features, improvements, and any breaking changes.

