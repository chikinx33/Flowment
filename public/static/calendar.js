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
    
    // Calculate emotion statistics for the month
    const emotionStats = {};
    entries.forEach(entry => {
      const emotion = entry.emotion || 'neutral';
      emotionStats[emotion] = (emotionStats[emotion] || 0) + 1;
    });
    
    // Calculate average mood score
    const moodScores = entries
      .map(e => e.mood_score)
      .filter(s => s !== null && s !== undefined);
    const avgMood = moodScores.length > 0 
      ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length).toFixed(1)
      : null;
    
    // Generate calendar HTML
    const monthName = new Date(year, month).toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' });
    
    let html = `
      <div class="flex flex-col gap-8">
        <!-- Month Navigation -->
        <section>
          <div class="flex items-center justify-between mb-6">
            <button onclick="changeMonth(-1)" class="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <h2 class="text-2xl font-semibold">${monthName}</h2>
            <button onclick="changeMonth(1)" class="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          
          <!-- Emotion Statistics (V2.0 NEW) -->
          ${entries.length > 0 ? `
            <div class="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div class="flex flex-wrap items-center justify-center gap-3 text-sm">
                ${Object.entries(emotionStats).map(([emotion, count]) => 
                  `<span class="flex items-center gap-1">
                    <span class="text-lg">${emotionEmojis[emotion]}</span>
                    <span class="text-slate-600 dark:text-slate-400">${count}일</span>
                  </span>`
                ).join('')}
              </div>
              ${avgMood ? `
                <div class="text-center mt-2 text-sm text-slate-600 dark:text-slate-400">
                  평균 기분: <span class="font-bold text-primary">${avgMood}</span>/10 ${'⭐'.repeat(Math.round(parseFloat(avgMood)))}
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          <!-- Calendar Grid -->
          <div class="grid grid-cols-7 gap-y-4 text-center">
            ${['일', '월', '화', '수', '목', '금', '토'].map(day => 
              `<div class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">${day}</div>`
            ).join('')}
            ${generateCalendarDays(year, month, entriesMap, emotionColors)}
          </div>
        </section>
        
        <hr class="border-slate-200 dark:border-slate-800"/>
        
        <!-- Keyword Cloud (V2.0) -->
        <section>
          <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">cloud</span>
            이번 달 키워드
          </h3>
          ${keywords.length > 0 ? `
            <div class="flex flex-wrap gap-2 justify-center">
              ${keywords.slice(0, 15).map((kw, index) => {
                const sizeClasses = [
                  'text-2xl font-bold px-5 py-2.5 bg-primary/30',
                  'text-xl font-bold px-4 py-2 bg-primary/25',
                  'text-lg font-medium px-4 py-2 bg-primary/20',
                  'text-base font-medium px-3 py-1.5 bg-primary/15',
                  'text-sm px-3 py-1.5 bg-primary/10'
                ];
                const sizeIndex = Math.min(Math.floor(index / 3), 4);
                const sizeClass = sizeClasses[sizeIndex];
                return `<button class="rounded-full ${sizeClass} text-slate-900 dark:text-slate-100 hover:scale-105 transition-transform">#${kw.keyword} <span class="text-xs opacity-60">${kw.count}</span></button>`;
              }).join('')}
            </div>
          ` : `
            <p class="text-center text-slate-500 dark:text-slate-400 py-8">
              아직 키워드가 없습니다
            </p>
          `}
        </section>
        
        <!-- Featured Entry (V2.0 with emotion & keywords) -->
        ${entries.length > 0 ? `
          <section class="mt-4 p-5 rounded-xl bg-primary/5 border border-primary/10">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-2xl">${emotionEmojis[entries[0].emotion] || '😐'}</span>
                <h4 class="font-bold text-primary">${entries[0].title || '제목 없음'}</h4>
              </div>
              <span class="text-xs text-primary/60 font-medium">${new Date(entries[0].entry_date || entries[0].date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
            </div>
            ${entries[0].keywords && entries[0].keywords.length > 0 ? `
              <div class="flex flex-wrap gap-1 mb-2">
                ${entries[0].keywords.map(kw => `<span class="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">#${kw}</span>`).join('')}
              </div>
            ` : ''}
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
              ${truncateText(entries[0].content, 150)}
            </p>
            <button onclick="window.location.href='/timeline'" class="mt-4 text-xs font-bold text-primary flex items-center gap-1 uppercase tracking-widest hover:underline">
              전체 보기 <span class="material-symbols-outlined text-sm">north_east</span>
            </button>
          </section>
        ` : `
          <section class="mt-4 p-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
            <div class="text-4xl mb-3">✍️</div>
            <p class="text-slate-500 dark:text-slate-400 mb-4">이번 달 첫 일기를 작성해보세요</p>
            <button onclick="window.location.href='/write'" class="bg-primary text-white px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
              일기 쓰기
            </button>
          </section>
        `}
      </div>
    `;
    
    calendarContent.innerHTML = html;
  }
  
  function generateCalendarDays(year, month, entriesMap, emotionColors) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const currentDay = today.getDate();
    
    let html = '';
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="h-12 flex flex-col items-center justify-center opacity-0"></div>';
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === currentDay;
      const entry = entriesMap[day];
      
      // V2.0: Use emotion color
      const emotionColor = entry ? emotionColors[entry.emotion] || 'bg-primary/50' : 'bg-slate-200 dark:bg-slate-700';
      const dayClass = isToday ? 'text-primary font-bold scale-110' : entry ? 'font-medium' : 'text-slate-400';
      const dotSize = isToday ? 'size-3 ring-4 ring-primary/20' : 'size-2.5';
      
      html += `
        <div class="h-12 flex flex-col items-center justify-center gap-1 ${entry ? 'cursor-pointer hover:scale-110 transition-transform' : ''}" ${entry ? `onclick="window.location.href='/timeline'"` : ''}>
          <span class="text-xs ${dayClass}">${day}</span>
          ${entry ? `<div class="${dotSize} rounded-full ${emotionColor}"></div>` : ''}
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
