// Flowment Cache Manager - Hybrid LocalStorage + Cloud DB
// Provides offline-first experience with automatic synchronization

const CACHE_VERSION = '1.0.0';
const CACHE_KEYS = {
  ENTRIES: 'flowment_entries',
  MEMORY_GATES: 'flowment_memory_gates',
  SETTINGS: 'flowment_settings',
  KEYWORDS: 'flowment_keywords',
  SYNC_QUEUE: 'flowment_sync_queue',
  LAST_SYNC: 'flowment_last_sync',
  VERSION: 'flowment_cache_version'
};

// Initialize cache version
function initCache() {
  const currentVersion = localStorage.getItem(CACHE_KEYS.VERSION);
  if (currentVersion !== CACHE_VERSION) {
    console.log('Cache version mismatch, clearing old cache');
    clearCache();
    localStorage.setItem(CACHE_KEYS.VERSION, CACHE_VERSION);
  }
}

// Clear all cache
function clearCache() {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// ==================== Entries Cache ====================

function getCachedEntries() {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.ENTRIES);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error reading cached entries:', error);
    return [];
  }
}

function setCachedEntries(entries) {
  try {
    localStorage.setItem(CACHE_KEYS.ENTRIES, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Error caching entries:', error);
    return false;
  }
}

function getCachedEntry(date) {
  const entries = getCachedEntries();
  return entries.find(entry => entry.date === date) || null;
}

function setCachedEntry(entry) {
  const entries = getCachedEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = { ...entries[existingIndex], ...entry, updated_at: new Date().toISOString() };
  } else {
    entries.push({ ...entry, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  }
  
  // Sort by date descending
  entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return setCachedEntries(entries);
}

function deleteCachedEntry(date) {
  const entries = getCachedEntries();
  const filtered = entries.filter(entry => entry.date !== date);
  return setCachedEntries(filtered);
}

// ==================== Memory Gates Cache ====================

function getCachedMemoryGates() {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.MEMORY_GATES);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error reading cached memory gates:', error);
    return [];
  }
}

function setCachedMemoryGates(gates) {
  try {
    localStorage.setItem(CACHE_KEYS.MEMORY_GATES, JSON.stringify(gates));
    return true;
  } catch (error) {
    console.error('Error caching memory gates:', error);
    return false;
  }
}

function getCachedMemoryGate() {
  const gates = getCachedMemoryGates();
  const entries = getCachedEntries();
  
  if (entries.length === 0) {
    return null;
  }
  
  // Get entries from last 7 days
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  const recentEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= sevenDaysAgo && entry.keyword;
  });
  
  if (recentEntries.length === 0) {
    // Use the most recent entry
    const latestEntry = entries[0];
    if (!latestEntry || !latestEntry.keyword) return null;
    
    return generateMemoryGate(latestEntry, entries, true);
  }
  
  // Random entry from last 7 days
  const randomEntry = recentEntries[Math.floor(Math.random() * recentEntries.length)];
  return generateMemoryGate(randomEntry, entries, false);
}

function generateMemoryGate(entry, allEntries, isOldest = false) {
  const correctAnswer = entry.keyword;
  
  // Generate wrong options from other keywords
  const otherKeywords = allEntries
    .filter(e => e.keyword && e.keyword !== correctAnswer)
    .map(e => e.keyword);
  
  const uniqueKeywords = [...new Set(otherKeywords)];
  const wrongOptions = uniqueKeywords
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
  
  // Generate options (at least 1 option)
  const options = [correctAnswer, ...wrongOptions]
    .sort(() => Math.random() - 0.5);
  
  // Generate question
  let question = entry.quizSentence || `Yesterday, I felt ${correctAnswer} while reflecting on the day.`;
  question = question.replace(new RegExp(correctAnswer, 'gi'), '____');
  
  return {
    id: entry.id || Date.now(),
    question,
    options,
    correctAnswer,
    date: entry.date,
    isOldest
  };
}

// ==================== Settings Cache ====================

function getCachedSettings() {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.SETTINGS);
    return cached ? JSON.parse(cached) : { notification_time: '08:00', dark_mode: 0 };
  } catch (error) {
    console.error('Error reading cached settings:', error);
    return { notification_time: '08:00', dark_mode: 0 };
  }
}

function setCachedSettings(settings) {
  try {
    localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error caching settings:', error);
    return false;
  }
}

// ==================== Keywords Cache ====================

function getCachedKeywordFrequency() {
  const entries = getCachedEntries();
  const keywordMap = {};
  
  entries.forEach(entry => {
    if (entry.keyword) {
      keywordMap[entry.keyword] = (keywordMap[entry.keyword] || 0) + 1;
    }
  });
  
  return Object.entries(keywordMap)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

// ==================== Sync Queue ====================

function getSyncQueue() {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.SYNC_QUEUE);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error reading sync queue:', error);
    return [];
  }
}

