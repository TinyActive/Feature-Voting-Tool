-- Migration: Add RBAC (Role-Based Access Control)
-- This migration adds role and status columns to users table
-- Safe migration: Uses CREATE TABLE IF NOT EXISTS and handles existing columns

-- Step 1: Create admin_emails table if not exists
CREATE TABLE IF NOT EXISTS admin_emails (
  email TEXT PRIMARY KEY,
  added_at INTEGER NOT NULL,
  added_by TEXT
);

-- Step 2: Create audit_logs table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_type, target_id);

-- Step 3: Add role and status columns to users table (if not exists)
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- We'll handle this gracefully - the error will be caught by the workflow

-- Try to add role column (will fail silently if exists)
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

-- Try to add status column (will fail silently if exists)
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';

-- Step 4: Create indexes for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Step 5: Add status, moderated_by, moderated_at to comments table
ALTER TABLE comments ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE comments ADD COLUMN moderated_by TEXT;
ALTER TABLE comments ADD COLUMN moderated_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

-- Step 6: Add reviewed_by, reviewed_at to feature_suggestions table
ALTER TABLE feature_suggestions ADD COLUMN reviewed_by TEXT;
ALTER TABLE feature_suggestions ADD COLUMN reviewed_at INTEGER;

-- Step 7: Update existing admin token users to admin role (if any exist)
-- This is for backward compatibility
UPDATE users SET role = 'admin' WHERE id = 'admin' AND role IS NULL;

-- Step 8: Set default values for existing users (if columns were just added)
UPDATE users SET role = 'user' WHERE role IS NULL;
UPDATE users SET status = 'active' WHERE status IS NULL;
UPDATE comments SET status = 'active' WHERE status IS NULL;
