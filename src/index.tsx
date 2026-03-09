import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB?: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/icons/*', serveStatic({ root: './public' }))
app.use('/screenshots/*', serveStatic({ root: './public' }))
app.use('/manifest.json', serveStatic({ root: './public' }))
app.use('/service-worker.js', serveStatic({ root: './public' }))

// Middleware to check DB availability and provide graceful fallback
app.use('/api/*', async (c, next) => {
  // If DB is not configured, continue with empty data responses
  // This allows the app to work without D1 in development
  await next()
})

// ==================== Helper Functions ====================

const DEFAULT_USER_ID = 1

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

// Memory Gate API V2.0 - entries 기반 퀴즈 생성
app.get('/api/memory-gate', async (c) => {
  const { DB } = c.env
  
  // If DB is not configured, return first-time user response
  if (!DB) {
    return c.json({ 
      success: false, 
      message: 'No memory gate available',
      firstTime: true 
    })
  }
  
  try {
    const user_id = DEFAULT_USER_ID
    
    // Get entries from last 3-7 days
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)
    const threeDaysAgo = new Date(today)
    threeDaysAgo.setDate(today.getDate() - 3)
    
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0]
    
    // Get random entry from 3-7 days ago with keywords
    const { results } = await DB.prepare(`
      SELECT id, entry_date, title, content, emotion, keywords_json
      FROM entries 
      WHERE user_id = ? 
        AND entry_date BETWEEN ? AND ?
        AND keywords_json IS NOT NULL
        AND deleted_at IS NULL
      ORDER BY RANDOM()
      LIMIT 1
    `).bind(user_id, sevenDaysAgoStr, threeDaysAgoStr).all()
    
    if (results.length === 0) {
      // No entries in range, return first-time message
      return c.json({ 
        success: false, 
        message: 'No memory gate available',
        firstTime: true 
      })
    }
    
    const entry = results[0]
    const keywords = parseKeywordsJson(entry.keywords_json as string)
    
    if (keywords.length === 0) {
      return c.json({ 
        success: false, 
        message: 'No keywords available',
        firstTime: true 
      })
    }
    
    // Pick a random keyword as correct answer
    const correctKeyword = keywords[Math.floor(Math.random() * keywords.length)]
    
    // Get other keywords for wrong options
    const allKeywordsResult = await DB.prepare(`
      SELECT DISTINCT keywords_json FROM entries 
      WHERE user_id = ? AND keywords_json IS NOT NULL AND deleted_at IS NULL
      LIMIT 20
    `).bind(user_id).all()
    
    const allKeywords = new Set<string>()
    allKeywordsResult.results.forEach((row: any) => {
      const kws = parseKeywordsJson(row.keywords_json)
      kws.forEach(kw => {
        if (kw !== correctKeyword) {
          allKeywords.add(kw)
        }
      })
    })
    
    // Generate wrong options (2 random keywords)
    const wrongOptions = Array.from(allKeywords)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
    
    // If not enough wrong options, add generic ones
    const genericOptions = ['행복', '슬픔', '평온', '기쁨', '걱정', '설렘']
    while (wrongOptions.length < 2) {
      const generic = genericOptions[Math.floor(Math.random() * genericOptions.length)]
      if (generic !== correctKeyword && !wrongOptions.includes(generic)) {
        wrongOptions.push(generic)
      }
    }
    
    // Shuffle options
    const options = [correctKeyword, ...wrongOptions].sort(() => Math.random() - 0.5)
    
    // Use content directly as the question (showing full sentence)
    const questionText = entry.content || `${new Date(entry.entry_date as string).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}에 쓴 일기`
    
    return c.json({
      success: true,
      data: {
        id: entry.id,
        entry_date: entry.entry_date,
        question: questionText,
        options: options,
        correctAnswer: correctKeyword
      }
    })
    
  } catch (error) {
    console.error('Error fetching memory gate:', error)
    return c.json({ 
      success: false, 
      message: 'Failed to fetch memory gate',
      firstTime: true 
    }, 500)
  }
})

// Verify memory gate answer
app.post('/api/memory-gate/verify', async (c) => {
  try {
    const { answer, correctAnswer } = await c.req.json()
    
    if (!answer || !correctAnswer) {
      return c.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, 400)
    }
    
    const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
    
    return c.json({
      success: true,
      correct: isCorrect,
      correctAnswer: correctAnswer,
      message: isCorrect ? '정답입니다! 🎉' : '다시 생각해보세요'
    })
  } catch (error) {
    console.error('Error verifying memory gate:', error)
    return c.json({ 
      success: false, 
      message: 'Failed to verify answer' 
    }, 500)
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

// Keyword frequency (V2.0 - JSON parsing)
app.get('/api/keywords/frequency', async (c) => {
  const { DB } = c.env
  
  if (!DB) {
    return c.json({ success: true, data: [] })
  }
  
  try {
    const user_id = DEFAULT_USER_ID
    
    // Get all entries with keywords
    const { results } = await DB.prepare(`
      SELECT keywords_json FROM entries 
      WHERE user_id = ? AND keywords_json IS NOT NULL AND deleted_at IS NULL
    `).bind(user_id).all()
    
    // Parse and count keywords
    const keywordFreq: { [key: string]: number } = {}
    
    results.forEach((row: any) => {
      const keywords = parseKeywordsJson(row.keywords_json)
      keywords.forEach(kw => {
        keywordFreq[kw] = (keywordFreq[kw] || 0) + 1
      })
    })
    
    // Convert to array and sort by frequency
    const keywordArray = Object.entries(keywordFreq)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)  // Top 20
    
    return c.json({ success: true, data: keywordArray })
  } catch (error) {
    console.error('Error fetching keyword frequency:', error)
    return c.json({ success: false, message: 'Failed to fetch keywords' }, 500)
  }
})

// Get user settings (v2 - 설정 테이블 없으므로 기본값만)
app.get('/api/settings', async (c) => {
  return c.json({ 
    success: true, 
    data: { 
      id: 1, 
      notification_time: '21:00', 
      dark_mode: false 
    } 
  })
})

// Update user settings (v2 - 설정 테이블 없으므로 더미 응답)
app.post('/api/settings', async (c) => {
  return c.json({ success: true, message: 'Settings updated (stored in local cache)' })
})

// ==================== Frontend Routes ====================

// Memory Gate Page (Landing)
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Flowment</title>
        
        <!-- PWA Meta Tags -->
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Flowment">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
        
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@300,0..1&display=swap" rel="stylesheet"/>
        
        <script>
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                "primary": "#4f46e5", // Indigo 600
                "primary-light": "#6366f1",
                "surface": "#ffffff",
                "surface-dark": "#0f172a",
              },
              fontFamily: {
                "sans": ["'Pretendard'", "sans-serif"],
                "serif": ["'Newsreader'", "serif"],
              },
              boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
              },
              animation: {
                'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'float': 'float 6s ease-in-out infinite',
              },
              keyframes: {
                fadeIn: {
                  '0%': { opacity: 0, transform: 'translateY(10px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                float: {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' },
                }
              }
            },
          },
        }
        </script>
        <style>
          body { 
            font-family: 'Pretendard', sans-serif; 
            min-height: 100dvh;
            -webkit-tap-highlight-color: transparent;
          }
          .font-serif {
            font-family: 'Newsreader', serif;
          }
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          }
          /* Hide scrollbar */
          *::-webkit-scrollbar { display: none; }
          * { -ms-overflow-style: none; scrollbar-width: none; }
          
          /* Glassmorphism utilities classes */
          .glass-nav {
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid rgba(255, 255, 255, 0.3);
          }
          .dark .glass-nav {
            background: rgba(15, 23, 42, 0.75);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          .page-transition {
            animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        </style>
    </head>
    <body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <!-- PWA Install Banner -->
        <div id="pwa-install-banner" class="hidden fixed top-0 left-0 right-0 z-50 bg-primary text-white shadow-lg">
            <div class="max-w-md mx-auto p-4 flex items-center justify-between">
                <div class="flex items-center space-x-3 flex-1">
                    <img src="/icons/icon-72.png?v=2" alt="Flowment" class="w-12 h-12 rounded-lg">
                    <div class="flex-1">
                        <p class="font-semibold text-sm">Flowment 앱 설치</p>
                        <p class="text-xs opacity-90">홈 화면에 추가하고 빠르게 실행하세요</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="pwa-install-button" class="px-4 py-2 bg-white text-primary rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
                        설치
                    </button>
                    <button id="pwa-install-close" class="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <span class="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="w-full max-w-md mx-auto min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <!-- Main Content Area -->
            <div class="flex-1 flex flex-col p-6" id="app">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p class="mt-4 text-slate-500 dark:text-slate-400 text-sm">Loading...</p>
                </div>
            </div>

            <!-- Decorative Background Element -->
            <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full h-full pointer-events-none opacity-30">
                <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]"></div>
                <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
            </div>
        </div>

        
        <script src="/static/pwa-register.js"></script>
        <script src="/static/cache.js"></script>
        <script src="/static/landing.js"></script>
    </body>
    </html>
  `)
})

// Writing Page
app.get('/write', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Flowment</title>
        
        <!-- PWA Meta Tags -->
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Flowment">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
        
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@300,0..1&display=swap" rel="stylesheet"/>
        
        <script>
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                "primary": "#4f46e5", // Indigo 600
                "primary-light": "#6366f1",
                "surface": "#ffffff",
                "surface-dark": "#0f172a",
              },
              fontFamily: {
                "sans": ["'Pretendard'", "sans-serif"],
                "serif": ["'Newsreader'", "serif"],
              },
              boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
              },
              animation: {
                'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'float': 'float 6s ease-in-out infinite',
              },
              keyframes: {
                fadeIn: {
                  '0%': { opacity: 0, transform: 'translateY(10px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                float: {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' },
                }
              }
            },
          },
        }
        </script>
        <style>
          body { 
            font-family: 'Pretendard', sans-serif; 
            min-height: 100dvh;
            -webkit-tap-highlight-color: transparent;
          }
          .font-serif {
            font-family: 'Newsreader', serif;
          }
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          }
          /* Hide scrollbar */
          *::-webkit-scrollbar { display: none; }
          * { -ms-overflow-style: none; scrollbar-width: none; }
          
          /* Glassmorphism utilities classes */
          .glass-nav {
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid rgba(255, 255, 255, 0.3);
          }
          .dark .glass-nav {
            background: rgba(15, 23, 42, 0.75);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          .page-transition {
            animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        </style>
    </head>
    <body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <!-- PWA Install Banner -->
        <div id="pwa-install-banner" class="hidden fixed top-0 left-0 right-0 z-50 bg-primary text-white shadow-lg">
            <div class="max-w-md mx-auto p-4 flex items-center justify-between">
                <div class="flex items-center space-x-3 flex-1">
                    <img src="/icons/icon-72.png?v=2" alt="Flowment" class="w-12 h-12 rounded-lg">
                    <div class="flex-1">
                        <p class="font-semibold text-sm">Flowment 앱 설치</p>
                        <p class="text-xs opacity-90">홈 화면에 추가하고 빠르게 실행하세요</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="pwa-install-button" class="px-4 py-2 bg-white text-primary rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
                        설치
                    </button>
                    <button id="pwa-install-close" class="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <span class="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="w-full max-w-md mx-auto min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <!-- Top Navigation Bar -->
        <header class="sticky top-0 z-20 bg-transparent pt-6 flex items-center justify-between px-4 py-4">
            <button onclick="window.location.href='/'" class="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors flex items-center">
                <span class="material-symbols-outlined text-2xl">close</span>
            </button>
            <div class="text-center">
                <h1 class="text-xs uppercase tracking-widest font-medium text-slate-500 dark:text-slate-400" id="current-date">Loading...</h1>
            </div>
            <button id="save-btn" class="text-primary font-semibold text-base hover:opacity-80 transition-opacity">
                Save
            </button>
        </header>

        <!-- Main Writing Area -->
        <main class="flex-1 flex flex-col px-4 py-6 w-full">
            <!-- Content Input (Single Line) -->
            <div class="flex-1 flex flex-col justify-center">
                <textarea id="content-textarea" class="w-full bg-transparent border-none focus:ring-0 text-lg dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none leading-relaxed p-0 text-slate-700 text-center" placeholder="오늘 하루를 한 문장으로 기록해보세요..." spellcheck="false" rows="3" maxlength="100"></textarea>
                <div class="text-center text-xs text-slate-400 mt-2">
                    <span id="char-count">0</span> / 100
                </div>
            </div>

            <!-- Keywords Input (3 Fixed Fields) -->
            <div class="mt-6 space-y-3">
                <input id="keyword-input-1" class="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus:ring-0 text-center text-sm py-2 px-0 transition-colors text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="키워드 1" type="text" maxlength="20"/>
                <input id="keyword-input-2" class="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus:ring-0 text-center text-sm py-2 px-0 transition-colors text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="키워드 2" type="text" maxlength="20"/>
                <input id="keyword-input-3" class="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus:ring-0 text-center text-sm py-2 px-0 transition-colors text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="키워드 3" type="text" maxlength="20"/>
            </div>
        </main>

        <!-- Bottom Navigation -->
        
        <!-- Floating Bottom Navigation Bar -->
        <div class="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <nav class="pointer-events-auto flex justify-between items-center w-full max-w-sm glass-nav rounded-[2rem] px-6 py-3 shadow-glass dark:shadow-glass-dark transition-all duration-300">
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors " href="/">
                    <span class="material-symbols-outlined text-[26px]">home</span>
                </a>
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors " href="/calendar">
                    <span class="material-symbols-outlined text-[26px]">calendar_month</span>
                </a>
                <div class="relative -top-6 transform hover:scale-105 transition-transform">
                    <button class="bg-primary shadow-indigo-600/30 text-white size-14 rounded-full flex items-center justify-center shadow-lg ring-[6px] ring-slate-50 dark:ring-slate-950 transition-all duration-300">
                        <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1">edit</span>
                    </button>
                </div>
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors " href="/timeline">
                    <span class="material-symbols-outlined text-[26px]">history</span>
                </a>
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors " href="/settings">
                    <span class="material-symbols-outlined text-[26px]">tune</span>
                </a>
            </nav>
        </div>
        </div>

        
        <script src="/static/pwa-register.js"></script>
        <script src="/static/cache.js"></script>
        <script src="/static/write.js"></script>
    </body>
    </html>
  `)
})

