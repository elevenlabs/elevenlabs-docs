#!/usr/bin/env python3
import yaml
import re
import os
import sys

# This script checks that all links in the docs that are internal links point to valid docs pages 
# it is quite hacky at the moment and we should get fern to do this properly 
# if you're PR is blocked due to this you can just add to ** special_case_paths ** and angelo will look into fixing script

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
            # For API reference paths, handle them differently
            if 'api-reference/' in direct_path:
                direct_path = direct_path.replace('api-reference/pages/', 'api-reference/')
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
        
        # Handle API layout
        elif 'api' in item and 'layout' in item:
            api_tab_path = tab_path  # Use the current tab path
            
            # Process all items in the API layout
            for api_item in item['layout']:
                process_item(api_item, api_tab_path)
        
        elif 'contents' in item and isinstance(item['contents'], list):
            for content in item['contents']:
                process_item(content, tab_path, section_paths)
        elif 'contents' in item and isinstance(item['contents'], dict):
            process_item(item['contents'], tab_path, section_paths)
                
    # Process navigation structure for each tab
    for tab in nav_data.get('navigation', []):
        tab_name = tab.get('tab')
        
        if tab_name:
            tab_path = f"/docs/{tab_name}"
            
            # Add the base tab path
            valid_paths.add(tab_path)
            
            # Process all items under this tab
            if 'layout' in tab and isinstance(tab['layout'], list):
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

def extract_api_endpoints_from_docs_yml(docs_data):
    """Extract API endpoint paths defined in docs.yml."""
    endpoint_paths = set()
    
    def process_item(item, parent_path=None):
        if not isinstance(item, dict):
            return
        
        # Handle endpoint definitions
        if 'endpoint' in item:
            endpoint = item['endpoint']
            title = item.get('title', '')
            
            # Check if there's a custom slug defined
            if 'slug' in item:
                # Add the custom slug path directly
                custom_slug = item['slug']
                if custom_slug.startswith('/'):
                    # Handle absolute paths
                    if not custom_slug.startswith('/docs/'):
                        # Add the /docs prefix if needed
                        endpoint_paths.add(f"/docs/api-reference{custom_slug}")
                    else:
                        endpoint_paths.add(custom_slug)
                else:
                    # Handle relative paths
                    if parent_path:
                        endpoint_paths.add(f"{parent_path}/{custom_slug}")
            
            # Extract the path and method
            parts = endpoint.split(' ', 1)
            if len(parts) == 2:
                method, path = parts
                
                # Special handling for knowledge-base endpoints
                if 'convai/knowledge-base' in path:
                    group_name = 'knowledge-base'
                    
                    # For the RAG index endpoint specifically
                    if 'rag-index' in path:
                        endpoint_name = 'rag-index-status'
                        endpoint_paths.add(f"/docs/api-reference/{group_name}/{endpoint_name}")
                        endpoint_paths.add(f"/docs/conversational-ai/api-reference/{group_name}/{endpoint_name}")
                
                # Extract the last meaningful segment for the endpoint name
                path_parts = path.strip('/').split('/')
                endpoint_name = path_parts[-1] if path_parts else ''
                
                # If there's a title, use that for the endpoint name
                if title:
                    endpoint_name = slugify(title)
                
                # Determine the group from the path or parent context
                group_name = None
                
                # Check if we're in a section context (like Workspace)
                if parent_path and '/workspace' in parent_path.lower():
                    group_name = 'workspace'
                # For convai endpoints, use specific group names
                elif 'convai/agents' in path:
                    group_name = 'agents'
                elif 'convai/conversation' in path:
                    group_name = 'conversations'
                elif 'convai/secrets' in path:
                    group_name = 'workspace'
                elif len(path_parts) > 1:
                    group_name = path_parts[1]
                else:
                    group_name = path_parts[0] if path_parts else ''
                
                # Add the API reference path
                if parent_path and 'conversational-ai' in parent_path:
                    endpoint_paths.add(f"/docs/conversational-ai/api-reference/{slugify(group_name)}/{endpoint_name}")
                    endpoint_paths.add(f"/docs/conversational-ai/api-reference/{slugify(group_name)}")
                else:
                    endpoint_paths.add(f"/docs/api-reference/{slugify(group_name)}/{endpoint_name}")
                    endpoint_paths.add(f"/docs/api-reference/{slugify(group_name)}")
                    
                    # For convai endpoints, also add to conversational-ai section
                    if 'convai' in path:
                        endpoint_paths.add(f"/docs/conversational-ai/api-reference/{slugify(group_name)}/{endpoint_name}")
                        endpoint_paths.add(f"/docs/conversational-ai/api-reference/{slugify(group_name)}")
        
        # Process sections
        if 'section' in item:
            section_name = item['section']
            section_slug = item.get('slug', slugify(section_name))
            
            # Determine the new parent path
            new_parent_path = parent_path
            if parent_path and not item.get('skip-slug', False):
                new_parent_path = f"{parent_path}/{section_slug}"
            elif not parent_path:
                new_parent_path = f"/docs/api-reference/{section_slug}"
            
            # Add the section path
            if new_parent_path:
                endpoint_paths.add(new_parent_path)
                
                # If this is the Workspace section, add specific paths
                if section_name == 'Workspace':
                    endpoint_paths.add("/docs/api-reference/workspace")
                    endpoint_paths.add("/docs/conversational-ai/api-reference/workspace")
            
            # Process contents
            if 'contents' in item:
                if isinstance(item['contents'], list):
                    for content in item['contents']:
                        process_item(content, new_parent_path)
                elif isinstance(item['contents'], dict):
                    process_item(item['contents'], new_parent_path)
        
        # Process API layout
        if 'api' in item and 'layout' in item:
            api_path = "/docs/api-reference"
            endpoint_paths.add(api_path)
            
            for api_item in item['layout']:
                process_item(api_item, api_path)
        
        # Process other nested contents
        if 'contents' in item and 'section' not in item:
            if isinstance(item['contents'], list):
                for content in item['contents']:
                    process_item(content, parent_path)
            elif isinstance(item['contents'], dict):
                process_item(item['contents'], parent_path)
    
    # Process navigation structure
    for tab in docs_data.get('navigation', []):
        tab_name = tab.get('tab')
        
        if tab_name == 'api-reference' or tab_name == 'conversational-ai':
            base_path = f"/docs/{tab_name}"
            endpoint_paths.add(base_path)
            
            if 'layout' in tab and isinstance(tab['layout'], list):
                for item in tab['layout']:
                    process_item(item, base_path)
    
    return endpoint_paths

