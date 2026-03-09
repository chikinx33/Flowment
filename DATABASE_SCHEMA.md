# Flowment Database Schema v2.0

## 📋 개요

실제 서비스용 멀티유저 지원 스키마
- **하나의 공용 DB** + `user_id`로 사용자 분리
- **오프라인 동기화** 지원 (`client_id`, `sync_status`)
- **MVP 우선**: `users`, `entries` 2개 테이블만 구현

---

## 🗂️ 테이블 구조

### 1. users
사용자 계정 정보

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 사용자 ID |
| auth_provider | TEXT | NOT NULL, CHECK | 인증 제공자 (anonymous, google, github, email) |
| auth_user_key | TEXT | NOT NULL, UNIQUE | 제공자별 고유 사용자 키 |
| nickname | TEXT | - | 닉네임 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 수정일시 |

**인덱스**:
- `idx_users_auth ON (auth_provider, auth_user_key)`

**기본 데이터**:
```sql
INSERT INTO users (id, auth_provider, auth_user_key, nickname) 
VALUES (1, 'anonymous', 'default-user', 'Anonymous User');
```

---

### 2. entries
일기 항목

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 일기 ID |
| user_id | INTEGER | NOT NULL, FK → users(id) | 사용자 ID |
| entry_date | DATE | NOT NULL | 일기 날짜 (사용자가 지정한 날짜) |
| title | TEXT | - | 제목 |
| content | TEXT | NOT NULL | 내용 |
| emotion | TEXT | CHECK (7가지 감정 또는 NULL) | 감정 (joy, sadness, anger, fear, surprise, disgust, neutral) |
| mood_score | INTEGER | CHECK (1-10 또는 NULL) | 기분 점수 |
| keywords_json | TEXT | - | 키워드 배열 JSON (예: `["keyword1", "keyword2"]`) |
| client_id | TEXT | NOT NULL, UNIQUE | 클라이언트 UUID (오프라인 동기화용) |
| sync_status | TEXT | DEFAULT 'synced', CHECK | 동기화 상태 (pending, synced, conflict) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 실제 생성일시 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 수정일시 |
| deleted_at | DATETIME | - | 삭제일시 (soft delete) |

**제약조건**:
- `UNIQUE(user_id, entry_date)` - 사용자당 하루에 하나의 일기만

**인덱스**:
- `idx_entries_user_date ON (user_id, entry_date DESC)` - 사용자별 날짜 조회
- `idx_entries_user_created ON (user_id, created_at DESC)` - 최근 생성 순 조회
- `idx_entries_sync_status ON (sync_status) WHERE sync_status != 'synced'` - 동기화 대기 조회
- `idx_entries_client_id ON (client_id)` - 클라이언트 ID 조회
- `idx_entries_deleted ON (deleted_at) WHERE deleted_at IS NOT NULL` - 삭제된 항목 조회

---

## 🔑 핵심 설계 원칙

### 1️⃣ 사용자 분리
```sql
-- ❌ 잘못된 예: user_id 없음
INSERT INTO entries (entry_date, content) VALUES ('2026-03-07', '...');

-- ✅ 올바른 예: user_id 필수
INSERT INTO entries (user_id, entry_date, content, client_id) 
VALUES (1, '2026-03-07', '...', 'uuid-here');
```

### 2️⃣ 날짜 분리
- **entry_date**: 사용자가 지정한 일기 날짜 (예: 어제 일기를 오늘 작성)
- **created_at**: 실제 데이터 생성 시간 (서버 시간)

```sql
-- 어제 일기를 오늘 작성하는 경우
INSERT INTO entries (user_id, entry_date, created_at, ...) 
VALUES (1, '2026-03-06', '2026-03-07 10:00:00', ...);
```

### 3️⃣ 오프라인 동기화
```javascript
// 클라이언트에서 UUID 생성
const client_id = generateClientId(); // '1709876543210-abc123-def456'

// 오프라인에서 로컬 저장
localStorage.setItem('entry', { client_id, entry_date, content, sync_status: 'pending' });

// 온라인 복귀 시 동기화
fetch('/api/sync', {
  method: 'POST',
  body: JSON.stringify({ entries: [{ client_id, entry_date, content }] })
});

// 서버에서 client_id로 중복 체크
SELECT * FROM entries WHERE client_id = ?;
```

### 4️⃣ Soft Delete
```sql
-- 삭제 시 deleted_at 설정
UPDATE entries 
SET deleted_at = CURRENT_TIMESTAMP, sync_status = 'pending'
WHERE user_id = ? AND entry_date = ?;

-- 조회 시 deleted_at IS NULL 조건
SELECT * FROM entries 
WHERE user_id = ? AND deleted_at IS NULL;
```

