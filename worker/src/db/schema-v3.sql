-- Schema v3: Extended with RBAC (Role-Based Access Control)

-- Users table with roles and status
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user', -- 'user', 'moderator', 'admin'
  status TEXT DEFAULT 'active', -- 'active', 'banned'
  created_at INTEGER NOT NULL,
  last_login_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Admin emails configuration (emails that should be granted admin role)
CREATE TABLE IF NOT EXISTS admin_emails (
  email TEXT PRIMARY KEY,
  added_at INTEGER NOT NULL,
  added_by TEXT -- admin user id who added this email
);

-- User sessions (for magic link authentication)
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- Feature suggestions (user-submitted features)
CREATE TABLE IF NOT EXISTS feature_suggestions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_vi TEXT NOT NULL,
  desc_en TEXT,
  desc_vi TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  approved_feature_id TEXT, -- links to features table if approved
  reviewed_by TEXT, -- admin/moderator who reviewed
  reviewed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_feature_id) REFERENCES features(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_suggestions_user ON feature_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON feature_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_created ON feature_suggestions(created_at DESC);

-- Comments on features
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  feature_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id TEXT, -- for nested replies
  is_admin INTEGER DEFAULT 0, -- 1 if comment is from admin (deprecated, use user role instead)
  status TEXT DEFAULT 'active', -- 'active', 'hidden', 'deleted'
  moderated_by TEXT, -- moderator/admin who moderated this comment
  moderated_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_feature ON comments(feature_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_is_admin ON comments(is_admin);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

-- Update votes table to track user votes
DROP TABLE IF EXISTS votes;

CREATE TABLE votes (
  id TEXT PRIMARY KEY,
  feature_id TEXT NOT NULL,
  user_id TEXT, -- nullable for anonymous votes (legacy)
  fingerprint TEXT NOT NULL,
  vote_type TEXT NOT NULL, -- 'up' or 'down'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_votes_feature ON votes(feature_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_fingerprint ON votes(fingerprint);
CREATE INDEX IF NOT EXISTS idx_votes_created ON votes(created_at);

-- Audit log for admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, -- admin/moderator who performed the action
  action TEXT NOT NULL, -- 'ban_user', 'unban_user', 'change_role', 'hide_comment', etc.
  target_type TEXT NOT NULL, -- 'user', 'comment', 'suggestion', etc.
  target_id TEXT NOT NULL, -- id of the affected entity
  details TEXT, -- JSON string with additional details
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_type, target_id);
