// Write Page JavaScript - V3.0 (Simplified)
(function() {
  // Apply dark mode preference
  applyDarkMode();
  
  // Set current date
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  document.getElementById('current-date').textContent = dateStr;
  
  // Get current date in YYYY-MM-DD format
  const currentDate = today.toISOString().split('T')[0];
  
  // Load existing entry if available
  loadEntry(currentDate);
  
  // Character counter
  const contentTextarea = document.getElementById('content-textarea');
  const charCount = document.getElementById('char-count');
  
  contentTextarea.addEventListener('input', (e) => {
    charCount.textContent = e.target.value.length;
  });
  
  // Keywords management (3 fixed input fields)
  const keywordInput1 = document.getElementById('keyword-input-1');
  const keywordInput2 = document.getElementById('keyword-input-2');
  const keywordInput3 = document.getElementById('keyword-input-3');
  
  // Collect keywords from all 3 input fields
  function collectKeywords() {
    const keywords = [];
    const input1 = keywordInput1.value.trim();
    const input2 = keywordInput2.value.trim();
    const input3 = keywordInput3.value.trim();
    
    if (input1) keywords.push(input1);
    if (input2) keywords.push(input2);
    if (input3) keywords.push(input3);
    
    return keywords;
  }
  
  // Client ID generator (for offline sync)
  function generateClientId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Save button handler
  document.getElementById('save-btn').addEventListener('click', async () => {
    const content = contentTextarea.value.trim();
    
    if (!content) {
      alert('내용을 입력해주세요');
      return;
    }
    
    // Auto-collect keywords from input fields
    const keywords = collectKeywords();
    
    if (keywords.length === 0) {
      alert('최소 1개의 키워드를 입력해주세요');
      return;
    }
    
    // V3.0 API payload (simplified)
    const entryData = {
      entry_date: currentDate,
      title: null,  // No title field
      content: content,
      emotion: null,  // No emotion
      mood_score: null,  // No mood score
      keywords: keywords,
      client_id: generateClientId()
    };
    
    console.log('Saving entry:', entryData);
    
    // 1. Save to local cache immediately (offline-first)
    try {
      const localSaved = window.FlowmentCache.setCachedEntry(entryData);
      
      if (!localSaved) {
        alert('로컬 저장에 실패했습니다');
        return;
      }
    } catch (error) {
      console.log('Cache not available, continuing with server save');
    }
    
    // 2. Try to sync with server (async, non-blocking)
    let serverSaved = false;
    
    if (navigator.onLine) {
      try {
        const response = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entryData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log('✅ Entry synced with server successfully:', result);
          serverSaved = true;
        } else {
          console.error('❌ Server sync failed:', result);
          alert('서버 저장 실패: ' + (result.message || 'Unknown error'));
          return;
        }
      } catch (error) {
        console.error('❌ Network error:', error);
        alert('네트워크 오류: ' + error.message);
        return;
      }
    } else {
      alert('오프라인 상태입니다. 온라인이 되면 자동으로 동기화됩니다.');
    }
    
    // Show success and redirect
    if (serverSaved) {
      alert('✅ 일기가 저장되었습니다!');
      window.location.href = '/calendar';
    }
  });
  
  // ==================== LOAD ENTRY (V3.0 API) ====================
  
  async function loadEntry(date) {
    // 1. Try local cache first (instant)
    try {
      const cachedEntry = window.FlowmentCache.getCachedEntry(date);
      
      if (cachedEntry) {
        populateForm(cachedEntry);
        console.log('Entry loaded from cache');
      }
    } catch (error) {
      console.log('Cache not available');
    }
    
    // 2. Try server (update if newer)
    if (navigator.onLine) {
      try {
        const response = await fetch(`/api/entries/${date}`);
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data) {
            populateForm(result.data);
            console.log('Entry loaded from server');
          }
        }
      } catch (error) {
        console.log('Server fetch failed:', error);
      }
    }
  }
  
  function populateForm(entry) {
    if (entry.content) {
      contentTextarea.value = entry.content;
      charCount.textContent = entry.content.length;
    }
    
    // Load keywords into 3 input fields
    if (entry.keywords && Array.isArray(entry.keywords)) {
      if (entry.keywords[0]) keywordInput1.value = entry.keywords[0];
      if (entry.keywords[1]) keywordInput2.value = entry.keywords[1];
      if (entry.keywords[2]) keywordInput3.value = entry.keywords[2];
    }
  }
})();

function applyDarkMode() {
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
