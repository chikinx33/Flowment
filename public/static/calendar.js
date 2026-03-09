// Calendar Page JavaScript - V2.0 (Hybrid Cache)
(async function() {
  // Apply dark mode preference
  applyDarkMode();
  
  const calendarContent = document.getElementById('calendar-content');
  
  // Get current month
  const today = new Date();
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth(); // 0-indexed
  
  await loadCalendar(currentYear, currentMonth);
  
  async function loadCalendar(year, month) {
    // Save current values for changeMonth function
    currentYear = year;
    currentMonth = month;
    
    // Show loading
    calendarContent.innerHTML = `
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-slate-500 dark:text-slate-400">캘린더를 불러오는 중...</p>
      </div>
    `;
    
    //  V2.0: entry_date format (YYYY-MM-DD)
    const yearMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    // Fetch from server
    let monthEntries = [];
    let allKeywords = [];
    
    if (navigator.onLine) {
      try {
        const response = await fetch(`/api/entries/month/${yearMonth}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          monthEntries = data.data;
          
          // V2.0: Extract keywords from all entries (keywords are arrays)
          const keywordFreq = {};
          monthEntries.forEach(entry => {
            if (entry.keywords && Array.isArray(entry.keywords)) {
              entry.keywords.forEach(kw => {
                keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
              });
            }
          });
          
          // Convert to array and sort by frequency
          allKeywords = Object.entries(keywordFreq)
            .map(([keyword, count]) => ({ keyword, count }))
            .sort((a, b) => b.count - a.count);
        }
      } catch (error) {
        console.error('Failed to fetch calendar data:', error);
      }
    }
    
    // Render calendar
    renderCalendar(year, month, monthEntries, allKeywords);
  }
  
  function renderCalendar(year, month, entries, keywords) {
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
    
    // Emotion color mapping
    const emotionColors = {
      'joy': 'bg-green-500/80',
      'sadness': 'bg-blue-500/80',
      'anger': 'bg-red-500/80',
      'fear': 'bg-purple-500/80',
      'surprise': 'bg-yellow-500/80',
      'disgust': 'bg-orange-500/80',
      'neutral': 'bg-gray-500/80'
    };
    
    // Create entries map by date (V2.0: entry_date)
    const entriesMap = {};
    entries.forEach(entry => {
      const dateStr = entry.entry_date || entry.date;
      const day = parseInt(dateStr.split('-')[2]);
      entriesMap[day] = entry;
    });
    
    let html = `
      <div class="flex flex-col gap-10 pb-20 relative">
        <div class="absolute top-20 left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
        
        <!-- Month Navigation -->
        <section class="flex items-center justify-between px-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] p-4 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <button onclick="changeMonth(-1)" class="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 p-3 rounded-2xl transition-all duration-300 shadow-sm">
            <span class="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          
          <div class="text-center">
            <h2 class="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-[0.2em] uppercase mb-1">${typeof year !== 'undefined' ? year : new Date().getFullYear()}</h2>
            <h3 class="text-2xl font-serif text-slate-800 dark:text-slate-100 tracking-tight">${new Date(year, month).toLocaleDateString('en-US', { month: 'long' })}</h3>
          </div>
          
          <button onclick="changeMonth(1)" class="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 p-3 rounded-2xl transition-all duration-300 shadow-sm">
            <span class="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </section>
        
        <!-- Calendar Grid -->
        <section class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-6 pb-8 border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-indigo-500/5">
          <div class="grid grid-cols-7 gap-y-6 text-center">
            ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => 
              `<div class="text-[10px] font-semibold tracking-widest text-slate-400 dark:text-slate-500 mb-2">${day}</div>`
            ).join('')}
            ${generateCalendarDays(year, month, entriesMap)}
          </div>
        </section>
        
        <!-- Keyword Cloud -->
        <section class="space-y-6">
          <div class="text-center">
            <h3 class="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-[0.2em] uppercase">Memories</h3>
            <p class="text-2xl font-serif text-slate-800 dark:text-slate-200 mt-1">This Month in Words</p>
          </div>
          
          ${keywords.length > 0 ? `
            <div class="flex flex-wrap gap-2.5 justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
              <div class="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
              ${keywords.slice(0, 15).map((kw, index) => {
                const isTop = index < 3;
                const sizeClass = isTop ? 'text-[15px] px-6 py-3 font-medium' : 'text-[13px] px-4 py-2 font-normal';
                const bgClass = isTop ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-400';
                
                return `<button class="rounded-full ${sizeClass} ${bgClass} transition-all duration-300 hover:-translate-y-1 relative z-10 group">
                  #${kw.keyword}
                  <span class="ml-1.5 opacity-60 text-[10px] bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-full">${kw.count}</span>
                </button>`;
              }).join('')}
            </div>
          ` : `
            <div class="text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50">
              <p class="text-slate-400 dark:text-slate-500 font-serif italic text-lg">아직 기록된 단어가 없습니다.<br>오늘의 조각을 남겨보세요.</p>
            </div>
          `}
        </section>
        
        <!-- Featured Entry -->
        ${entries.length > 0 ? `
          <section class="mt-4 p-8 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-40 h-40 bg-indigo-600/5 rounded-full blur-3xl group-hover:bg-indigo-600/10 transition-colors duration-500"></div>
            
            <div class="relative z-10">
              <div class="flex flex-col gap-1 mb-6">
                <span class="text-[10px] text-indigo-500 dark:text-indigo-400 tracking-[0.2em] uppercase font-semibold">Latest Entry</span>
                <span class="text-sm text-slate-500 font-medium">${new Date(entries[0].entry_date || entries[0].date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
              </div>
              
              <p class="text-slate-800 dark:text-slate-200 leading-relaxed text-lg font-serif italic mb-6">
                "${truncateText(entries[0].content, 100)}"
              </p>
              
              <div class="flex items-center justify-between">
                <div class="flex flex-wrap gap-2">
                  ${(entries[0].keywords || []).slice(0,2).map(kw => `<span class="inline-block bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide">#${kw}</span>`).join('')}
                </div>
                
                <button onclick="window.location.href='/timeline'" class="size-10 flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:scale-110 transition-transform">
                  <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </section>
        ` : ``}
      </div>
    `;
    
    calendarContent.innerHTML = html;
  }
  
  function generateCalendarDays(year, month, entriesMap) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const currentDay = today.getDate();
    
    let html = '';
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="h-12 flex flex-col items-center justify-center opacity-0 pointer-events-none"></div>';
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === currentDay;
      const entry = entriesMap[day];
      
      const dayClass = isToday 
        ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-600/30 font-bold scale-[1.15]' 
        : entry 
          ? 'text-slate-800 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-800' 
          : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50';
          
      const dotHTML = entry && !isToday
        ? `<div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-indigo-500"></div>`
        : '';
      
      html += `
        <div class="h-12 flex items-center justify-center ${entry ? 'cursor-pointer' : ''}" ${entry ? `onclick="window.location.href='/timeline'"` : ''}>
          <div class="relative size-9 flex items-center justify-center rounded-full transition-all duration-300 ${dayClass}">
            <span class="text-[14px] leading-none mb-[1px]">${day}</span>
            ${dotHTML}
          </div>
        </div>
      `;
    }
    
    return html;
  }
  
  // Make changeMonth available globally
  window.changeMonth = function(delta) {
    const newMonth = currentMonth + delta;
    const newDate = new Date(currentYear, newMonth);
    loadCalendar(newDate.getFullYear(), newDate.getMonth());
  };
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
