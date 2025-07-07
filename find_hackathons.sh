#!/bin/bash

# find_hackathons.sh - Script to find AI hackathons using Exa API
# Usage: ./find_hackathons.sh [custom_query]
# If no query provided, searches default categories

set -e

# Check if EXA_API_KEY is set
if [ -z "$EXA_API_KEY" ]; then
    echo "Error: EXA_API_KEY environment variable is not set"
    echo "Please set it with: export EXA_API_KEY=your-api-key"
    exit 1
fi

# Calculate date range (last week)
END_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Use -v flag for macOS date command compatibility
if [[ "$OSTYPE" == "darwin"* ]]; then
    START_DATE=$(date -u -v-7d +"%Y-%m-%dT%H:%M:%SZ")
else
    START_DATE=$(date -u -d "7 days ago" +"%Y-%m-%dT%H:%M:%SZ")
fi

echo "Searching for hackathons published between $START_DATE and $END_DATE"
echo "=================================================="

# Create output directory
OUTPUT_DIR="hackathon_results"
mkdir -p "$OUTPUT_DIR"

# Check if custom query is provided
if [ $# -gt 0 ]; then
    # Use custom query
    CUSTOM_QUERY="$*"
    echo "Using custom query: $CUSTOM_QUERY"
    declare -a CATEGORIES=("$CUSTOM_QUERY")
else
    # Use default categories
    echo "Using default categories"
    declare -a CATEGORIES=(
        "ai agents hackathons"
        "voice ai hackathons"
        "audio ai hackathons"
        "creator ai hackathons"
    )
fi

# Function to perform search
search_hackathons() {
    local query="$1"
    local category="$2"
    local filename="$3"
    
    echo "Searching for: $query"
    
    curl -s -X POST 'https://api.exa.ai/search' \
        -H "x-api-key: $EXA_API_KEY" \
        -H 'Content-Type: application/json' \
        -d "{
            \"query\": \"$query\",
            \"text\": true,
            \"numResults\": 10,
            \"startPublishedDate\": \"$START_DATE\",
            \"endPublishedDate\": \"$END_DATE\",
            \"startCrawlDate\": \"$START_DATE\",
            \"endCrawlDate\": \"$END_DATE\",
            \"type\": \"neural\"
        }" > "$OUTPUT_DIR/$filename"
    
    # Check if the request was successful
    if [ $? -eq 0 ]; then
        echo "✓ Results saved to $OUTPUT_DIR/$filename"
        
        # Extract and display basic info
        if command -v jq &> /dev/null; then
            echo "  Found $(cat "$OUTPUT_DIR/$filename" | jq '.results | length') results"
            echo "  Sample titles:"
            cat "$OUTPUT_DIR/$filename" | jq -r '.results[0:3] | .[] | "    - " + .title' 2>/dev/null || echo "    (No results or parsing error)"
        else
            echo "  (Install jq for better output formatting)"
        fi
    else
        echo "✗ Failed to fetch results for: $query"
    fi
    
    echo ""
}

# Search for each category
for i in "${!CATEGORIES[@]}"; do
    category="${CATEGORIES[$i]}"
    # Create safe filename from category
    filename="hackathons_$(echo "$category" | tr ' ' '_' | tr '[:upper:]' '[:lower:]').json"
    search_hackathons "$category" "$category" "$filename"
done

# Create a combined results file
echo "Creating combined results..."
if command -v jq &> /dev/null; then
    echo "{" > "$OUTPUT_DIR/combined_results.json"
    echo "  \"search_period\": {" >> "$OUTPUT_DIR/combined_results.json"
    echo "    \"start\": \"$START_DATE\"," >> "$OUTPUT_DIR/combined_results.json"
    echo "    \"end\": \"$END_DATE\"" >> "$OUTPUT_DIR/combined_results.json"
    echo "  }," >> "$OUTPUT_DIR/combined_results.json"
    
    if [ $# -gt 0 ]; then
        echo "  \"custom_query\": \"$CUSTOM_QUERY\"," >> "$OUTPUT_DIR/combined_results.json"
    fi
    
    echo "  \"categories\": {" >> "$OUTPUT_DIR/combined_results.json"
    
    for i in "${!CATEGORIES[@]}"; do
        category="${CATEGORIES[$i]}"
        filename="hackathons_$(echo "$category" | tr ' ' '_' | tr '[:upper:]' '[:lower:]').json"
        category_key=$(echo "$category" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')
        
        echo "    \"$category_key\": " >> "$OUTPUT_DIR/combined_results.json"
        cat "$OUTPUT_DIR/$filename" >> "$OUTPUT_DIR/combined_results.json"
        
        if [ $i -lt $((${#CATEGORIES[@]}-1)) ]; then
            echo "," >> "$OUTPUT_DIR/combined_results.json"
        fi
    done
    
    echo "  }" >> "$OUTPUT_DIR/combined_results.json"
    echo "}" >> "$OUTPUT_DIR/combined_results.json"
    
    echo "✓ Combined results saved to $OUTPUT_DIR/combined_results.json"
else
    echo "! Install jq to create combined results file"
fi

echo ""
echo "=================================================="
echo "Search complete! Results saved in $OUTPUT_DIR/"
echo ""
if [ $# -gt 0 ]; then
    echo "Custom query used: $CUSTOM_QUERY"
else
    echo "Used default categories for ElevenLabs hackathon discovery"
fi
echo ""
echo "To analyze these results with Claude Code, run:"
echo "  claude-code analyze-hackathons"
echo ""
echo "Files created:"
ls -la "$OUTPUT_DIR/"
