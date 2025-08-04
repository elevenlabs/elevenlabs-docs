#!/bin/bash

# Weekly Changelog Generator for ElevenLabs
# This script collects data from PRs and releases to generate changelog content

set -e

CURRENT_DATE=$(date '+%Y-%m-%d')
WEEK_AGO=$(date -v-7d '+%Y-%m-%d')
BRANCH_NAME="changelog/changelog-${CURRENT_DATE}"

echo "🚀 Weekly Changelog Generator for ElevenLabs"
echo "=================================================================="
echo "Current date: $CURRENT_DATE"
echo "Looking back to: $WEEK_AGO"
echo "Target branch: $BRANCH_NAME"
echo "=================================================================="

# Create temporary files for data collection
TEMP_DIR=$(mktemp -d)
PRS_FILE="$TEMP_DIR/prs.json"
JS_RELEASES_FILE="$TEMP_DIR/js_releases.json"
PY_RELEASES_FILE="$TEMP_DIR/py_releases.json"
PACKAGES_RELEASES_FILE="$TEMP_DIR/packages_releases.json"
OPENAPI_DIFF_FILE="$TEMP_DIR/openapi_diff.md"

# Function to setup git branch
setup_git_branch() {
    echo "🌿 Setting up Git branch..."

    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo "❌ Error: Not in a git repository"
        exit 1
    fi

    # Stash any uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        echo "   📦 Stashing uncommitted changes..."
        git stash push -m "Auto-stash before changelog generation"
    fi

    # Switch to main and update
    echo "   🔄 Switching to main and updating..."
    git checkout main
    git fetch origin
    git pull origin main

    # Create and switch to changelog branch
    if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
        echo "   ⚠️  Branch $BRANCH_NAME already exists, switching to it..."
        git checkout $BRANCH_NAME
    else
        echo "   ✨ Creating new branch: $BRANCH_NAME"
        git checkout -b $BRANCH_NAME
    fi

    echo "   ✅ Git setup complete"
}

