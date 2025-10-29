-- Migration: Add is_admin column to comments table
-- This allows marking comments made by admin users

ALTER TABLE comments ADD COLUMN is_admin INTEGER DEFAULT 0;

-- Create index for faster queries on admin comments
CREATE INDEX IF NOT EXISTS idx_comments_is_admin ON comments(is_admin);
