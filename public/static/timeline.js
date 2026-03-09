// Timeline Page JavaScript - V2.0 (Hybrid Cache)
(async function() {
  // Apply dark mode preference
  applyDarkMode();
  
  const timelineContent = document.getElementById('timeline-content');
  
  // 1. Load from cache first (instant)
  try {
    const cachedEntries = window.FlowmentCache.getCachedEntries();
    
    if (cachedEntries.length > 0) {
      renderTimeline(cachedEntries);
    } else {
      showLoading();
    }
  } catch (error) {
    showLoading();
  }
  
  // 2. Fetch from server in background (update if available)
  if (navigator.onLine) {
    try {
      const response = await fetch('/api/entries');
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // Merge with cache
        data.data.forEach(serverEntry => {
          try {
            window.FlowmentCache.setCachedEntry(serverEntry);
          } catch (error) {
            console.log('Cache not available');
          }
        });
        
        // Re-render with server data
        renderTimeline(data.data);
        
        console.log('Timeline updated from server');
      } else if (data.success && data.data.length === 0) {
        showEmptyState();
      }
    } catch (error) {
      console.log('Server fetch failed, showing cached data:', error);
      // If no cache and server fails, show empty state
      try {
        const cachedEntries = window.FlowmentCache.getCachedEntries();
        if (cachedEntries.length === 0) {
          showEmptyState();
        }
      } catch {
        showEmptyState();
      }
    }
  }
  
  function showLoading() {
    timelineContent.innerHTML = `
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-slate-500 dark:text-slate-400">일기를 불러오는 중...</p>
      </div>
    `;
  }
  
  function showEmptyState() {
    timelineContent.innerHTML = `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">📝</div>
        <p class="text-slate-500 dark:text-slate-400 mb-4">아직 작성된 일기가 없습니다</p>
        <button onclick="window.location.href='/write'" class="bg-primary text-white px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
          첫 일기 작성하기
        </button>
      </div>
    `;
  }
  
  function renderTimeline(entries) {
    if (!entries || entries.length === 0) {
      showEmptyState();
      return;
    }
    
    // Emotion emoji mapping
    const emotionEmojis = {
      'joy': '😊',
      'sadness': '😢',
      'anger': '😡',
      'fear': '😨',
      'surprise': '😲',
      'disgust': '🤢',
      'neutral': '😐'
    };
    
    // Generate timeline HTML
    let timelineHTML = '<div class="relative w-full py-8">';
    timelineHTML += '<div class="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent -translate-x-1/2"></div>';
    
    entries.forEach((entry, index) => {
      // V2.0 API uses entry_date instead of date
      const dateStr = entry.entry_date || entry.date;
      const date = new Date(dateStr + 'T00:00:00');
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      const isLeft = index % 2 === 1;
      
      const dateLabel = isToday 
        ? `오늘, ${date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}`
        : date.toLocaleDateString('ko-KR', { weekday: 'long', month: 'long', day: 'numeric' });
      
      const dotOpacity = isToday ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]' : 'bg-indigo-300 dark:bg-indigo-700/60';
      const textColor = isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400';
      const keywordColor = isToday ? 'text-slate-800 dark:text-slate-100' : 'text-slate-700 dark:text-slate-200';
      
      // V2.0: Keywords array (not single keyword)
      const keywords = entry.keywords || [];
      const keywordsHTML = keywords.length > 0 
        ? keywords.map(kw => `<span class="inline-block bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide">#${kw}</span>`).join(' ')
        : '';
        
      const contentPreview = `<p class="text-[13px] text-slate-600 dark:text-slate-300 mt-3 leading-relaxed font-light">${truncateText(entry.content, 90)}</p>`;
      
      if (isLeft) {
        // Left side
        timelineHTML += `
          <div class="relative flex items-center justify-between mb-16 group">
            <div class="w-[calc(50%-2rem)] flex flex-col items-end text-right">
              <span class="text-[10px] uppercase tracking-widest ${textColor} font-semibold mb-2">${dateLabel}</span>
              <div class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-5 rounded-l-[2rem] rounded-tr-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/60 group-hover:shadow-md transition-all duration-300 w-full max-w-[280px]">
                <div class="flex flex-wrap justify-end gap-1.5 mb-1">${keywordsHTML}</div>
                ${contentPreview}
              </div>
            </div>
            <div class="absolute left-1/2 -translate-x-1/2 z-10 size-3.5 rounded-full ${dotOpacity} ring-4 ring-white dark:ring-slate-950 transition-all duration-300 group-hover:scale-125"></div>
            <div class="w-[calc(50%-2rem)]"></div>
          </div>
        `;
      } else {
        // Right side
        timelineHTML += `
          <div class="relative flex items-center justify-between mb-16 group">
            <div class="w-[calc(50%-2rem)]"></div>
            <div class="absolute left-1/2 -translate-x-1/2 z-10 size-3.5 rounded-full ${dotOpacity} ring-4 ring-white dark:ring-slate-950 transition-all duration-300 group-hover:scale-125"></div>
            <div class="w-[calc(50%-2rem)] flex flex-col items-start text-left">
              <span class="text-[10px] uppercase tracking-widest ${textColor} font-semibold mb-2">${dateLabel}</span>
              <div class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-5 rounded-r-[2rem] rounded-tl-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/60 group-hover:shadow-md transition-all duration-300 w-full max-w-[280px]">
                <div class="flex flex-wrap justify-start gap-1.5 mb-1">${keywordsHTML}</div>
                ${contentPreview}
              </div>
            </div>
          </div>
        `;
      }
    });
    
    timelineHTML += '</div>';
    timelineContent.innerHTML = timelineHTML;
  }
})();

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function applyDarkMode() {
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
