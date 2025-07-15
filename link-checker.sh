#!/bin/bash

CURRENT_DATE=$(date '+%Y-%m-%d')
TEMP_DIR=$(mktemp -d)
BROKEN_LINKS_FILE="$TEMP_DIR/broken_links.txt"
SITEMAP_FILE="$TEMP_DIR/sitemap.xml"
SITEMAP_URLS_FILE="$TEMP_DIR/sitemap_urls.txt"
FILTERED_LINKS_FILE="$TEMP_DIR/filtered_links.txt"

echo "🔍 Enhanced Link Checker for ElevenLabs Documentation"
echo "============================================================="
echo "Current date: $CURRENT_DATE"
echo "Temp directory: $TEMP_DIR"
echo "============================================================="

# Function to cleanup temp files
cleanup() {
    echo "🧹 Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Function to check if we're in correct directory
check_directory() {
    if [ ! -d "fern" ]; then
        echo "❌ Error: Must be run from the root of elevenlabs-docs repository"
        exit 1
    fi
}

# Function to run link checker and capture output
run_link_checker() {
    echo "🔎 Running fern:broken-links check..."
    
    # Run the broken links command and capture output
    if ! pnpm run fern:broken-links > "$BROKEN_LINKS_FILE" 2>&1; then
        echo "   ⚠️  Link checker command failed, but continuing with analysis..."
    fi
    
    # Filter only lines with broken links that are specifically to docs:
    # 1. Absolute paths starting with /docs/

    {
        grep -E 'broken link to /docs/' "$BROKEN_LINKS_FILE" 2>/dev/null || true
    } | sort -u > "$FILTERED_LINKS_FILE"
    
    # Count non-empty lines properly
    local broken_count=0
    if [ -s "$FILTERED_LINKS_FILE" ]; then
        broken_count=$(grep -c '.' "$FILTERED_LINKS_FILE" 2>/dev/null || echo "0")
    fi
    echo "   Found $broken_count relevant broken links"
    
    return $broken_count
}

# Function to fetch sitemap from elevenlabs.io
fetch_production_sitemap() {
    echo "🌐 Fetching sitemap from elevenlabs.io/docs/sitemap.xml..."
    
    if curl -s "https://elevenlabs.io/docs/sitemap.xml" > "$SITEMAP_FILE"; then
        echo "   ✅ Successfully fetched production sitemap"
        
        # Extract URLs from sitemap using basic grep method (more reliable)
        echo "   🔍 Extracting URLs from sitemap..."
        grep -o '<loc>[^<]*</loc>' "$SITEMAP_FILE" | sed 's/<loc>//g;s/<\/loc>//g;s/^/  - /' > "$SITEMAP_URLS_FILE"
        
        # Count URLs properly
        local url_count=0
        if [ -s "$SITEMAP_URLS_FILE" ]; then
            url_count=$(grep -c '.' "$SITEMAP_URLS_FILE" 2>/dev/null || echo "0")
        fi
        echo "   📄 Extracted $url_count URLs from sitemap"
    else
        echo "   ❌ Failed to fetch production sitemap"
        return 1
    fi
}

# Function to fetch sitemap from local dev server
fetch_local_sitemap() {
    local port=${1:-3000}
    echo "🏠 Attempting to fetch sitemap from local dev server (port $port)..."
    
    # Check if dev server is running
    if curl -s "http://localhost:$port/docs/sitemap.xml" > "$SITEMAP_FILE" 2>/dev/null; then
        echo "   ✅ Successfully fetched local sitemap from port $port"
        
        # Extract URLs from sitemap using basic grep method (more reliable)
        echo "   🔍 Extracting URLs from local sitemap..."
        grep -o '<loc>[^<]*</loc>' "$SITEMAP_FILE" | sed 's/<loc>//g;s/<\/loc>//g;s/^/  - /' > "$SITEMAP_URLS_FILE"
        
        # Count URLs properly
        local url_count=0
        if [ -s "$SITEMAP_URLS_FILE" ]; then
            url_count=$(grep -c '.' "$SITEMAP_URLS_FILE" 2>/dev/null || echo "0")
        fi
        echo "   📄 Extracted $url_count URLs from local sitemap"
        return 0
    else
        echo "   ❌ Local dev server not accessible on port $port"
        return 1
    fi
}

# Function to start dev server and fetch sitemap
start_dev_server_and_fetch() {
    local port=${1:-3000}
    echo "🚀 Starting fern docs dev server on port $port..."
    
    # Start dev server in background
    pnpm run dev --port "$port" &
    local dev_pid=$!
    
    # Wait for server to start
    echo "   ⏳ Waiting for dev server to start..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            echo "   ✅ Dev server is running"
            break
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo "   ❌ Dev server failed to start within 60 seconds"
        kill $dev_pid 2>/dev/null || true
        return 1
    fi
    
    # Fetch sitemap from local server
    if fetch_local_sitemap "$port"; then
        kill $dev_pid 2>/dev/null || true
        return 0
    else
        kill $dev_pid 2>/dev/null || true
        return 1
    fi
}

# Function to analyze broken links against sitemap
analyze_broken_links() {
    echo "🔍 Analyzing broken links against sitemap..."
    
    if [ ! -s "$FILTERED_LINKS_FILE" ]; then
        echo "   ✅ No broken links to analyze"
        return 0
    fi
    
    if [ ! -s "$SITEMAP_URLS_FILE" ]; then
        echo "   ⚠️  No sitemap data available for analysis"
        return 0
    fi
    
    echo "   📊 Broken links analysis:"
    
    while IFS= read -r broken_link; do
        # Extract the actual URL from the broken link line
        local url=$(echo "$broken_link" | grep -o 'broken link to [^[:space:]]*' | sed 's/broken link to //')
        
        if [ -n "$url" ]; then
            # Check if URL exists in sitemap
            if grep -q "$url" "$SITEMAP_URLS_FILE" 2>/dev/null; then
                echo "   ✅ URL found in sitemap: $url"
            else
                echo "   ❌ URL NOT found in sitemap: $url"
            fi
        fi
    done < "$FILTERED_LINKS_FILE"
}

# Function to generate report
generate_report() {
    echo ""
    echo "📋 LINK CHECKER REPORT"
    echo "============================================================="
    echo "Date: $CURRENT_DATE"
    echo ""
    
    if [ -s "$FILTERED_LINKS_FILE" ]; then
        echo "🔴 Broken Links Found:"
        echo "---------------------"
        cat "$FILTERED_LINKS_FILE"
        echo ""
        
        if [ -s "$SITEMAP_URLS_FILE" ]; then
            echo "🌐 Sitemap Information:"
            echo "----------------------"
            echo "Sitemap source: $([ -f "$SITEMAP_FILE" ] && echo "Available" || echo "Not available")"
            echo "Total URLs in sitemap: $(wc -l < "$SITEMAP_URLS_FILE" 2>/dev/null || echo "0")"
            echo ""
            
            analyze_broken_links
        fi
    else
        echo "✅ No relevant broken links found!"
    fi
    
    echo ""
    echo "📁 Raw data files:"
    echo "- Broken links: $BROKEN_LINKS_FILE"
    echo "- Sitemap: $SITEMAP_FILE"
    echo "- Sitemap URLs: $SITEMAP_URLS_FILE"
    echo ""
}

# Function to save results for later use
save_results() {
    local output_dir="link_checker_results"
    mkdir -p "$output_dir"
    
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    
    # Copy results with timestamp
    [ -f "$BROKEN_LINKS_FILE" ] && cp "$BROKEN_LINKS_FILE" "$output_dir/broken_links_${timestamp}.txt"
    [ -f "$FILTERED_LINKS_FILE" ] && cp "$FILTERED_LINKS_FILE" "$output_dir/filtered_links_${timestamp}.txt"
    [ -f "$SITEMAP_FILE" ] && cp "$SITEMAP_FILE" "$output_dir/sitemap_${timestamp}.xml"
    [ -f "$SITEMAP_URLS_FILE" ] && cp "$SITEMAP_URLS_FILE" "$output_dir/sitemap_urls_${timestamp}.txt"
    
    echo "💾 Results saved to $output_dir/ directory"
}

# Main execution
main() {
    check_directory
    
    # Run link checker
    run_link_checker
    local broken_count=$?
    
    # If broken links found, fetch sitemap for analysis
    if [ $broken_count -gt 0 ]; then
        echo ""
        echo "🔧 Broken links detected, fetching sitemap for analysis..."
        
        # Try to fetch from production first
        if ! fetch_production_sitemap; then
            echo "   🔄 Production sitemap failed, trying local dev server..."
            
            # Try common dev server ports
            for port in 3000 3001 8080 8000; do
                if fetch_local_sitemap "$port"; then
                    break
                fi
            done
            
            # If all local attempts fail, try starting dev server
            if [ ! -s "$SITEMAP_URLS_FILE" ]; then
                echo "   🚀 No running dev server found, attempting to start one..."
                start_dev_server_and_fetch 3000
            fi
        fi
    fi
    
    # Generate report
    generate_report
    
    # Save results
    save_results
    
    # Exit with appropriate code
    if [ $broken_count -gt 0 ]; then
        echo "❌ Link checker found $broken_count broken links"
        exit 1
    else
        echo "✅ Link checker completed successfully"
        exit 0
    fi
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --port PORT         Use specific port for local dev server (default: 3000)"
        echo "  --production-only   Only fetch sitemap from production"
        echo "  --local-only        Only try local dev server"
        echo ""
        echo "Examples:"
        echo "  $0                    # Run with default settings"
        echo "  $0 --port 3001      # Use port 3001 for local dev server"
        echo "  $0 --production-only # Only fetch from elevenlabs.io"
        exit 0
        ;;
    --port)
        if [ -z "$2" ]; then
            echo "❌ Error: --port requires a port number"
            exit 1
        fi
        PORT="$2"
        shift 2
        ;;
    --production-only)
        PRODUCTION_ONLY=true
        shift
        ;;
    --local-only)
        LOCAL_ONLY=true
        shift
        ;;
    *)
        # Default behavior
        ;;
esac

# Run main function
main "$@"