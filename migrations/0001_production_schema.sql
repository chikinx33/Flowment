-- Flowment Production Schema v2.0
-- Multi-user support with offline sync capability

-- ==================== Users Table ====================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auth_provider TEXT NOT NULL,
  auth_user_key TEXT NOT NULL UNIQUE,
  nickname TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK(auth_provider IN ('anonymous', 'google', 'github', 'email'))
);

-- Index for auth lookups
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(auth_provider, auth_user_key);

-- ==================== Entries Table ====================
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  entry_date DATE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  emotion TEXT,
  mood_score INTEGER,
  keywords_json TEXT,
  client_id TEXT NOT NULL UNIQUE,
  sync_status TEXT DEFAULT 'synced',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, entry_date),
  CHECK(emotion IN ('joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral') OR emotion IS NULL),
  CHECK(mood_score >= 1 AND mood_score <= 10 OR mood_score IS NULL),
  CHECK(sync_status IN ('pending', 'synced', 'conflict'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_user_created ON entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_sync_status ON entries(sync_status);
CREATE INDEX IF NOT EXISTS idx_entries_client_id ON entries(client_id);
CREATE INDEX IF NOT EXISTS idx_entries_deleted ON entries(deleted_at);

-- ==================== Default Anonymous User ====================
-- For initial MVP without auth
INSERT OR IGNORE INTO users (id, auth_provider, auth_user_key, nickname) 
VALUES (1, 'anonymous', 'default-user', 'Anonymous User');

