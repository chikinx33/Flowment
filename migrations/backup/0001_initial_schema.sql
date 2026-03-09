-- Entries table (일기 항목)
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  keyword TEXT NOT NULL,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Memory gates table (어제의 기억 테스트)
CREATE TABLE IF NOT EXISTS memory_gates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  passed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entry_id) REFERENCES entries(id)
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_time TEXT DEFAULT '08:00',
  dark_mode INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
CREATE INDEX IF NOT EXISTS idx_entries_keyword ON entries(keyword);
CREATE INDEX IF NOT EXISTS idx_memory_gates_entry_id ON memory_gates(entry_id);

-- Insert default settings
INSERT OR IGNORE INTO user_settings (id, notification_time, dark_mode) 
VALUES (1, '08:00', 0);
