#!/bin/bash

# Script to fetch merged PRs from elevenlabs/xi repo in the last week by specified users

set -e

# Define the target users
USERNAMES=(
    "kabell"
    "0xjtgi" 
    "ksergazy"
    "sedatcagdas"
    "jodik"
    "kamilk-11"
    "KacperWalentynowicz"
    "jameszhou02"
    "AngeloGiacco"
    "anitej-11"
    "am-holt"
    "christofip"
    "PaulAsjes"
    "louisjoecodes"
    "ISNIT0"
)

# Get date from 7 days ago
WEEK_AGO=$(date -d '7 days ago' +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d)

# Create output directory
mkdir -p xi_pr_data

# Initialize output file
OUTPUT_FILE="xi_pr_data/merged_prs.json"
echo "[]" > "$OUTPUT_FILE"

echo "Fetching merged PRs from elevenlabs/xi repo for the past week..."
echo "Date filter: merged after $WEEK_AGO"
echo "Target users: ${USERNAMES[*]}"
echo ""

# Temporary file for combining results
TEMP_FILE=$(mktemp)

# Array to collect all PR data
ALL_PRS="[]"

for username in "${USERNAMES[@]}"; do
    echo "Fetching PRs for user: $username"
    
    # Fetch PRs for this user (merged in the last week)
    USER_PRS=$(gh pr list \
        --repo elevenlabs/xi \
        --state merged \
        --author "$username" \
        --search "merged:>$WEEK_AGO" \
        --json number,title,url,mergedAt,author,labels,body \
        --limit 50 2>/dev/null | jq '.' 2>/dev/null || echo "[]")
    
    # Count PRs for this user
    PR_COUNT=$(echo "$USER_PRS" | jq length)
    echo "  Found $PR_COUNT merged PRs"
    
    # Merge with existing results
    if [ "$PR_COUNT" -gt 0 ]; then
        ALL_PRS=$(echo "$ALL_PRS $USER_PRS" | jq -s add)
    fi
done

# Sort by merged date (most recent first) and save
echo "$ALL_PRS" | jq 'sort_by(.mergedAt) | reverse' > "$OUTPUT_FILE"

# Summary
TOTAL_COUNT=$(echo "$ALL_PRS" | jq length)
echo ""
echo "Summary:"
echo "========="
echo "Total merged PRs found: $TOTAL_COUNT"
echo "Output saved to: $OUTPUT_FILE"

if [ "$TOTAL_COUNT" -gt 0 ]; then
    echo ""
    echo "PRs by user:"
    for username in "${USERNAMES[@]}"; do
        USER_COUNT=$(echo "$ALL_PRS" | jq --arg user "$username" '[.[] | select(.author.login == $user)] | length')
        if [ "$USER_COUNT" -gt 0 ]; then
            echo "  $username: $USER_COUNT PRs"
        fi
    done
    
    echo ""
    echo "Recent PRs:"
    echo "$ALL_PRS" | jq -r '.[:5] | .[] | "- \(.title) (#\(.number)) by @\(.author.login)"'
fi