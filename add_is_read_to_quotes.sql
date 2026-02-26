-- Add is_read column to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
