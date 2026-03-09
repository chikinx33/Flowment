// Flowment API v2.0 - Production Schema
// Multi-user support with offline sync

import { Hono } from 'hono'

type Bindings = {
  DB?: D1Database
}

type Entry = {
  id?: number
  user_id: number
  entry_date: string // YYYY-MM-DD
  title?: string
  content: string
  emotion?: string
  mood_score?: number
  keywords_json?: string // JSON array
  client_id: string // UUID from client
  sync_status?: 'pending' | 'synced' | 'conflict'
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

// Default anonymous user ID
const DEFAULT_USER_ID = 1

// ==================== Helper Functions ====================

function generateClientId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

function parseKeywordsJson(json: string | null): string[] {
  if (!json) return []
  try {
    return JSON.parse(json)
  } catch {
    return []
  }
}

function stringifyKeywords(keywords: string[]): string {
  return JSON.stringify(keywords)
}

// ==================== API Routes ====================

const app = new Hono<{ Bindings: Bindings }>()

// Create or update entry
app.post('/api/entries', async (c) => {
  const { DB } = c.env
  
  if (!DB) {
    return c.json({ success: true, message: 'Entry saved (offline mode)' })
  }
  
  try {
    const body = await c.req.json()
    const {
      entry_date,
      title,
      content,
      emotion,
      mood_score,
      keywords, // string[]
      client_id
    } = body
    
    // Validation
    if (!entry_date || !content) {
      return c.json({ success: false, message: 'Missing required fields: entry_date, content' }, 400)
    }
    
    if (!client_id) {
      return c.json({ success: false, message: 'Missing client_id for sync' }, 400)
    }
    
    const user_id = DEFAULT_USER_ID
    const keywords_json = keywords ? stringifyKeywords(keywords) : null
    
    // Check if entry exists by user_id + entry_date
    const existing = await DB.prepare(`
      SELECT id, client_id FROM entries 
      WHERE user_id = ? AND entry_date = ? AND deleted_at IS NULL
    `).bind(user_id, entry_date).first()
    
    if (existing) {
      // Update existing entry
      await DB.prepare(`
        UPDATE entries 
        SET title = ?, content = ?, emotion = ?, mood_score = ?, 
            keywords_json = ?, sync_status = 'synced', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(title, content, emotion, mood_score, keywords_json, existing.id).run()
      
      return c.json({
        success: true,
        message: 'Entry updated',
        data: { id: existing.id, entry_date, user_id }
      })
    } else {
      // Insert new entry
      const result = await DB.prepare(`
        INSERT INTO entries (user_id, entry_date, title, content, emotion, mood_score, keywords_json, client_id, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')
      `).bind(user_id, entry_date, title, content, emotion, mood_score, keywords_json, client_id).run()
      
      return c.json({
        success: true,
        message: 'Entry created',
        data: { id: result.meta.last_row_id, entry_date, user_id }
      })
    }
  } catch (error) {
    console.error('Error saving entry:', error)
    return c.json({ success: false, message: 'Failed to save entry' }, 500)
  }
})

// Get all entries for user
app.get('/api/entries', async (c) => {
  const { DB } = c.env
  
  if (!DB) {
    return c.json({ success: true, data: [] })
  }
  
  try {
    const user_id = DEFAULT_USER_ID
    
    const { results } = await DB.prepare(`
      SELECT id, user_id, entry_date, title, content, emotion, mood_score, 
             keywords_json, client_id, sync_status, created_at, updated_at
      FROM entries 
      WHERE user_id = ? AND deleted_at IS NULL
      ORDER BY entry_date DESC
    `).bind(user_id).all()
    
    // Parse keywords_json
    const entries = results.map((entry: any) => ({
      ...entry,
      keywords: parseKeywordsJson(entry.keywords_json)
    }))
    
    return c.json({ success: true, data: entries })
  } catch (error) {
    console.error('Error fetching entries:', error)
    return c.json({ success: false, message: 'Failed to fetch entries' }, 500)
  }
})

// Get entry by date
app.get('/api/entries/:date', async (c) => {
  const { DB } = c.env
  const entry_date = c.req.param('date')
  
  if (!DB) {
    return c.json({ success: false, message: 'Entry not found' }, 404)
  }
  
  try {
    const user_id = DEFAULT_USER_ID
    
    const result = await DB.prepare(`
      SELECT id, user_id, entry_date, title, content, emotion, mood_score, 
             keywords_json, client_id, sync_status, created_at, updated_at
      FROM entries 
      WHERE user_id = ? AND entry_date = ? AND deleted_at IS NULL
    `).bind(user_id, entry_date).first()
    
    if (!result) {
      return c.json({ success: false, message: 'Entry not found' }, 404)
    }
    
    const entry = {
      ...result,
      keywords: parseKeywordsJson(result.keywords_json as string)
    }
    
    return c.json({ success: true, data: entry })
  } catch (error) {
    console.error('Error fetching entry:', error)
    return c.json({ success: false, message: 'Failed to fetch entry' }, 500)
  }
})

// Get entries by month
app.get('/api/entries/month/:yearMonth', async (c) => {
  const { DB } = c.env
  const yearMonth = c.req.param('yearMonth') // YYYY-MM
  
  if (!DB) {
    return c.json({ success: true, data: [] })
  }
  
  try {
    const user_id = DEFAULT_USER_ID
    
    const { results } = await DB.prepare(`
      SELECT id, user_id, entry_date, title, content, emotion, mood_score, 
             keywords_json, created_at
      FROM entries 
      WHERE user_id = ? AND entry_date LIKE ? AND deleted_at IS NULL
      ORDER BY entry_date DESC
    `).bind(user_id, `${yearMonth}%`).all()
    
    const entries = results.map((entry: any) => ({
      ...entry,
      keywords: parseKeywordsJson(entry.keywords_json)
    }))
    
    return c.json({ success: true, data: entries })
  } catch (error) {
    console.error('Error fetching monthly entries:', error)
    return c.json({ success: false, message: 'Failed to fetch entries' }, 500)
  }
})

// Soft delete entry
app.delete('/api/entries/:date', async (c) => {
  const { DB } = c.env
  const entry_date = c.req.param('date')
  
  if (!DB) {
    return c.json({ success: true, message: 'Entry deleted (offline mode)' })
  }
  
  try {
    const user_id = DEFAULT_USER_ID
    
    await DB.prepare(`
      UPDATE entries 
      SET deleted_at = CURRENT_TIMESTAMP, sync_status = 'pending'
      WHERE user_id = ? AND entry_date = ?
    `).bind(user_id, entry_date).run()
    
    return c.json({ success: true, message: 'Entry deleted' })
  } catch (error) {
    console.error('Error deleting entry:', error)
    return c.json({ success: false, message: 'Failed to delete entry' }, 500)
  }
})

// Bulk sync (for offline → online transition)
app.post('/api/sync', async (c) => {
  const { DB } = c.env
  
  if (!DB) {
    return c.json({ success: false, message: 'Database not available' }, 503)
  }
  
  try {
    const { entries: clientEntries } = await c.req.json() as { entries: Entry[] }
    
    if (!Array.isArray(clientEntries)) {
      return c.json({ success: false, message: 'Invalid entries format' }, 400)
    }
    
    const user_id = DEFAULT_USER_ID
    const results = []
    
    for (const entry of clientEntries) {
      try {
        // Check if entry exists by client_id
        const existing = await DB.prepare(`
          SELECT id FROM entries WHERE client_id = ?
        `).bind(entry.client_id).first()
        
        if (existing) {
          // Update
          await DB.prepare(`
            UPDATE entries 
            SET title = ?, content = ?, emotion = ?, mood_score = ?, 
                keywords_json = ?, sync_status = 'synced', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(
            entry.title,
            entry.content,
            entry.emotion,
            entry.mood_score,
            entry.keywords_json,
            existing.id
          ).run()
          
          results.push({ client_id: entry.client_id, status: 'updated' })
        } else {
          // Insert
          await DB.prepare(`
            INSERT INTO entries (user_id, entry_date, title, content, emotion, mood_score, keywords_json, client_id, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')
          `).bind(
            user_id,
            entry.entry_date,
            entry.title,
            entry.content,
            entry.emotion,
            entry.mood_score,
            entry.keywords_json,
            entry.client_id
          ).run()
          
          results.push({ client_id: entry.client_id, status: 'created' })
        }
      } catch (err) {
        results.push({ client_id: entry.client_id, status: 'error', error: String(err) })
      }
    }
    
    return c.json({ success: true, results })
  } catch (error) {
    console.error('Error syncing entries:', error)
    return c.json({ success: false, message: 'Sync failed' }, 500)
  }
})

export { app, generateClientId, parseKeywordsJson, stringifyKeywords }
