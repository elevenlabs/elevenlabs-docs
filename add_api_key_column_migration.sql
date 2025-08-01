-- Migration: Add api_key column to dubbing_usage and transcription_usage tables
-- Purpose: Mirror the existing TTS usage table structure for consistent API key tracking
-- Date: $(date +%Y-%m-%d)

-- Add api_key column to dubbing_usage table
-- The column is made NULLABLE to allow existing records without breaking constraints
ALTER TABLE `dubbing_usage`
ADD COLUMN IF NOT EXISTS api_key STRING OPTIONS(description="API key used for the dubbing request");

-- Add api_key column to transcription_usage table  
-- The column is made NULLABLE to allow existing records without breaking constraints
ALTER TABLE `transcription_usage`
ADD COLUMN IF NOT EXISTS api_key STRING OPTIONS(description="API key used for the transcription request");

-- Optional: Create indexes on the new api_key columns for better query performance
-- Note: BigQuery automatically optimizes clustering, but these can help with analytics queries
-- CREATE INDEX IF NOT EXISTS idx_dubbing_usage_api_key ON `dubbing_usage`(api_key);
-- CREATE INDEX IF NOT EXISTS idx_transcription_usage_api_key ON `transcription_usage`(api_key);

-- Verification queries to confirm the columns were added successfully
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM `INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'dubbing_usage' 
  AND column_name = 'api_key';

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM `INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'transcription_usage' 
  AND column_name = 'api_key';