def extract_api_reference_paths_from_openapi(openapi_path):
    """Extract API reference paths from the OpenAPI JSON file."""
    api_paths = set()
    
    try:
        with open(openapi_path, 'r') as f:
            openapi_data = yaml.safe_load(f)
        
        # Process paths from the OpenAPI spec
        if 'paths' in openapi_data:
            for path, methods in openapi_data['paths'].items():
                for method, details in methods.items():
                    if method in ['get', 'post', 'put', 'delete', 'patch']:
                        # Skip ignored endpoints
                        if details.get('x-fern-ignore', False):
                            continue
                        
                        # Get the group name
                        group_name = None
                        
                        # Special case for convai paths
                        if 'convai/agents' in path and 'widget' in path:
                            group_name = 'widget'
                        elif 'convai/agents' in path:
                            group_name = 'agents'
                        elif 'convai/knowledge-base' in path:
                            group_name = 'knowledge-base'
                        elif 'convai/conversation' in path:
                            group_name = 'conversations'
                        elif 'convai/secrets' in path or 'convai/settings' in path:
                            group_name = 'workspace'
                        elif 'x-fern-sdk-group-name' in details:
                            # Handle both string and list values
                            sdk_group = details['x-fern-sdk-group-name']
                            if isinstance(sdk_group, str):
                                # Special mapping for conversational_ai to agents
                                if sdk_group == 'conversational_ai':
                                    # Check path segments for specific groups
                                    if 'knowledge-base' in path:
                                        group_name = 'knowledge-base'
                                    elif 'conversation' in path:
                                        group_name = 'conversations'
                                    elif 'widget' in path or 'embed' in path:
                                        group_name = 'widget'
                                    elif 'secrets' in path or 'settings' in path:
                                        group_name = 'workspace'
                                    else:
                                        group_name = 'agents'
                                else:
                                    group_name = sdk_group.replace('_', '-')
                            elif isinstance(sdk_group, list) and sdk_group:
                                group_val = str(sdk_group[0])
                                if group_val == 'conversational_ai':
                                    # Check path segments for specific groups
                                    if 'knowledge-base' in path:
                                        group_name = 'knowledge-base'
                                    elif 'conversation' in path:
                                        group_name = 'conversations'
                                    elif 'widget' in path or 'embed' in path:
                                        group_name = 'widget'
                                    else:
                                        group_name = 'agents'
                                else:
                                    group_name = group_val.replace('_', '-')
                        
                        # Default group name from path or tags
                        if not group_name:
                            # Try to get group from tags
                            if 'tags' in details and details['tags']:
                                group_name = details['tags'][0]
                            else:
                                parts = path.strip('/').split('/')
                                if len(parts) > 0:
                                    group_name = parts[0]
                                
                            # Special case for workspace paths
                            if 'workspace' in path:
                                group_name = 'workspace'
                            # Special case for widget paths
                            elif 'widget' in path or 'embed' in path:
                                group_name = 'widget'
                        
                        # Get the endpoint name
                        endpoint_name = ""
                        
                        # First check for x-fern-sdk-method-name as the preferred source for endpoint name
                        if 'x-fern-sdk-method-name' in details:
                            endpoint_name = slugify(details['x-fern-sdk-method-name'])
                        # Then check for summary
                        elif 'summary' in details:
                            endpoint_name = slugify(details['summary'])
                        elif 'operationId' in details:
                            endpoint_name = slugify(details['operationId'])
                        else:
                            # Use the last part of the path
                            parts = path.strip('/').split('/')
                            if parts:
                                endpoint_name = slugify(parts[-1])
                        
                        # Create API reference paths
                        if group_name:
                            group_slug = slugify(group_name)
                            
                            # Main API reference path
                            api_path = f"/docs/api-reference/{group_slug}/{endpoint_name}"
                            api_paths.add(api_path)
                            
                            # Group index page
                            api_paths.add(f"/docs/api-reference/{group_slug}")
                            
                            # For conversational AI endpoints
                            audiences = details.get('x-fern-audiences', [])
                            if (isinstance(audiences, list) and 'convai' in audiences) or group_name == 'convai' or 'convai' in path:
                                convai_path = f"/docs/conversational-ai/api-reference/{group_slug}/{endpoint_name}"
                                api_paths.add(convai_path)
                                api_paths.add(f"/docs/conversational-ai/api-reference/{group_slug}")
        
        # Add base paths
        api_paths.add("/docs/api-reference")
        api_paths.add("/docs/conversational-ai/api-reference")
        
    except Exception as e:
        print(f"Warning: Error processing OpenAPI spec: {str(e)}")
        import traceback
        traceback.print_exc()
    
    return api_paths

