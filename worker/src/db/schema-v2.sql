-- Extended schema with user authentication, suggestions, and comments

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

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
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_feature_id) REFERENCES features(id) ON DELETE SET NULL
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
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_feature ON comments(feature_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

-- Update votes table to track user votes
-- First, drop the existing votes table if it exists
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
