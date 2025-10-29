-- Features table
CREATE TABLE IF NOT EXISTS features (
  id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_vi TEXT NOT NULL,
  desc_en TEXT,
  desc_vi TEXT,
  votes_up INTEGER DEFAULT 0,
  votes_down INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

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
  status TEXT DEFAULT 'pending',
  approved_feature_id TEXT,
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
  parent_id TEXT,
  is_admin INTEGER DEFAULT 0,
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
CREATE INDEX IF NOT EXISTS idx_comments_is_admin ON comments(is_admin);

-- Votes table (updated to track user votes)
CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  feature_id TEXT NOT NULL,
  user_id TEXT,
  fingerprint TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK(vote_type IN ('up', 'down')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_votes_feature ON votes(feature_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_fingerprint ON votes(fingerprint);
CREATE INDEX IF NOT EXISTS idx_votes_created ON votes(created_at);
