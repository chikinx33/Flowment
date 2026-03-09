// Flowment Cache Manager v2.0 - Production Schema
// Multi-user with offline sync support

const CACHE_VERSION = '2.0.0';
const CACHE_KEYS = {
  ENTRIES: 'flowment_entries_v2',
  USER: 'flowment_user',
  SYNC_QUEUE: 'flowment_sync_queue_v2',
  LAST_SYNC: 'flowment_last_sync',
  VERSION: 'flowment_cache_version'
};

// Default user (anonymous)
const DEFAULT_USER_ID = 1;

// Initialize cache version
function initCache() {
  const currentVersion = localStorage.getItem(CACHE_KEYS.VERSION);
  if (currentVersion !== CACHE_VERSION) {
    console.log('Cache version upgrade:', currentVersion, '→', CACHE_VERSION);
    // Keep old data but update version
    localStorage.setItem(CACHE_KEYS.VERSION, CACHE_VERSION);
  }
}

// Clear all cache
function clearCache() {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  localStorage.setItem(CACHE_KEYS.VERSION, CACHE_VERSION);
}

// Generate UUID for client_id
function generateClientId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
}

// ==================== User Cache ====================

function getCachedUser() {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.USER);
    return cached ? JSON.parse(cached) : { id: DEFAULT_USER_ID, nickname: 'Anonymous User' };
  } catch (error) {
    console.error('Error reading cached user:', error);
    return { id: DEFAULT_USER_ID, nickname: 'Anonymous User' };
  }
}

function setCachedUser(user) {
  try {
    localStorage.setItem(CACHE_KEYS.USER, JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('Error caching user:', error);
    return false;
  }
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

function getCachedEntry(entry_date) {
  const entries = getCachedEntries();
  return entries.find(entry => entry.entry_date === entry_date) || null;
}

function setCachedEntry(entryData) {
  const entries = getCachedEntries();
  const user = getCachedUser();
  
  // Ensure required fields
  if (!entryData.entry_date || !entryData.content) {
    console.error('Missing required fields: entry_date, content');
    return false;
  }
  
  // Ensure client_id exists
  if (!entryData.client_id) {
    entryData.client_id = generateClientId();
  }
  
  const entry = {
    id: entryData.id,
    user_id: user.id,
    entry_date: entryData.entry_date,
    title: entryData.title || null,
    content: entryData.content,
    emotion: entryData.emotion || null,
    mood_score: entryData.mood_score || null,
    keywords: entryData.keywords || [],
    client_id: entryData.client_id,
    sync_status: entryData.sync_status || 'pending',
    created_at: entryData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  };
  
  const existingIndex = entries.findIndex(e => e.entry_date === entry.entry_date);
  
  if (existingIndex >= 0) {
    // Update existing
    entries[existingIndex] = { ...entries[existingIndex], ...entry, updated_at: new Date().toISOString() };
  } else {
    // Add new
    entries.push(entry);
  }
  
  // Sort by entry_date descending
  entries.sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));
  
  return setCachedEntries(entries);
}

function deleteCachedEntry(entry_date) {
  const entries = getCachedEntries();
  const entryIndex = entries.findIndex(e => e.entry_date === entry_date);
  
  if (entryIndex >= 0) {
    // Soft delete
    entries[entryIndex].deleted_at = new Date().toISOString();
    entries[entryIndex].sync_status = 'pending';
    return setCachedEntries(entries);
  }
  
  return false;
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
  
  // Get all pending entries (not synced)
  const entries = getCachedEntries();
  const pendingEntries = entries.filter(e => e.sync_status === 'pending' && !e.deleted_at);
  
  if (pendingEntries.length === 0) {
    console.log('No pending entries to sync');
    setLastSyncTime();
    return { success: true, synced: 0 };
  }
  
  try {
    // Bulk sync API
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entries: pendingEntries.map(e => ({
          entry_date: e.entry_date,
          title: e.title,
          content: e.content,
          emotion: e.emotion,
          mood_score: e.mood_score,
          keywords_json: JSON.stringify(e.keywords || []),
          client_id: e.client_id
        }))
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success) {
        // Mark as synced
        pendingEntries.forEach(entry => {
          const index = entries.findIndex(e => e.client_id === entry.client_id);
          if (index >= 0) {
            entries[index].sync_status = 'synced';
          }
        });
        
        setCachedEntries(entries);
        setLastSyncTime();
        
        console.log(`Sync complete: ${pendingEntries.length} entries synced`);
        return { success: true, synced: pendingEntries.length };
      }
    }
    
    return { success: false, synced: 0 };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, synced: 0, error: String(error) };
  }
}

// ==================== Fetch from Server and Merge ====================

async function fetchAndMergeFromServer() {
  console.log('Fetching data from server...');
  
  try {
    const response = await fetch('/api/entries');
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        mergeServerEntries(data.data);
        console.log('Fetch and merge complete');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error fetching from server:', error);
    return false;
  }
}

function mergeServerEntries(serverEntries) {
  const localEntries = getCachedEntries();
  const merged = [];
  
  // Add server entries
  serverEntries.forEach(serverEntry => {
    const localEntry = localEntries.find(e => e.client_id === serverEntry.client_id);
    
    if (localEntry) {
      // Merge: server wins if updated_at is newer
      if (new Date(serverEntry.updated_at) > new Date(localEntry.updated_at)) {
        merged.push({ ...serverEntry, sync_status: 'synced' });
      } else {
        merged.push(localEntry);
      }
    } else {
      merged.push({ ...serverEntry, sync_status: 'synced' });
    }
  });
  
  // Add local-only entries (pending sync)
  localEntries.forEach(localEntry => {
    const existsInMerged = merged.some(e => e.client_id === localEntry.client_id);
    if (!existsInMerged) {
      merged.push(localEntry);
    }
  });
  
  // Sort by entry_date descending
  merged.sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));
  
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

// Export functions
window.FlowmentCache = {
  // User
  getCachedUser,
  setCachedUser,
  
  // Entries
  getCachedEntries,
  getCachedEntry,
  setCachedEntry,
  deleteCachedEntry,
  
  // Sync
  syncWithServer,
  fetchAndMergeFromServer,
  addToSyncQueue,
  getSyncQueue,
  getLastSyncTime,
  
  // Utility
  clearCache,
  generateClientId,
  isOnline: () => navigator.onLine
};

console.log('Flowment Cache Manager v2.0 initialized');