// Timeline Page
app.get('/timeline', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Flowment</title>
        
        <!-- PWA Meta Tags -->
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Flowment">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
        
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@300,0..1&display=swap" rel="stylesheet"/>
        
        <script>
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                "primary": "#4f46e5", // Indigo 600
                "primary-light": "#6366f1",
                "surface": "#ffffff",
                "surface-dark": "#0f172a",
              },
              fontFamily: {
                "sans": ["'Pretendard'", "sans-serif"],
                "serif": ["'Newsreader'", "serif"],
              },
              boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
              },
              animation: {
                'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'float': 'float 6s ease-in-out infinite',
              },
              keyframes: {
                fadeIn: {
                  '0%': { opacity: 0, transform: 'translateY(10px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                float: {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' },
                }
              }
            },
          },
        }
        </script>
        <style>
          body { 
            font-family: 'Pretendard', sans-serif; 
            min-height: 100dvh;
            -webkit-tap-highlight-color: transparent;
          }
          .font-serif {
            font-family: 'Newsreader', serif;
          }
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          }
          /* Hide scrollbar */
          *::-webkit-scrollbar { display: none; }
          * { -ms-overflow-style: none; scrollbar-width: none; }
          
          /* Glassmorphism utilities classes */
          .glass-nav {
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid rgba(255, 255, 255, 0.3);
          }
          .dark .glass-nav {
            background: rgba(15, 23, 42, 0.75);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          .page-transition {
            animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        </style>
    </head>
    <body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <!-- PWA Install Banner -->
        <div id="pwa-install-banner" class="hidden fixed top-0 left-0 right-0 z-50 bg-primary text-white shadow-lg">
            <div class="max-w-md mx-auto p-4 flex items-center justify-between">
                <div class="flex items-center space-x-3 flex-1">
                    <img src="/icons/icon-72.png?v=2" alt="Flowment" class="w-12 h-12 rounded-lg">
                    <div class="flex-1">
                        <p class="font-semibold text-sm">Flowment 앱 설치</p>
                        <p class="text-xs opacity-90">홈 화면에 추가하고 빠르게 실행하세요</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="pwa-install-button" class="px-4 py-2 bg-white text-primary rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
                        설치
                    </button>
                    <button id="pwa-install-close" class="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <span class="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="w-full max-w-md mx-auto min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <!-- Header -->
        <header class="sticky top-0 z-20 bg-transparent pt-6 px-4 py-4">
            <div class="w-full flex items-center justify-between">
                <button onclick="window.location.href='/'" class="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors">
                    <span class="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 class="text-2xl font-serif font-medium tracking-tight">Timeline</h1>
                <div class="w-10"></div>
            </div>
        </header>

        <!-- Main Content: Timeline -->
        <main class="flex-1 w-full px-4 py-6" id="timeline-content">
            <div class="text-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p class="mt-4 text-slate-500 dark:text-slate-400 text-sm">Loading timeline...</p>
            </div>
        </main>

        <!-- Bottom Navigation Bar -->
        
        <!-- Floating Bottom Navigation Bar -->
        <div class="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <nav class="pointer-events-auto flex justify-between items-center w-full max-w-sm glass-nav rounded-[2rem] px-6 py-3 shadow-glass dark:shadow-glass-dark transition-all duration-300">
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors " href="/">
                    <span class="material-symbols-outlined text-[26px]">home</span>
                </a>
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors " href="/calendar">
                    <span class="material-symbols-outlined text-[26px]">calendar_month</span>
                </a>
                <div class="relative -top-6 transform hover:scale-105 transition-transform">
                    <button onclick="window.location.href='/write'" class="bg-primary hover:bg-indigo-500 text-white size-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 ring-[6px] ring-white/50 dark:ring-slate-900/50 transition-all duration-300">
                        <span class="material-symbols-outlined text-3xl">add</span>
                    </button>
                </div>
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors text-primary dark:text-indigo-400" href="/timeline">
                    <span class="material-symbols-outlined text-[26px]">history</span>
                </a>
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors " href="/settings">
                    <span class="material-symbols-outlined text-[26px]">tune</span>
                </a>
            </nav>
        </div>
        </div>

        
        <script src="/static/pwa-register.js"></script>
        <script src="/static/cache.js"></script>
        <script src="/static/timeline.js"></script>
    </body>
    </html>
  `)
})

// Calendar Page
app.get('/calendar', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Flowment</title>
        
        <!-- PWA Meta Tags -->
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Flowment">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
        
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@300,0..1&display=swap" rel="stylesheet"/>
        
        <script>
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                "primary": "#4f46e5", // Indigo 600
                "primary-light": "#6366f1",
                "surface": "#ffffff",
                "surface-dark": "#0f172a",
              },
              fontFamily: {
                "sans": ["'Pretendard'", "sans-serif"],
                "serif": ["'Newsreader'", "serif"],
              },
              boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
              },
              animation: {
                'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'float': 'float 6s ease-in-out infinite',
              },
              keyframes: {
                fadeIn: {
                  '0%': { opacity: 0, transform: 'translateY(10px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                float: {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' },
                }
              }
            },
          },
        }
        </script>
        <style>
          body { 
            font-family: 'Pretendard', sans-serif; 
            min-height: 100dvh;
            -webkit-tap-highlight-color: transparent;
          }
          .font-serif {
            font-family: 'Newsreader', serif;
          }
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          }
          /* Hide scrollbar */
          *::-webkit-scrollbar { display: none; }
          * { -ms-overflow-style: none; scrollbar-width: none; }
          
          /* Glassmorphism utilities classes */
          .glass-nav {
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid rgba(255, 255, 255, 0.3);
          }
          .dark .glass-nav {
            background: rgba(15, 23, 42, 0.75);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          .page-transition {
            animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        </style>
    </head>
    <body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <!-- PWA Install Banner -->
        <div id="pwa-install-banner" class="hidden fixed top-0 left-0 right-0 z-50 bg-primary text-white shadow-lg">
            <div class="max-w-md mx-auto p-4 flex items-center justify-between">
                <div class="flex items-center space-x-3 flex-1">
                    <img src="/icons/icon-72.png?v=2" alt="Flowment" class="w-12 h-12 rounded-lg">
                    <div class="flex-1">
                        <p class="font-semibold text-sm">Flowment 앱 설치</p>
                        <p class="text-xs opacity-90">홈 화면에 추가하고 빠르게 실행하세요</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="pwa-install-button" class="px-4 py-2 bg-white text-primary rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
                        설치
                    </button>
                    <button id="pwa-install-close" class="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <span class="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="w-full max-w-md mx-auto min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <header class="sticky top-0 z-20 bg-transparent pt-6 flex items-center justify-between px-4 py-4">
                <button onclick="window.location.href='/'" class="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors">
                    <span class="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 class="text-2xl font-serif font-medium tracking-tight">Calendar</h1>
                <div class="w-10"></div>
            </header>

            <main class="flex-1 px-4 py-6" id="calendar-content">
                <div class="text-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p class="mt-4 text-slate-500 dark:text-slate-400 text-sm">Loading calendar...</p>
                </div>
            </main>

            
        <!-- Floating Bottom Navigation Bar -->
        <div class="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <nav class="pointer-events-auto flex justify-between items-center w-full max-w-sm glass-nav rounded-[2rem] px-6 py-3 shadow-glass dark:shadow-glass-dark transition-all duration-300">
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors " href="/">
                    <span class="material-symbols-outlined text-[26px]">home</span>
                </a>
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors text-primary dark:text-indigo-400" href="/calendar">
                    <span class="material-symbols-outlined text-[26px]">calendar_month</span>
                </a>
                <div class="relative -top-6 transform hover:scale-105 transition-transform">
                    <button onclick="window.location.href='/write'" class="bg-primary hover:bg-indigo-500 text-white size-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 ring-[6px] ring-white/50 dark:ring-slate-900/50 transition-all duration-300">
                        <span class="material-symbols-outlined text-3xl">add</span>
                    </button>
                </div>
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors " href="/timeline">
                    <span class="material-symbols-outlined text-[26px]">history</span>
                </a>
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors " href="/settings">
                    <span class="material-symbols-outlined text-[26px]">tune</span>
                </a>
            </nav>
        </div>
        </div>

        
        <script src="/static/pwa-register.js"></script>
        <script src="/static/cache.js"></script>
        <script src="/static/calendar.js"></script>
    </body>
    </html>
  `)
})

