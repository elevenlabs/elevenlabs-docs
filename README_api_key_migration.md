# API Key Column Migration for Usage Tables

## Overview

This migration adds an `api_key` column to the `dubbing_usage` and `transcription_usage` tables in BigQuery to mirror the existing TTS usage table structure. This enables consistent API key tracking across all usage analytics.

## What's Being Changed

- **Table**: `dubbing_usage`
  - **New Column**: `api_key` (STRING, NULLABLE)
  - **Description**: "API key used for the dubbing request"

- **Table**: `transcription_usage`
  - **New Column**: `api_key` (STRING, NULLABLE)
  - **Description**: "API key used for the transcription request"

## Migration Details

### Column Specifications
- **Data Type**: `STRING`
- **Nullability**: `NULLABLE` (to accommodate existing records)
- **Description**: Added via OPTIONS clause for documentation

### Safety Measures
- Uses `ADD COLUMN IF NOT EXISTS` to prevent errors if columns already exist
- Columns are nullable to ensure existing records remain valid
- Includes verification queries to confirm successful migration

## Prerequisites

1. Ensure you have appropriate BigQuery permissions to alter tables
2. Confirm the target tables (`dubbing_usage` and `transcription_usage`) exist
3. Verify the project/dataset context is correct

## Running the Migration

```bash
# Execute the migration script
bq query --use_legacy_sql=false < add_api_key_column_migration.sql
```

Or run the SQL commands directly in the BigQuery console.

## Post-Migration Steps

1. **Verify Column Addition**: The migration script includes verification queries
2. **Update Application Code**: Modify data insertion logic to populate the new `api_key` field
3. **Analytics Integration**: The existing usage analytics system already supports `api_keys` breakdown, so no changes needed there
4. **Monitoring**: Monitor data ingestion to ensure the new column is being populated correctly

## Rollback Plan

If rollback is needed, the columns can be removed with:

```sql
ALTER TABLE `dubbing_usage` DROP COLUMN IF EXISTS api_key;
ALTER TABLE `transcription_usage` DROP COLUMN IF EXISTS api_key;
```

## Impact Assessment

- **Zero Downtime**: This is a non-breaking schema change
- **Existing Queries**: Will continue to work unchanged
- **Storage**: Minimal impact as new column starts as NULL for existing rows
- **Analytics**: Enhanced breakdown capabilities by API key

## Testing

After migration, test with sample queries:

```sql
-- Test dubbing usage with api_key breakdown
SELECT api_key, COUNT(*) as usage_count
FROM `dubbing_usage`
WHERE api_key IS NOT NULL
GROUP BY api_key;

-- Test transcription usage with api_key breakdown  
SELECT api_key, COUNT(*) as usage_count
FROM `transcription_usage`
WHERE api_key IS NOT NULL
GROUP BY api_key;
```

## Related Documentation

- [BigQuery ALTER TABLE Documentation](https://cloud.google.com/bigquery/docs/reference/standard-sql/data-definition-language#alter_table_add_column_statement)
- Usage Analytics API already supports `api_keys` breakdown type
- TTS usage table serves as the reference implementation