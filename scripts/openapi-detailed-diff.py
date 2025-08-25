#!/usr/bin/env python3
"""
OpenAPI Detailed Field-Level Diff Generator for ElevenLabs Changelog

This script compares two OpenAPI specifications and generates detailed
field-level changes suitable for changelog entries.

Usage:
    python3 scripts/openapi-detailed-diff.py [--from-date YYYY-MM-DD] [--output-format {markdown,json}]
    
Examples:
    python3 scripts/openapi-detailed-diff.py --from-date 2025-08-20
    python3 scripts/openapi-detailed-diff.py --from-date 2025-08-20 --output-format json
"""

import json
import sys
import subprocess
import argparse
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path

class OpenAPIFieldDiff:
    def __init__(self):
        self.openapi_path = "fern/apis/api/openapi.json"
        self.changes = {
            "new_endpoints": [],
            "removed_endpoints": [],
            "modified_endpoints": {},
            "breaking_changes": [],
            "backward_compatible_changes": []
        }
    
    def get_git_file_at_date(self, file_path: str, date: str) -> Optional[Dict]:
        """Get the OpenAPI spec from git at a specific date."""
        try:
            # Find the latest commit before or on the specified date
            cmd = [
                "git", "log", "--until", f"{date} 23:59:59",
                "--format=%H", "-n", "1", "--", file_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            commit_hash = result.stdout.strip()
            
            if not commit_hash:
                print(f"No commit found for {file_path} before {date}")
                return None
            
            # Get the file content at that commit
            cmd = ["git", "show", f"{commit_hash}:{file_path}"]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            return json.loads(result.stdout)
        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            print(f"Error getting file at date {date}: {e}")
            return None
    
    def get_current_openapi(self) -> Optional[Dict]:
        """Get the current OpenAPI spec from the API."""
        try:
            cmd = ["curl", "-s", "https://api.elevenlabs.io/openapi.json"]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return json.loads(result.stdout)
        except (subprocess.CalledProcessError, json.JSONDecodeError) as e:
            print(f"Error fetching current OpenAPI spec: {e}")
            return None
    
    def extract_schema_fields(self, schema: Dict, path: str = "") -> Dict[str, Dict]:
        """Recursively extract all fields from a schema with their details."""
        fields = {}
        
        if not isinstance(schema, dict):
            return fields
        
        # Handle object properties
        if "properties" in schema:
            for prop_name, prop_schema in schema["properties"].items():
                field_path = f"{path}.{prop_name}" if path else prop_name
                field_info = {
                    "type": prop_schema.get("type", "unknown"),
                    "required": prop_name in schema.get("required", []),
                    "nullable": prop_schema.get("nullable", False),
                    "description": prop_schema.get("description", ""),
                    "format": prop_schema.get("format"),
                    "enum": prop_schema.get("enum"),
                    "items": prop_schema.get("items"),
                }
                fields[field_path] = field_info
                
                # Recursively process nested objects
                if prop_schema.get("type") == "object" or "properties" in prop_schema:
                    nested_fields = self.extract_schema_fields(prop_schema, field_path)
                    fields.update(nested_fields)
        
        # Handle array items
        if "items" in schema and isinstance(schema["items"], dict):
            nested_fields = self.extract_schema_fields(schema["items"], f"{path}[]")
            fields.update(nested_fields)
        
        # Handle allOf, anyOf, oneOf
        for combine_key in ["allOf", "anyOf", "oneOf"]:
            if combine_key in schema:
                for sub_schema in schema[combine_key]:
                    nested_fields = self.extract_schema_fields(sub_schema, path)
                    fields.update(nested_fields)
        
        return fields
    
    def get_endpoint_schemas(self, spec: Dict) -> Dict[str, Dict]:
        """Extract all endpoint schemas with their request/response fields."""
        endpoints = {}
        
        if "paths" not in spec:
            return endpoints
        
        for path, path_obj in spec["paths"].items():
            for method, operation in path_obj.items():
                if method.upper() not in ["GET", "POST", "PUT", "PATCH", "DELETE"]:
                    continue
                
                endpoint_key = f"{method.upper()} {path}"
                endpoint_info = {
                    "operation_id": operation.get("operationId", ""),
                    "summary": operation.get("summary", ""),
                    "request_body": {},
                    "responses": {},
                    "parameters": []
                }
                
                # Extract request body schema
                if "requestBody" in operation:
                    content = operation["requestBody"].get("content", {})
                    for media_type, media_obj in content.items():
                        if "schema" in media_obj:
                            request_fields = self.extract_schema_fields(media_obj["schema"])
                            endpoint_info["request_body"][media_type] = request_fields
                
                # Extract response schemas
                if "responses" in operation:
                    for status_code, response_obj in operation["responses"].items():
                        content = response_obj.get("content", {})
                        for media_type, media_obj in content.items():
                            if "schema" in media_obj:
                                response_fields = self.extract_schema_fields(media_obj["schema"])
                                if status_code not in endpoint_info["responses"]:
                                    endpoint_info["responses"][status_code] = {}
                                endpoint_info["responses"][status_code][media_type] = response_fields
                
                # Extract parameters
                if "parameters" in operation:
                    for param in operation["parameters"]:
                        param_info = {
                            "name": param.get("name", ""),
                            "in": param.get("in", ""),
                            "required": param.get("required", False),
                            "type": param.get("schema", {}).get("type", "string"),
                            "description": param.get("description", "")
                        }
                        endpoint_info["parameters"].append(param_info)
                
                endpoints[endpoint_key] = endpoint_info
        
        return endpoints
    
    def compare_field_sets(self, old_fields: Dict, new_fields: Dict) -> Dict[str, List]:
        """Compare two sets of fields and return the differences."""
        changes = {
            "added": [],
            "removed": [],
            "modified": [],
            "type_changed": [],
            "required_changed": []
        }
        
        # Find added fields
        for field_path in new_fields:
            if field_path not in old_fields:
                changes["added"].append({
                    "field": field_path,
                    "details": new_fields[field_path]
                })
        
        # Find removed fields
        for field_path in old_fields:
            if field_path not in new_fields:
                changes["removed"].append({
                    "field": field_path,
                    "details": old_fields[field_path]
                })
        
        # Find modified fields
        for field_path in old_fields:
            if field_path in new_fields:
                old_field = old_fields[field_path]
                new_field = new_fields[field_path]
                
                # Check for type changes
                if old_field["type"] != new_field["type"]:
                    changes["type_changed"].append({
                        "field": field_path,
                        "old_type": old_field["type"],
                        "new_type": new_field["type"]
                    })
                
                # Check for required changes
                if old_field["required"] != new_field["required"]:
                    changes["required_changed"].append({
                        "field": field_path,
                        "old_required": old_field["required"],
                        "new_required": new_field["required"]
                    })
                
                # Check for other modifications
                modified_attrs = []
                for attr in ["nullable", "format", "enum"]:
                    if old_field.get(attr) != new_field.get(attr):
                        modified_attrs.append({
                            "attribute": attr,
                            "old_value": old_field.get(attr),
                            "new_value": new_field.get(attr)
                        })
                
                if modified_attrs:
                    changes["modified"].append({
                        "field": field_path,
                        "changes": modified_attrs
                    })
        
        return changes
    
    def compare_endpoints(self, old_spec: Dict, new_spec: Dict) -> Dict:
        """Compare endpoints between two OpenAPI specs."""
        old_endpoints = self.get_endpoint_schemas(old_spec)
        new_endpoints = self.get_endpoint_schemas(new_spec)
        
        results = {
            "new_endpoints": [],
            "removed_endpoints": [],
            "modified_endpoints": {}
        }
        
        # Find new endpoints
        for endpoint in new_endpoints:
            if endpoint not in old_endpoints:
                results["new_endpoints"].append({
                    "endpoint": endpoint,
                    "operation_id": new_endpoints[endpoint]["operation_id"],
                    "summary": new_endpoints[endpoint]["summary"]
                })
        
        # Find removed endpoints
        for endpoint in old_endpoints:
            if endpoint not in new_endpoints:
                results["removed_endpoints"].append({
                    "endpoint": endpoint,
                    "operation_id": old_endpoints[endpoint]["operation_id"],
                    "summary": old_endpoints[endpoint]["summary"]
                })
        
        # Find modified endpoints
        for endpoint in old_endpoints:
            if endpoint in new_endpoints:
                old_endpoint = old_endpoints[endpoint]
                new_endpoint = new_endpoints[endpoint]
                
                endpoint_changes = {}
                
                # Compare request body
                if old_endpoint["request_body"] or new_endpoint["request_body"]:
                    for media_type in set(old_endpoint["request_body"].keys()) | set(new_endpoint["request_body"].keys()):
                        old_fields = old_endpoint["request_body"].get(media_type, {})
                        new_fields = new_endpoint["request_body"].get(media_type, {})
                        
                        field_changes = self.compare_field_sets(old_fields, new_fields)
                        if any(field_changes.values()):
                            if "request_body" not in endpoint_changes:
                                endpoint_changes["request_body"] = {}
                            endpoint_changes["request_body"][media_type] = field_changes
                
                # Compare responses
                for status_code in set(old_endpoint["responses"].keys()) | set(new_endpoint["responses"].keys()):
                    old_response = old_endpoint["responses"].get(status_code, {})
                    new_response = new_endpoint["responses"].get(status_code, {})
                    
                    for media_type in set(old_response.keys()) | set(new_response.keys()):
                        old_fields = old_response.get(media_type, {})
                        new_fields = new_response.get(media_type, {})
                        
                        field_changes = self.compare_field_sets(old_fields, new_fields)
                        if any(field_changes.values()):
                            if "responses" not in endpoint_changes:
                                endpoint_changes["responses"] = {}
                            if status_code not in endpoint_changes["responses"]:
                                endpoint_changes["responses"][status_code] = {}
                            endpoint_changes["responses"][status_code][media_type] = field_changes
                
                # Compare parameters
                old_params = {p["name"]: p for p in old_endpoint["parameters"]}
                new_params = {p["name"]: p for p in new_endpoint["parameters"]}
                
                param_changes = {}
                # Added parameters
                for param_name in new_params:
                    if param_name not in old_params:
                        if "added" not in param_changes:
                            param_changes["added"] = []
                        param_changes["added"].append(new_params[param_name])
                
                # Removed parameters
                for param_name in old_params:
                    if param_name not in new_params:
                        if "removed" not in param_changes:
                            param_changes["removed"] = []
                        param_changes["removed"].append(old_params[param_name])
                
                # Modified parameters
                for param_name in old_params:
                    if param_name in new_params:
                        old_param = old_params[param_name]
                        new_param = new_params[param_name]
                        
                        if old_param != new_param:
                            if "modified" not in param_changes:
                                param_changes["modified"] = []
                            param_changes["modified"].append({
                                "name": param_name,
                                "old": old_param,
                                "new": new_param
                            })
                
                if param_changes:
                    endpoint_changes["parameters"] = param_changes
                
                if endpoint_changes:
                    results["modified_endpoints"][endpoint] = endpoint_changes
        
        return results
    
    def is_breaking_change(self, change_type: str, change_data: Dict) -> bool:
        """Determine if a change is breaking."""
        breaking_patterns = [
            # Field removals are breaking
            lambda ct, cd: ct in ["removed_field", "removed_parameter"],
            # Required field additions are breaking
            lambda ct, cd: ct == "added_field" and cd.get("details", {}).get("required", False),
            # Type changes are usually breaking
            lambda ct, cd: ct == "type_changed",
            # Making fields required is breaking
            lambda ct, cd: ct == "required_changed" and cd.get("new_required", False) and not cd.get("old_required", False),
            # Removing nullable is breaking
            lambda ct, cd: ct == "modified_field" and any(
                c.get("attribute") == "nullable" and c.get("old_value") == True and c.get("new_value") == False
                for c in cd.get("changes", [])
            )
        ]
        
        return any(pattern(change_type, change_data) for pattern in breaking_patterns)
    
    def format_changes_markdown(self, comparison_results: Dict) -> str:
        """Format the comparison results as markdown for changelog."""
        markdown = []
        
        # New Endpoints
        if comparison_results["new_endpoints"]:
            markdown.append("## New Endpoints\n")
            for endpoint in comparison_results["new_endpoints"]:
                summary = endpoint["summary"] or endpoint["operation_id"]
                markdown.append(f"- `{endpoint['endpoint']}` - {summary}")
            markdown.append("")
        
        # Modified Endpoints
        if comparison_results["modified_endpoints"]:
            markdown.append("## Updated Endpoints\n")
            
            breaking_endpoints = []
            compatible_endpoints = []
            
            for endpoint, changes in comparison_results["modified_endpoints"].items():
                has_breaking = self.has_breaking_changes(changes)
                
                endpoint_info = {
                    "endpoint": endpoint,
                    "changes": changes,
                    "breaking": has_breaking
                }
                
                if has_breaking:
                    breaking_endpoints.append(endpoint_info)
                else:
                    compatible_endpoints.append(endpoint_info)
            
            # Breaking changes first
            if breaking_endpoints:
                markdown.append("### Breaking Changes\n")
                for info in breaking_endpoints:
                    markdown.extend(self.format_endpoint_changes(info["endpoint"], info["changes"], True))
                markdown.append("")
            
            # Backward compatible changes
            if compatible_endpoints:
                markdown.append("### Backward Compatible Changes\n")
                for info in compatible_endpoints:
                    markdown.extend(self.format_endpoint_changes(info["endpoint"], info["changes"], False))
                markdown.append("")
        
        # Removed Endpoints
        if comparison_results["removed_endpoints"]:
            markdown.append("## Removed Endpoints\n")
            for endpoint in comparison_results["removed_endpoints"]:
                summary = endpoint["summary"] or endpoint["operation_id"]
                markdown.append(f"- `{endpoint['endpoint']}` - {summary}")
            markdown.append("")
        
        return "\n".join(markdown)
    
    def has_breaking_changes(self, endpoint_changes: Dict) -> bool:
        """Check if endpoint changes contain breaking changes."""
        # Check request body changes
        if "request_body" in endpoint_changes:
            for media_type, field_changes in endpoint_changes["request_body"].items():
                for change_type, changes in field_changes.items():
                    for change in changes:
                        if self.is_breaking_change(f"{change_type.rstrip('s')}_field", change):
                            return True
        
        # Check response changes
        if "responses" in endpoint_changes:
            for status_code, responses in endpoint_changes["responses"].items():
                for media_type, field_changes in responses.items():
                    for change_type, changes in field_changes.items():
                        for change in changes:
                            if self.is_breaking_change(f"{change_type.rstrip('s')}_field", change):
                                return True
        
        # Check parameter changes
        if "parameters" in endpoint_changes:
            param_changes = endpoint_changes["parameters"]
            if "removed" in param_changes:
                return True
            if "added" in param_changes:
                for param in param_changes["added"]:
                    if param.get("required", False):
                        return True
        
        return False
    
    def format_endpoint_changes(self, endpoint: str, changes: Dict, is_breaking: bool) -> List[str]:
        """Format changes for a single endpoint."""
        lines = []
        breaking_marker = "🚨 **BREAKING**" if is_breaking else "✅ **Compatible**"
        lines.append(f"- `{endpoint}` - {breaking_marker}")
        
        # Format request body changes
        if "request_body" in changes:
            for media_type, field_changes in changes["request_body"].items():
                lines.append(f"  - **Request ({media_type}):**")
                lines.extend(self.format_field_changes(field_changes, "    "))
        
        # Format response changes
        if "responses" in changes:
            for status_code, responses in changes["responses"].items():
                for media_type, field_changes in responses.items():
                    lines.append(f"  - **Response {status_code} ({media_type}):**")
                    lines.extend(self.format_field_changes(field_changes, "    "))
        
        # Format parameter changes
        if "parameters" in changes:
            param_changes = changes["parameters"]
            lines.append("  - **Parameters:**")
            
            if "added" in param_changes:
                for param in param_changes["added"]:
                    req_marker = " (required)" if param.get("required") else ""
                    lines.append(f"    - Added: `{param['name']}`{req_marker}")
            
            if "removed" in param_changes:
                for param in param_changes["removed"]:
                    lines.append(f"    - Removed: `{param['name']}`")
            
            if "modified" in param_changes:
                for param in param_changes["modified"]:
                    lines.append(f"    - Modified: `{param['name']}`")
        
        return lines
    
    def format_field_changes(self, field_changes: Dict, indent: str) -> List[str]:
        """Format field-level changes."""
        lines = []
        
        if field_changes.get("added"):
            for change in field_changes["added"]:
                field_name = change["field"]
                details = change["details"]
                req_marker = " (required)" if details.get("required") else ""
                type_info = f" `{details.get('type', 'unknown')}`" if details.get("type") else ""
                lines.append(f"{indent}- Added field: `{field_name}`{type_info}{req_marker}")
        
        if field_changes.get("removed"):
            for change in field_changes["removed"]:
                field_name = change["field"]
                lines.append(f"{indent}- Removed field: `{field_name}`")
        
        if field_changes.get("type_changed"):
            for change in field_changes["type_changed"]:
                field_name = change["field"]
                old_type = change["old_type"]
                new_type = change["new_type"]
                lines.append(f"{indent}- Type changed: `{field_name}` from `{old_type}` to `{new_type}`")
        
        if field_changes.get("required_changed"):
            for change in field_changes["required_changed"]:
                field_name = change["field"]
                old_req = change["old_required"]
                new_req = change["new_required"]
                status = "now required" if new_req else "no longer required"
                lines.append(f"{indent}- Requirement changed: `{field_name}` is {status}")
        
        if field_changes.get("modified"):
            for change in field_changes["modified"]:
                field_name = change["field"]
                lines.append(f"{indent}- Modified field: `{field_name}`")
                for attr_change in change["changes"]:
                    attr = attr_change["attribute"]
                    old_val = attr_change["old_value"]
                    new_val = attr_change["new_value"]
                    lines.append(f"{indent}  - {attr}: `{old_val}` → `{new_val}`")
        
        return lines
    
    def compare_specs(self, from_date: str, output_format: str = "markdown") -> str:
        """Main comparison function."""
        print(f"Comparing OpenAPI specs from {from_date} to current...")
        
        # Get old spec from git
        old_spec = self.get_git_file_at_date(self.openapi_path, from_date)
        if not old_spec:
            return "Error: Could not retrieve old OpenAPI spec"
        
        # Get current spec from API
        new_spec = self.get_current_openapi()
        if not new_spec:
            return "Error: Could not retrieve current OpenAPI spec"
        
        # Compare specs
        comparison_results = self.compare_endpoints(old_spec, new_spec)
        
        if output_format == "json":
            return json.dumps(comparison_results, indent=2)
        else:
            return self.format_changes_markdown(comparison_results)

def main():
    parser = argparse.ArgumentParser(description="Generate detailed OpenAPI field-level diff for changelog")
    parser.add_argument("--from-date", required=True, help="Date to compare from (YYYY-MM-DD)")
    parser.add_argument("--output-format", choices=["markdown", "json"], default="markdown",
                       help="Output format (default: markdown)")
    parser.add_argument("--output-file", help="Output file path (default: stdout)")
    
    args = parser.parse_args()
    
    differ = OpenAPIFieldDiff()
    result = differ.compare_specs(args.from_date, args.output_format)
    
    if args.output_file:
        Path(args.output_file).parent.mkdir(parents=True, exist_ok=True)
        with open(args.output_file, 'w') as f:
            f.write(result)
        print(f"Results written to {args.output_file}")
    else:
        print(result)

if __name__ == "__main__":
    main()