# Function to generate OpenAPI diff
generate_openapi_diff() {
    echo "🔍 Generating OpenAPI diff..."

    # Check if openapi-diff is installed
    if ! command -v openapi-diff &> /dev/null; then
        echo "   ⚠️  openapi-diff not found. Installing via brew..."
        brew install openapi-diff
    fi

    # Path to local OpenAPI file
    local local_openapi="fern/apis/api/openapi.json"

    if [ ! -f "$local_openapi" ]; then
        echo "   ❌ Error: Local OpenAPI file not found at $local_openapi"
        return 1
    fi

    # Get the commit from a week ago for the OpenAPI file
    echo "   📅 Finding OpenAPI state from $WEEK_AGO..."
    local week_ago_commit=$(git log --since="$WEEK_AGO 00:00:00" --until="$WEEK_AGO 23:59:59" --format="%H" -n 1 -- "$local_openapi")

    if [ -z "$week_ago_commit" ]; then
        # If no commit on that exact day, find the latest commit before that date
        week_ago_commit=$(git log --until="$WEEK_AGO 23:59:59" --format="%H" -n 1 -- "$local_openapi")
    fi

    if [ -z "$week_ago_commit" ]; then
        echo "   ⚠️  Could not find OpenAPI file state from a week ago"
        echo "   📝 Will note this in the changelog generation"
        echo "No OpenAPI changes could be determined (no historical data found)" > "$OPENAPI_DIFF_FILE"
        return 0
    fi

    echo "   📊 Using commit $week_ago_commit for comparison"

    # Create temporary files for comparison
    local old_spec="$TEMP_DIR/openapi_old.json"
    local new_spec="$TEMP_DIR/openapi_new.json"

    # Get old version from git
    git show "$week_ago_commit:$local_openapi" > "$old_spec" 2>/dev/null || {
        echo "   ⚠️  Could not retrieve old OpenAPI spec"
        echo "No OpenAPI changes could be determined (could not retrieve historical spec)" > "$OPENAPI_DIFF_FILE"
        return 0
    }

    # Get current version from API (this is the source of truth)
    echo "   🌐 Fetching latest OpenAPI spec from api.elevenlabs.io..."
    if ! curl -s "https://api.elevenlabs.io/openapi.json" > "$new_spec"; then
        echo "   ❌ Error: Could not fetch latest OpenAPI spec from API"
        echo "   This is required for accurate changelog generation"
        echo "API fetch failed - cannot generate OpenAPI diff" > "$OPENAPI_DIFF_FILE"
        return 1
    fi

    # Validate the fetched spec is valid JSON
    if ! jq . "$new_spec" >/dev/null 2>&1; then
        echo "   ❌ Error: Fetched OpenAPI spec is not valid JSON"
        echo "Invalid JSON from API - cannot generate OpenAPI diff" > "$OPENAPI_DIFF_FILE"
        return 1
    fi

    echo "   ✅ Successfully fetched latest OpenAPI spec from API"

    # Normalize operation IDs in both specs before comparison
    echo "   🔄 Normalizing operation IDs..."
    local old_spec_normalized="$TEMP_DIR/openapi_old_normalized.json"
    local new_spec_normalized="$TEMP_DIR/openapi_new_normalized.json"
    
    # Remove operation IDs from both specs using jq
    jq 'walk(if type == "object" and has("operationId") then del(.operationId) else . end)' "$old_spec" > "$old_spec_normalized"
    jq 'walk(if type == "object" and has("operationId") then del(.operationId) else . end)' "$new_spec" > "$new_spec_normalized"

    # Generate diff
    echo "   🔀 Generating OpenAPI diff (ignoring operation ID changes)..."
    if openapi-diff "$old_spec_normalized" "$new_spec_normalized" --markdown "$OPENAPI_DIFF_FILE" 2>/dev/null; then
        echo "   ✅ OpenAPI diff generated successfully"

        # Check if there are actually any changes
        if [ ! -s "$OPENAPI_DIFF_FILE" ] || grep -q "No changes" "$OPENAPI_DIFF_FILE"; then
            echo "No significant OpenAPI changes detected this week" > "$OPENAPI_DIFF_FILE"
        fi
    else
        echo "   ⚠️  openapi-diff command failed, will note in changelog"
        echo "OpenAPI diff could not be generated (command failed)" > "$OPENAPI_DIFF_FILE"
    fi
}

# Function to collect PR data
collect_prs() {
    echo "📋 Collecting recent PRs with 'add-to-changelog' label..."
    gh pr list --repo elevenlabs/xi --state merged --label "add-to-changelog" \
        --search "merged:>$WEEK_AGO" \
        --json number,title,body,author,mergedAt,url > "$PRS_FILE"

    local pr_count=$(jq length "$PRS_FILE")
    echo "   Found $pr_count PRs"
}

# Function to collect release data
collect_releases() {
    echo "📦 Collecting recent releases..."

    # JavaScript SDK releases
    gh release list --repo elevenlabs/elevenlabs-js --limit 5 \
        --json name,tagName,publishedAt,isLatest > "$JS_RELEASES_FILE"

    # Python SDK releases
    gh release list --repo elevenlabs/elevenlabs-python --limit 5 \
        --json name,tagName,publishedAt,isLatest > "$PY_RELEASES_FILE"

    # Packages releases
    gh release list --repo elevenlabs/packages --limit 5 \
        --json name,tagName,publishedAt,isLatest > "$PACKAGES_RELEASES_FILE"

    echo "   ✅ Release data collected"
}

# Function to filter releases from the last week
filter_recent_releases() {
    local file=$1
    jq --arg date "$WEEK_AGO" '[.[] | select(.publishedAt > $date)]' "$file"
}