---

## 📊 주요 쿼리 패턴

### 사용자의 전체 일기 조회
```sql
SELECT id, entry_date, title, content, emotion, mood_score, keywords_json, created_at
FROM entries
WHERE user_id = ? AND deleted_at IS NULL
ORDER BY entry_date DESC;
```

### 특정 날짜 일기 조회
```sql
SELECT * FROM entries
WHERE user_id = ? AND entry_date = ? AND deleted_at IS NULL;
```

### 월별 일기 조회
```sql
SELECT * FROM entries
WHERE user_id = ? AND entry_date LIKE '2026-03%' AND deleted_at IS NULL
ORDER BY entry_date DESC;
```

### 동기화 대기 항목 조회
```sql
SELECT * FROM entries
WHERE sync_status = 'pending' AND deleted_at IS NULL;
```

### 키워드 빈도 분석
```sql
-- keywords_json 파싱 필요 (애플리케이션 레벨에서 처리)
SELECT keywords_json FROM entries
WHERE user_id = ? AND deleted_at IS NULL;
```

---

## 🔄 동기화 플로우

### 오프라인 → 온라인 전환
```
1. 클라이언트: pending 상태 항목 수집
   SELECT * FROM localStorage WHERE sync_status = 'pending'

2. 클라이언트 → 서버: 일괄 전송
   POST /api/sync
   Body: { entries: [{ client_id, entry_date, content, ... }] }

3. 서버: client_id로 중복 체크 후 INSERT or UPDATE
   SELECT id FROM entries WHERE client_id = ?
   
4. 서버 → 클라이언트: 동기화 결과 반환
   { success: true, results: [{ client_id, status: 'created' }] }

5. 클라이언트: sync_status = 'synced' 업데이트
```

---

## 🚀 마이그레이션 적용

### Cloudflare D1 Console에서 실행:

```sql
-- 파일: migrations/0001_production_schema.sql

-- 1. users 테이블 생성
CREATE TABLE IF NOT EXISTS users (...);
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(auth_provider, auth_user_key);

-- 2. entries 테이블 생성
CREATE TABLE IF NOT EXISTS entries (...);
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_user_created ON entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_sync_status ON entries(sync_status) WHERE sync_status != 'synced';
CREATE INDEX IF NOT EXISTS idx_entries_client_id ON entries(client_id);
CREATE INDEX IF NOT EXISTS idx_entries_deleted ON entries(deleted_at) WHERE deleted_at IS NOT NULL;

-- 3. 기본 익명 사용자 생성
INSERT OR IGNORE INTO users (id, auth_provider, auth_user_key, nickname) 
VALUES (1, 'anonymous', 'default-user', 'Anonymous User');
```

---

## 📈 확장 계획

### Phase 2: Memory Gates (나중에)
```sql
CREATE TABLE memory_gates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  entry_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  passed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (entry_id) REFERENCES entries(id)
);
```

### Phase 3: User Settings
```sql
CREATE TABLE user_settings (
  user_id INTEGER PRIMARY KEY,
  notification_time TEXT DEFAULT '08:00',
  dark_mode INTEGER DEFAULT 0,
  language TEXT DEFAULT 'ko',
  timezone TEXT DEFAULT 'Asia/Seoul',
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## ✅ 체크리스트

- [x] users 테이블 생성
- [x] entries 테이블 생성
- [x] user_id 필수 제약조건
- [x] entry_date와 created_at 분리
- [x] (user_id, entry_date) 인덱스
- [x] client_id UNIQUE 제약조건
- [x] keywords_json 컬럼
- [x] sync_status 컬럼
- [x] deleted_at (soft delete)
- [x] 기본 익명 사용자 생성

---

## 📝 API 엔드포인트

### POST /api/entries
일기 생성/수정
```json
{
  "entry_date": "2026-03-07",
  "title": "좋은 하루",
  "content": "오늘은 정말 평온한 하루였다...",
  "emotion": "joy",
  "mood_score": 8,
  "keywords": ["Serenity", "Peace"],
  "client_id": "1709876543210-abc123"
}
```

### GET /api/entries
전체 일기 조회

### GET /api/entries/:date
특정 날짜 일기 조회

### POST /api/sync
오프라인 동기화 (일괄 전송)

---

**Version**: 2.0.0  
**Last Updated**: 2026-03-07  
**Schema File**: `migrations/0001_production_schema.sql`