function addToSyncQueue(action, data) {
  const queue = getSyncQueue();
  queue.push({
    id: Date.now(),
    action, // 'create', 'update', 'delete'
    data,
    timestamp: new Date().toISOString()
  });
  
  try {
    localStorage.setItem(CACHE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    return false;
  }
}

function clearSyncQueue() {
  localStorage.removeItem(CACHE_KEYS.SYNC_QUEUE);
}

function getLastSyncTime() {
  return localStorage.getItem(CACHE_KEYS.LAST_SYNC) || null;
}

function setLastSyncTime() {
  localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
}

// ==================== Sync with Server ====================

async function syncWithServer() {
  console.log('Starting sync with server...');
  
  const queue = getSyncQueue();
  
  if (queue.length === 0) {
    console.log('No pending sync actions');
    return { success: true, synced: 0 };
  }
  
  let syncedCount = 0;
  const failedActions = [];
  
  for (const item of queue) {
    try {
      if (item.action === 'create' || item.action === 'update') {
        const response = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        
        if (response.ok) {
          syncedCount++;
        } else {
          failedActions.push(item);
        }
      } else if (item.action === 'delete') {
        // Implement delete if needed
        syncedCount++;
      }
    } catch (error) {
      console.error('Sync error for action:', item.action, error);
      failedActions.push(item);
    }
  }
  
  // Update sync queue with failed actions only
  if (failedActions.length > 0) {
    localStorage.setItem(CACHE_KEYS.SYNC_QUEUE, JSON.stringify(failedActions));
  } else {
    clearSyncQueue();
  }
  
  setLastSyncTime();
  
  console.log(`Sync complete: ${syncedCount} synced, ${failedActions.length} failed`);
  
  return {
    success: failedActions.length === 0,
    synced: syncedCount,
    failed: failedActions.length
  };
}

// ==================== Fetch from Server and Merge ====================

async function fetchAndMergeFromServer() {
  console.log('Fetching data from server...');
  
  try {
    // Fetch entries
    const entriesResponse = await fetch('/api/entries');
    if (entriesResponse.ok) {
      const entriesData = await entriesResponse.json();
      if (entriesData.success && entriesData.data) {
        mergeServerEntries(entriesData.data);
      }
    }
    
    // Fetch settings
    const settingsResponse = await fetch('/api/settings');
    if (settingsResponse.ok) {
      const settingsData = await settingsResponse.json();
      if (settingsData.success && settingsData.data) {
        // Don't override local settings if they're newer
        const localSettings = getCachedSettings();
        const serverSettings = settingsData.data;
        
        // Simple merge: server wins if local is default
        if (localSettings.notification_time === '08:00' && localSettings.dark_mode === 0) {
          setCachedSettings(serverSettings);
        }
      }
    }
    
    console.log('Fetch and merge complete');
    return true;
  } catch (error) {
    console.error('Error fetching from server:', error);
    return false;
  }
}

function mergeServerEntries(serverEntries) {
  const localEntries = getCachedEntries();
  const merged = [...serverEntries];
  
  // Add local entries that are not on server (pending sync)
  localEntries.forEach(localEntry => {
    const existsOnServer = serverEntries.some(se => se.date === localEntry.date);
    if (!existsOnServer) {
      merged.push(localEntry);
    }
  });
  
  // Sort by date descending
  merged.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  setCachedEntries(merged);
}

// ==================== Auto Sync ====================

function startAutoSync() {
  // Sync every 5 minutes if online
  setInterval(async () => {
    if (navigator.onLine) {
      await syncWithServer();
      await fetchAndMergeFromServer();
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  // Sync when coming back online
  window.addEventListener('online', async () => {
    console.log('Back online, syncing...');
    await syncWithServer();
    await fetchAndMergeFromServer();
  });
}

// Initialize cache on load
initCache();

// Start auto sync
startAutoSync();

// Export functions for use in other scripts
window.FlowmentCache = {
  // Entries
  getCachedEntries,
  getCachedEntry,
  setCachedEntry,
  deleteCachedEntry,
  
  // Memory Gates
  getCachedMemoryGate,
  
  // Settings
  getCachedSettings,
  setCachedSettings,
  
  // Keywords
  getCachedKeywordFrequency,
  
  // Sync
  syncWithServer,
  fetchAndMergeFromServer,
  addToSyncQueue,
  getSyncQueue,
  getLastSyncTime,
  
  // Utility
  clearCache,
  isOnline: () => navigator.onLine
};

console.log('Flowment Cache Manager initialized');
