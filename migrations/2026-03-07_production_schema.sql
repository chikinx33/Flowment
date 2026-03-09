-- Flowment Production Database Schema v2.0
-- 날짜: 2026-03-07
-- 목적: 실제 서비스용 멀티유저 일기 시스템

-- =============================================================================
-- 1. users 테이블 - 사용자 인증 정보
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auth_provider TEXT NOT NULL CHECK(auth_provider IN ('anonymous','google','github','email')),
  auth_user_key TEXT NOT NULL UNIQUE,
  nickname TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스: 인증 조회 최적화
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(auth_provider, auth_user_key);

-- 기본 사용자 (테스트 및 익명 사용자용)
INSERT OR IGNORE INTO users (id, auth_provider, auth_user_key, nickname)
VALUES (1, 'anonymous', 'default-user', 'Anonymous User');

-- =============================================================================
-- 2. entries 테이블 - 일기 데이터 (user_id로 분리)
-- =============================================================================
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  entry_date DATE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  emotion TEXT CHECK(emotion IN ('joy','sadness','anger','fear','surprise','disgust','neutral') OR emotion IS NULL),
  mood_score INTEGER CHECK(mood_score BETWEEN 1 AND 10 OR mood_score IS NULL),
  keywords_json TEXT,
  client_id TEXT NOT NULL UNIQUE,
  sync_status TEXT DEFAULT 'synced' CHECK(sync_status IN ('pending','synced','conflict')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, entry_date)
);

-- 인덱스들
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_user_created ON entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_sync_status ON entries(sync_status);
CREATE INDEX IF NOT EXISTS idx_entries_client_id ON entries(client_id);
CREATE INDEX IF NOT EXISTS idx_entries_deleted ON entries(deleted_at);

-- =============================================================================
-- 검증 쿼리
-- =============================================================================
-- SELECT COUNT(*) AS user_count FROM users;
-- SELECT COUNT(*) AS entry_count FROM entries;
-- SELECT name FROM sqlite_master WHERE type='table';
-- SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='entries';