# Function to generate changelog sections
generate_changelog_data() {
    echo ""
    echo "📝 CHANGELOG DATA SUMMARY"
    echo "=================================================================="

    # OpenAPI Changes section
    echo ""
    echo "## OpenAPI Changes"
    if [ -f "$OPENAPI_DIFF_FILE" ]; then
        echo "```markdown"
        cat "$OPENAPI_DIFF_FILE"
        echo "```"
    else
        echo "- No OpenAPI diff generated"
    fi

    # Recent PRs section
    echo ""
    echo "## Recent PRs (add-to-changelog label)"
    if [ -s "$PRS_FILE" ] && [ "$(jq length "$PRS_FILE")" -gt 0 ]; then
        jq -r '.[] | "- \(.title) (#\(.number)) by @\(.author.login)\n  URL: \(.url)\n  Merged: \(.mergedAt // "Not merged")"' "$PRS_FILE"
    else
        echo "- No PRs with changelog label found this week"
    fi

    # SDK Releases section
    echo ""
    echo "## Recent SDK Releases"

    # JavaScript SDK
    echo ""
    echo "### JavaScript SDK"
    local js_recent=$(filter_recent_releases "$JS_RELEASES_FILE")
    if [ "$js_recent" = "[]" ]; then
        echo "- No releases this week"
    else
        echo "$js_recent" | jq -r '.[] | "- \(.name) (\(.tagName)) - Published: \(.publishedAt)"'
    fi

    # Python SDK
    echo ""
    echo "### Python SDK"
    local py_recent=$(filter_recent_releases "$PY_RELEASES_FILE")
    if [ "$py_recent" = "[]" ]; then
        echo "- No releases this week"
    else
        echo "$py_recent" | jq -r '.[] | "- \(.name) (\(.tagName)) - Published: \(.publishedAt)"'
    fi

    # Packages
    echo ""
    echo "### Packages"
    local pkg_recent=$(filter_recent_releases "$PACKAGES_RELEASES_FILE")
    if [ "$pkg_recent" = "[]" ]; then
        echo "- No releases this week"
    else
        echo "$pkg_recent" | jq -r '.[] | "- \(.name) (\(.tagName)) - Published: \(.publishedAt)"'
    fi
}

# Function to save raw data for Claude
save_raw_data() {
    echo ""
    echo "💾 Saving raw data files..."

    # Create output directory
    mkdir -p changelog_data

    # Copy data files with timestamps
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    cp "$PRS_FILE" "changelog_data/prs_${timestamp}.json"
    cp "$JS_RELEASES_FILE" "changelog_data/js_releases_${timestamp}.json"
    cp "$PY_RELEASES_FILE" "changelog_data/py_releases_${timestamp}.json"
    cp "$PACKAGES_RELEASES_FILE" "changelog_data/packages_releases_${timestamp}.json"

    if [ -f "$OPENAPI_DIFF_FILE" ]; then
        cp "$OPENAPI_DIFF_FILE" "changelog_data/openapi_diff_${timestamp}.md"
    fi

    echo "   ✅ Raw data saved to changelog_data/ directory"
}

# Main execution
main() {
    setup_git_branch
    generate_openapi_diff
    collect_prs
    collect_releases
    generate_changelog_data
    save_raw_data

    echo ""
    echo "🎉 Data collection complete!"
    echo "=================================================================="
    echo ""
    echo "Current branch: $(git branch --show-current)"
    echo "Next steps:"
    echo "1. Review the data summary above"
    echo "2. Run: claude /project:generate-changelog"
    echo "3. Provide the collected data to generate the final changelog"
    echo "4. Create and review the changelog file"
    echo "5. Commit and push: git add . && git commit -m 'Add weekly changelog $CURRENT_DATE' && git push origin $BRANCH_NAME"
    echo ""
    echo "Raw data files are available in changelog_data/ directory"

    # Cleanup
    rm -rf "$TEMP_DIR"
}

# Run main function
main
