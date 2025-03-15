#!/usr/bin/env python3
import yaml
import re
import os
import sys

# this script checks that all links in the docs that are internal link to valid docs pages 
# this currently ignores paths that are /docs/api-reference/... , v2 should check those as well. 

def load_docs_yml(yaml_path):
    """Load and parse the docs.yml file."""
    with open(yaml_path, 'r') as f:
        return yaml.safe_load(f)

def extract_valid_paths(nav_data):
    """Extract all valid documentation paths from the navigation structure."""
    valid_paths = set()
    
    def process_item(item):
        if isinstance(item, dict):
            # Handle direct page definitions
            if 'path' in item:
                # Convert MDX path to docs URL path
                path = item['path'].replace('docs/pages/', '/docs/').replace('.mdx', '')
                valid_paths.add(path)
            
            # Handle sections and their contents
            for value in item.values():
                if isinstance(value, (list, dict)):
                    process_items(value)
                    
    def process_items(items):
        if isinstance(items, list):
            for item in items:
                process_item(item)
        elif isinstance(items, dict):
            process_item(items)

    # Process navigation structure
    for tab in nav_data.get('navigation', []):
        if 'layout' in tab:
            process_items(tab['layout'])
            
    # Add redirects to valid paths
    redirects = nav_data.get('redirects', [])
    for redirect in redirects:
        if 'destination' in redirect:
            valid_paths.add(redirect['destination'])

    return valid_paths

def find_doc_links(content):
    """Find all /docs/ links in the content."""
    links = set()
    
    # Pattern for standard markdown links and href attributes
    patterns = [
        r'(?:href=["\'])(\/docs\/[^"\'\s\)]+)',  # href="..." or href='...'
        r'(?:destination:\s*)(\/docs\/[^"\'\s\)]+)',  # destination: ...
        r'\[.*?\]\((\/docs\/[^"\'\s\)]+)\)',  # [...](...) markdown links
        r'(?:title=".*?" href=")(\/docs\/[^"\'\s\)]+)',  # Component href attributes
        r'(?:href=")(\/docs\/[^"\'\s\)]+)(?:".*?title=")',  # Reverse order of title and href
    ]
    
    # Special handling for MDX components
    mdx_components = [
        'Card',
        'Link',
        'Tab',
        'Note',
        'Warning',
        'Info',
        'CardGroup',
    ]
    
    # Add patterns for MDX components
    for component in mdx_components:
        patterns.append(f'<{component}[^>]*?href="(\/docs\/[^"\'\s\)]+)"')
    
    # Find all matches
    for pattern in patterns:
        matches = re.finditer(pattern, content, re.MULTILINE | re.DOTALL)
        for match in matches:
            # The last group contains the actual link
            link = match.group(1)
            links.add(link)
    
    return links

def validate_links(docs_dir, valid_paths):
    """Validate all /docs/ links in the documentation files."""
    invalid_links = []
    
    # Walk through all files in the docs directory
    for root, _, files in os.walk(docs_dir):
        for file in files:
            if file.endswith(('.mdx', '.md', '.yml')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Find all /docs/ links in the file
                    links = find_doc_links(content)
                    
                    # Check each link against valid paths
                    for link in links:
                        # Skip links that start with /docs/api-reference
                        if link.startswith('/docs/api-reference'):
                            continue
                            
                        # Remove any anchor tags from the link
                        base_link = link.split('#')[0]
                        if base_link not in valid_paths:
                            invalid_links.append({
                                'file': file_path,
                                'link': link
                            })
                except Exception as e:
                    print(f"Error processing file {file_path}: {str(e)}")
                    sys.exit(1)
    
    return invalid_links

def main():
    # Paths configuration
    docs_yml_path = 'fern/docs.yml'
    docs_dir = 'fern'
    
    # Load docs.yml and extract valid paths
    try:
        docs_data = load_docs_yml(docs_yml_path)
        valid_paths = extract_valid_paths(docs_data)
    except Exception as e:
        print(f"Error loading docs.yml: {str(e)}")
        sys.exit(1)
    
    # Validate links
    invalid_links = validate_links(docs_dir, valid_paths)
    
    # Report results
    if invalid_links:
        print("\n❌ Found broken internal links:")
        for item in invalid_links:
            print(f"\nFile: {item['file']}")
            print(f"Invalid link: {item['link']}")
        print(f"\nTotal broken links found: {len(invalid_links)}")
        sys.exit(1)
    else:
        print("✅ All internal links are valid!")
        sys.exit(0)

if __name__ == "__main__":
    main()