def extract_api_reference_paths_from_overrides(openapi_overrides_path):
    """Extract API reference paths from the OpenAPI overrides file."""
    api_paths = set()
    
    try:
        with open(openapi_overrides_path, 'r') as f:
            overrides = yaml.safe_load(f)
        
        # Process paths from the OpenAPI overrides
        if 'paths' in overrides:
            for path, methods in overrides['paths'].items():
                for method, details in methods.items():
                    if method in ['get', 'post', 'put', 'delete', 'patch']:
                        # Skip ignored endpoints
                        if details.get('x-fern-ignore', False):
                            continue
                        
                        # Get the summary as the endpoint name
                        endpoint_name = ""
                        if 'summary' in details:
                            endpoint_name = slugify(details['summary'])
                        else:
                            # If no summary, use the last part of the path
                            path_parts = path.rstrip('/').split('/')
                            if path_parts:
                                endpoint_name = slugify(path_parts[-1])
                        
                        # Get the group name for categorization
                        group_name = None
                        
                        # Special case for convai paths
                        if 'convai/agents' in path:
                            group_name = 'agents'
                        elif 'convai/knowledge-base' in path:
                            group_name = 'knowledge-base'
                        elif 'convai/workspace' in path:
                            group_name = 'workspace'
                        elif 'convai/conversation' in path:
                            group_name = 'conversations'  # Map conversation to conversations
                        elif 'x-fern-sdk-group-name' in details:
                            # Handle both string and list values
                            sdk_group = details['x-fern-sdk-group-name']
                            if isinstance(sdk_group, str):
                                # Special mapping for conversational_ai to agents
                                if sdk_group == 'conversational_ai':
                                    # Check path segments for specific groups
                                    if 'knowledge-base' in path:
                                        group_name = 'knowledge-base'
                                    elif 'conversation' in path:
                                        group_name = 'conversations'
                                    else:
                                        group_name = 'agents'
                                else:
                                    group_name = sdk_group.replace('_', '-')
                            elif isinstance(sdk_group, list) and sdk_group:
                                group_val = str(sdk_group[0])
                                if group_val == 'conversational_ai':
                                    # Check path segments for specific groups
                                    if 'knowledge-base' in path:
                                        group_name = 'knowledge-base'
                                    elif 'conversation' in path:
                                        group_name = 'conversations'
                                    else:
                                        group_name = 'agents'
                                else:
                                    group_name = group_val.replace('_', '-')
                        
                        # Extract from x-fern-groups if available
                        if not group_name and 'x-fern-groups' in overrides:
                            for group_key, group_info in overrides['x-fern-groups'].items():
                                if path.startswith(f"/{group_key}"):
                                    group_name = group_key
                                    break
                        
                        # Default categorization based on path
                        if not group_name:
                            parts = path.strip('/').split('/')
                            if len(parts) > 0:
                                # For convai paths, use 'agents' as the group
                                if parts[0] == 'v1' and len(parts) > 1 and parts[1] == 'convai':
                                    if len(parts) > 2 and parts[2] == 'agents':
                                        group_name = 'agents'
                                    else:
                                        group_name = 'convai'
                                else:
                                    group_name = parts[0]
                        
                        # Create API reference paths
                        if group_name:
                            # Slugify the group name for URL compatibility
                            group_slug = slugify(group_name)
                            
                            # Main API reference path
                            api_path = f"/docs/api-reference/{group_slug}/{endpoint_name}"
                            api_paths.add(api_path)
                            
                            # Also add the group index page
                            api_paths.add(f"/docs/api-reference/{group_slug}")
                            
                            # For conversational AI endpoints
                            audiences = details.get('x-fern-audiences', [])
                            if isinstance(audiences, list) and 'convai' in audiences:
                                convai_path = f"/docs/conversational-ai/api-reference/{group_slug}/{endpoint_name}"
                                api_paths.add(convai_path)
                                api_paths.add(f"/docs/conversational-ai/api-reference/{group_slug}")
        
        # Add the base API reference path
        api_paths.add("/docs/api-reference")
        api_paths.add("/docs/conversational-ai/api-reference")
        
    except Exception as e:
        print(f"Warning: Error processing OpenAPI overrides: {str(e)}")
        import traceback
        traceback.print_exc()
    
    return api_paths