// Settings Page
app.get('/settings', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Flowment</title>
        
        <!-- PWA Meta Tags -->
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Flowment">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
        
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@300,0..1&display=swap" rel="stylesheet"/>
        
        <script>
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                "primary": "#4f46e5", // Indigo 600
                "primary-light": "#6366f1",
                "surface": "#ffffff",
                "surface-dark": "#0f172a",
              },
              fontFamily: {
                "sans": ["'Pretendard'", "sans-serif"],
                "serif": ["'Newsreader'", "serif"],
              },
              boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
              },
              animation: {
                'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'float': 'float 6s ease-in-out infinite',
              },
              keyframes: {
                fadeIn: {
                  '0%': { opacity: 0, transform: 'translateY(10px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                float: {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' },
                }
              }
            },
          },
        }
        </script>
        <style>
          body { 
            font-family: 'Pretendard', sans-serif; 
            min-height: 100dvh;
            -webkit-tap-highlight-color: transparent;
          }
          .font-serif {
            font-family: 'Newsreader', serif;
          }
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          }
          /* Hide scrollbar */
          *::-webkit-scrollbar { display: none; }
          * { -ms-overflow-style: none; scrollbar-width: none; }
          
          /* Glassmorphism utilities classes */
          .glass-nav {
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid rgba(255, 255, 255, 0.3);
          }
          .dark .glass-nav {
            background: rgba(15, 23, 42, 0.75);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          .page-transition {
            animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        </style>
    </head>
    <body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <!-- PWA Install Banner -->
        <div id="pwa-install-banner" class="hidden fixed top-0 left-0 right-0 z-50 bg-primary text-white shadow-lg">
            <div class="max-w-md mx-auto p-4 flex items-center justify-between">
                <div class="flex items-center space-x-3 flex-1">
                    <img src="/icons/icon-72.png?v=2" alt="Flowment" class="w-12 h-12 rounded-lg">
                    <div class="flex-1">
                        <p class="font-semibold text-sm">Flowment 앱 설치</p>
                        <p class="text-xs opacity-90">홈 화면에 추가하고 빠르게 실행하세요</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="pwa-install-button" class="px-4 py-2 bg-white text-primary rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
                        설치
                    </button>
                    <button id="pwa-install-close" class="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <span class="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="w-full max-w-md mx-auto min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <!-- Header -->
            <header class="sticky top-0 z-20 bg-transparent pt-6 flex items-center justify-between px-4 py-4">
                <h1 class="text-2xl font-serif font-medium tracking-tight">Settings</h1>
                <button class="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1">person</span>
                </button>
            </header>

            <!-- Main Content -->
            <main class="flex-1 px-4 py-6 space-y-8">
                <!-- Upgrade Card -->
                <div class="rounded-2xl p-4 flex items-center justify-between shadow-sm bg-primary">
                    <div class="flex items-center gap-4">
                        <div class="bg-white/20 p-3 rounded-xl">
                            <span class="material-symbols-outlined text-white">workspace_premium</span>
                        </div>
                        <div>
                            <h3 class="font-semibold text-white text-sm">Upgrade to Premium</h3>
                            <p class="text-white/80 text-xs">Unlock all advanced features</p>
                        </div>
                    </div>
                    <span class="material-symbols-outlined text-white/80">chevron_right</span>
                </div>

                <!-- Preferences -->
                <div class="space-y-3">
                    <h2 class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase px-1">Preferences</h2>
                    <div class="bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <!-- Notification Time -->
                        <div class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
                            <div class="flex items-center gap-4">
                                <div class="p-2 rounded-lg">
                                    <span class="material-symbols-outlined text-xl">notifications</span>
                                </div>
                                <div>
                                    <p class="text-sm font-medium">Notification Time</p>
                                    <p class="text-xs text-slate-500">Daily flow reminder</p>
                                </div>
                            </div>
                            <div class="px-3 py-1.5 rounded-lg flex items-center gap-2">
                                <span class="text-primary text-sm font-medium" id="notification-time-display">08:00 AM</span>
                                <span class="material-symbols-outlined text-slate-500 dark:text-slate-400 text-xs">schedule</span>
                            </div>
                        </div>

                        <!-- Dark Mode -->
                        <div class="flex items-center justify-between p-4">
                            <div class="flex items-center gap-4">
                                <div class="p-2 rounded-lg">
                                    <span class="material-symbols-outlined text-slate-600 dark:text-slate-400 text-xl">dark_mode</span>
                                </div>
                                <p class="text-sm font-medium">Dark Mode</p>
                            </div>
                            <label class="relative flex h-6 w-11 cursor-pointer items-center rounded-full p-0.5 transition-colors bg-slate-300 dark:bg-primary">
                                <input id="dark-mode-toggle" class="peer sr-only" type="checkbox"/>
                                <div class="h-5 w-5 rounded-full bg-white shadow-sm transition-transform translate-x-0 peer-checked:translate-x-5"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Data & System -->
                <div class="space-y-3">
                    <h2 class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase px-1">Data & System</h2>
                    <div class="bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <!-- Clear Data -->
                        <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                            <div class="flex items-center gap-4">
                                <div class="p-2 rounded-lg">
                                    <span class="material-symbols-outlined text-red-500 text-xl">delete</span>
                                </div>
                                <p class="text-sm font-medium text-red-500">Clear All Data</p>
                            </div>
                        </div>

                        <!-- About -->
                        <div class="flex items-center justify-between p-4">
                            <div class="flex items-center gap-4">
                                <div class="p-2 rounded-lg">
                                    <span class="material-symbols-outlined text-slate-600 dark:text-slate-400 text-xl">info</span>
                                </div>
                                <p class="text-sm font-medium">About Flowment</p>
                            </div>
                            <span class="text-xs text-slate-500 dark:text-slate-400">v1.0.0</span>
                        </div>
                    </div>
                </div>
            </main>

            <!-- Bottom Navigation -->
            
        <!-- Floating Bottom Navigation Bar -->
        <div class="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <nav class="pointer-events-auto flex justify-between items-center w-full max-w-sm glass-nav rounded-[2rem] px-6 py-3 shadow-glass dark:shadow-glass-dark transition-all duration-300">
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors " href="/">
                    <span class="material-symbols-outlined text-[26px]">home</span>
                </a>
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors " href="/calendar">
                    <span class="material-symbols-outlined text-[26px]">calendar_month</span>
                </a>
                <div class="relative -top-6 transform hover:scale-105 transition-transform">
                    <button onclick="window.location.href='/write'" class="bg-primary hover:bg-indigo-500 text-white size-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 ring-[6px] ring-white/50 dark:ring-slate-900/50 transition-all duration-300">
                        <span class="material-symbols-outlined text-3xl">add</span>
                    </button>
                </div>
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors " href="/timeline">
                    <span class="material-symbols-outlined text-[26px]">history</span>
                </a>
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors text-primary dark:text-indigo-400" href="/settings">
                    <span class="material-symbols-outlined text-[26px]">tune</span>
                </a>
            </nav>
        </div>
        </div>

        
        <script src="/static/cache.js"></script>
        <script src="/static/pwa-register.js"></script>
        <script src="/static/settings.js"></script>
    </body>
    </html>
  `)
})

export default app
