#!/usr/bin/env python3
import yaml
import re
import os
import sys

# This script checks that all links in the docs that are internal links point to valid docs pages 
# This currently ignores paths that are /docs/api-reference/... , v2 should check those as well.

def slugify(text):
    """Convert text to URL-friendly slug format."""
    slug = re.sub(r'[^a-zA-Z0-9]+', '-', text.lower())
    slug = slug.strip('-')
    return slug

def load_docs_yml(yaml_path):
    """Load and parse the docs.yml file."""
    with open(yaml_path, 'r') as f:
        return yaml.safe_load(f)

def extract_valid_paths(nav_data):
    """Extract all valid documentation paths from the navigation structure."""
    valid_paths = set()
    
    def process_item(item, tab_path=None, section_paths=None):
        if not isinstance(item, dict):
            return
            
        if section_paths is None:
            section_paths = []
            
        if 'path' in item:
            direct_path = item['path'].replace('docs/pages/', '/docs/').replace('.mdx', '')
            valid_paths.add(direct_path)
            
            # Add parent paths as valid too
            parts = direct_path.split('/')
            for i in range(3, len(parts)):  # Start from /docs/something
                valid_paths.add('/'.join(parts[:i]))
        
        if 'page' in item:
            page_title = item['page']
            page_slug = item.get('slug', slugify(page_title))
            
            # Add the path for this page based on tab and section context
            if tab_path:
                full_path = tab_path
                if section_paths:
                    for i in range(1, len(section_paths) + 1):
                        section_path = f"{tab_path}/{'/'.join(section_paths[:i])}"
                        valid_paths.add(section_path)
                    
                    full_path = f"{tab_path}/{'/'.join(section_paths)}"
                
                full_path = f"{full_path}/{page_slug}"
                valid_paths.add(full_path)
        
        # Handle section definitions
        if 'section' in item:
            section_title = item['section']
            section_slug = item.get('slug', slugify(section_title))
            
            # Skip adding the section to path if skip-slug is true
            if not item.get('skip-slug', False):
                new_section_paths = section_paths + [section_slug]
                
                if tab_path:
                    section_path = f"{tab_path}/{'/'.join(new_section_paths)}"
                    valid_paths.add(section_path)
            else:
                new_section_paths = section_paths
                
            if 'contents' in item and isinstance(item['contents'], list):
                for content in item['contents']:
                    process_item(content, tab_path, new_section_paths)
            elif 'contents' in item and isinstance(item['contents'], dict):
                process_item(item['contents'], tab_path, new_section_paths)
        
        elif 'contents' in item and isinstance(item['contents'], list):
            for content in item['contents']:
                process_item(content, tab_path, section_paths)
        elif 'contents' in item and isinstance(item['contents'], dict):
            process_item(item['contents'], tab_path, section_paths)
                
    # Process navigation structure for each tab
    for tab in nav_data.get('navigation', []):
        tab_name = tab.get('tab')
        
        if 'layout' in tab and tab_name and isinstance(tab['layout'], list):
            tab_path = f"/docs/{tab_name}"
            
            # Add the base tab path
            valid_paths.add(tab_path)
            
            # Process all items under this tab
            for item in tab['layout']:
                process_item(item, tab_path)
    
    # Add redirects to valid paths
    redirects = nav_data.get('redirects', [])
    for redirect in redirects:
        if 'destination' in redirect:
            valid_paths.add(redirect['destination'])
        if 'source' in redirect:
            valid_paths.add(redirect['source'])

    return valid_paths

def find_doc_links(content):
    """Find all /docs/ links in the content."""
    links = set()
    
    # Pattern for standard markdown links and href attributes - improved to handle escaped quotes
    patterns = [
        r'(?:href=["\'"])(\/docs\/[^"\'"\s\)]+)',  # href="..." or href='...' with escaped quotes
        r'(?:destination:\s*)(\/docs\/[^"\'"\s\)]+)',  # destination: ...
        r'\[.*?\]\((\/docs\/[^"\'"\s\)]+)\)',  # [...](...) markdown links
        r'(?:title=".*?" href=")(\/docs\/[^"\'"\s\)]+)',  # Component href attributes
        r'(?:href=")(\/docs\/[^"\'"\s\)]+)(?:".*?title=")',  # Reverse order of title and href
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
        'Step',
        'Steps'
    ]
    
    # Add patterns for MDX components
    for component in mdx_components:
        patterns.append(fr'<{component}[^>]*?href="(/docs/[^"\'\s\)]+)"')
    
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
    file_errors = []
    
    # Walk through all files in the docs directory
    for root, _, files in os.walk(docs_dir):
        for file in files:
            if file.endswith(('.mdx', '.md', '.yml')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    links = find_doc_links(content)
                    
                    for link in links:
                        # Skip links that start with /docs/api-reference
                        if link.startswith('/docs/api-reference'):
                            continue
                        # Skip links that start with /docs/conversational-ai/api-reference
                        if link.startswith('/docs/conversational-ai/api-reference'):
                            continue
                        
                        # Skip non-docs links
                        if not link.startswith('/docs/') and not (link.startswith('https://elevenlabs.io/docs/') or link.startswith('http://elevenlabs.io/docs/')):
                            continue
                            
                        # Remove domain part from absolute URLs
                        if link.startswith(('https://elevenlabs.io', 'http://elevenlabs.io')):
                            base_link = link.replace('https://elevenlabs.io', '').replace('http://elevenlabs.io', '').split('#')[0]
                        else:
                            # Remove any anchor tags from the link
                            base_link = link.split('#')[0]
                            
                        if base_link not in valid_paths:
                            invalid_links.append({
                                'file': file_path,
                                'link': link
                            })
                except Exception as e:
                    # Collect errors instead of exiting
                    file_errors.append({
                        'file': file_path,
                        'error': str(e)
                    })
    
    return invalid_links, file_errors

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
    invalid_links, file_errors = validate_links(docs_dir, valid_paths)
    
    # Report results
    has_errors = False
    
    if file_errors:
        has_errors = True
        print("\n⚠️ Encountered errors processing these files:")
        for item in file_errors:
            print(f"\nFile: {item['file']}")
            print(f"Error: {item['error']}")
        print(f"\nTotal file errors: {len(file_errors)}")
    
    if invalid_links:
        has_errors = True
        print("\n❌ Found broken internal links:")
        for item in invalid_links:
            print(f"\nFile: {item['file']}")
            print(f"Invalid link: {item['link']}")
        print(f"\nTotal broken links found: {len(invalid_links)}")
    
    if not has_errors:
        print("✅ All internal links are valid!")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()