def validate_links(docs_dir, valid_paths, api_reference_paths):
    """Validate all /docs/ links in the documentation files."""
    invalid_links = []
    file_errors = []
    
    special_case_paths = {
        "/docs/conversational-ai/api-reference/conversational-ai/websocket",
        "/docs/api-reference/phone-numbers/twilio-outbound-call",
        "/docs/api-reference/phone-numbers/create-phone-number"
    } #todo angelo: fix code so we can remove this 
    valid_paths.update(special_case_paths)
    
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
                        # Skip non-docs links
                        if not link.startswith('/docs/') and not (link.startswith('https://elevenlabs.io/docs/') or link.startswith('http://elevenlabs.io/docs/')):
                            continue
                            
                        # Remove domain part from absolute URLs
                        if link.startswith(('https://elevenlabs.io', 'http://elevenlabs.io')):
                            base_link = link.replace('https://elevenlabs.io', '').replace('http://elevenlabs.io', '').split('#')[0]
                        else:
                            # Remove any anchor tags from the link
                            base_link = link.split('#')[0]
                        
                        # Normalize the link by removing trailing slashes
                        normalized_link = base_link.rstrip('/')
                        
                        # Check if the link is valid in either regular paths or API reference paths
                        if normalized_link not in valid_paths and normalized_link not in api_reference_paths:
                            # Check for special case of nested conversational-ai paths
                            if '/docs/conversational-ai/api-reference/conversational-ai/' in normalized_link:
                                fixed_link = normalized_link.replace('/docs/conversational-ai/api-reference/conversational-ai/', '/docs/conversational-ai/api-reference/')
                                if fixed_link in valid_paths or fixed_link in api_reference_paths:
                                    continue
                            
                            # Also check with trailing slash added
                            if normalized_link + '/' in valid_paths or normalized_link + '/' in api_reference_paths:
                                continue
                                
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
    openapi_path = 'fern/apis/api/openapi.json'
    openapi_overrides_path = 'fern/apis/api/openapi-overrides.yml'
    
    # Load docs.yml and extract valid paths
    try:
        docs_data = load_docs_yml(docs_yml_path)
        valid_paths = extract_valid_paths(docs_data)
        print(f"Extracted {len(valid_paths)} valid paths from docs.yml structure")
    except Exception as e:
        print(f"Error loading docs.yml: {str(e)}")
        sys.exit(1)
    
    # Extract API endpoints defined in docs.yml
    try:
        endpoint_paths = extract_api_endpoints_from_docs_yml(docs_data)
        valid_paths.update(endpoint_paths)
        print(f"Added {len(endpoint_paths)} API endpoint paths from docs.yml")
    except Exception as e:
        print(f"Error extracting API endpoints from docs.yml: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Extract API reference paths from OpenAPI spec
    try:
        openapi_paths = extract_api_reference_paths_from_openapi(openapi_path)
        valid_paths.update(openapi_paths)
        print(f"Added {len(openapi_paths)} API paths from OpenAPI spec")
    except Exception as e:
        print(f"Error extracting paths from OpenAPI spec: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Extract API reference paths from OpenAPI overrides
    try:
        override_paths = extract_api_reference_paths_from_overrides(openapi_overrides_path)
        valid_paths.update(override_paths)
        print(f"Added {len(override_paths)} API paths from OpenAPI overrides")
    except Exception as e:
        print(f"Error extracting paths from OpenAPI overrides: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Validate links
    invalid_links, file_errors = validate_links(docs_dir, valid_paths, set())  # Empty set as we've combined all paths
    
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