// Landing Page JavaScript - Hybrid Cache Memory Gate
(async function() {
  const appDiv = document.getElementById('app');
  
  // Apply dark mode preference
  applyDarkMode();
  
  // 1. Try local cache first (instant)
  const cachedGate = window.FlowmentCache.getCachedMemoryGate();
  
  if (cachedGate) {
    renderMemoryGate(cachedGate);
  } else {
    // Show loading or first-time message immediately
    appDiv.innerHTML = `
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-slate-500">Loading...</p>
      </div>
    `;
  }
  
  // 2. Try server in background
  if (window.FlowmentCache.isOnline()) {
    try {
      const response = await fetch('/api/memory-gate');
      const data = await response.json();
      
      if (data.success && data.data) {
        // Render server gate (may update UI)
        renderMemoryGate(data.data);
        console.log('Memory gate loaded from server');
      } else if (!cachedGate) {
        // No cache and no server data - first time user
        showFirstTimeMessage();
      }
    } catch (error) {
      console.log('Server fetch failed:', error);
      if (!cachedGate) {
        showFirstTimeMessage();
      }
    }
  } else if (!cachedGate) {
    // Offline and no cache - show first time message
    showFirstTimeMessage();
  }
  
  function showFirstTimeMessage() {
    appDiv.innerHTML = `
      <div class="my-auto text-center space-y-8 animate-fade-in px-6">
        <div class="mb-10 relative">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
          <img src="/icons/icon-192.png?t=${Date.now()}" alt="Flowment Logo" class="relative w-28 h-28 mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500 animate-float">
        </div>
        
        <div class="space-y-4">
          <p class="text-indigo-600 dark:text-indigo-400 text-xs font-semibold tracking-[0.2em] uppercase">Welcome to Flowment</p>
          <h2 class="text-slate-900 dark:text-slate-100 text-4xl md:text-5xl leading-tight font-serif italic tracking-tight">
            Your memory<br>journal awaits
          </h2>
        </div>
        
        <p class="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-sm mx-auto font-light">
          매일 기록하고, 키워드로 지난 날을 기억하세요.<br/>당신의 기억이 곧 일기가 됩니다.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <button onclick="window.location.href='/write'" class="group relative flex h-14 w-full sm:w-auto px-10 items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-base font-medium tracking-wide shadow-xl hover:shadow-2xl shadow-slate-900/20 dark:shadow-white/20 transition-all duration-300 rounded-[2rem] overflow-hidden">
            <span class="relative z-10 group-hover:scale-105 transition-transform duration-300">첫 일기 작성하기</span>
            <div class="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-10 dark:bg-indigo-400 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    `;
  }
  
  function renderMemoryGate(gateData) {
    const { question, options, id, correctAnswer } = gateData;
    let selectedAnswer = null;
    
    appDiv.innerHTML = `
      <div class="absolute inset-0 flex flex-col page-transition">
        <!-- Top Section: Logo (30% height) -->
        <div class="flex items-center justify-center relative" style="height: 30%;">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div class="flex flex-col items-center relative z-10 animate-float">
            <img src="/icons/icon-192.png?t=${Date.now()}" alt="Flowment Logo" class="w-14 h-14 mb-3 drop-shadow-xl opacity-90">
            <h1 class="text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold tracking-[0.2em] uppercase">Memory Gate</h1>
          </div>
        </div>
        
        <!-- Middle Section: Quiz (40% height) -->
        <div class="flex items-center justify-center px-6" style="height: 40%;">
          <!-- Question with Quotation Marks -->
          <div class="text-center w-full max-w-sm mx-auto relative">
            <span class="absolute -top-6 -left-2 text-6xl text-slate-200 dark:text-slate-800 font-serif opacity-50 select-none">"</span>
            <p class="text-slate-800 dark:text-slate-200 text-xl md:text-2xl leading-relaxed px-4 font-serif italic font-medium relative z-10">
              ${question}
            </p>
            <span class="absolute -bottom-10 -right-2 text-6xl text-slate-200 dark:text-slate-800 font-serif opacity-50 select-none">"</span>
          </div>
        </div>
        
        <!-- Bottom Section: Keywords (30% height) -->
        <div class="flex items-end justify-center pb-12" style="height: 30%;">
          <div class="w-full max-w-sm px-6">
            <div class="text-center mb-6">
              <p class="text-[10px] text-slate-400 tracking-widest uppercase mb-1">Select the correct keyword</p>
              <div class="w-10 h-px bg-slate-200 dark:bg-slate-800 mx-auto"></div>
            </div>
            
            <!-- Options -->
            <div class="flex flex-col gap-3" id="options-container">
        ${options.map(option => `
          <button class="option-btn group relative flex h-[3.25rem] w-full items-center justify-center rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all duration-300 overflow-hidden" data-answer="${option}">
            <div class="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span class="text-slate-700 dark:text-slate-300 font-medium text-[15px] tracking-wide relative z-10 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">${option}</span>
          </button>
        `).join('')}
            </div>
          </div>
        </div>
      </div>
      
      <div id="feedback" class="hidden"></div>
    `;
    
    // Add click handlers to option buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedAnswer = btn.dataset.answer;
        checkAnswer(id, selectedAnswer, correctAnswer);
      });
    });
  }
})();

async function checkAnswer(gateId, selectedAnswer, correctAnswer) {
  // Update server
  try {
    const response = await fetch('/api/memory-gate/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        answer: selectedAnswer,
        correctAnswer: correctAnswer
      })
    });
    
    const result = await response.json();
    
    if (result.success && result.correct) {
      // Correct answer - show animation and redirect to timeline
      showCorrectAnimation();
    } else {
      // Wrong answer - show blur message
      showWrongAnswerPopup();
    }
  } catch (error) {
    console.error('Error verifying answer:', error);
    // Fallback: check locally
    if (selectedAnswer === correctAnswer) {
      showCorrectAnimation();
    } else {
      showWrongAnswerPopup();
    }
  }
}

function showCorrectAnimation() {
  // Create blur overlay
  const overlay = document.createElement('div');
  overlay.id = 'answer-overlay';
  overlay.className = 'fixed inset-0 flex items-center justify-center z-50';
  overlay.style.cssText = `
    background: rgba(0, 0, 0, 0);
    backdrop-filter: blur(0px);
    transition: background 0.6s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  
  // Create message
  const message = document.createElement('div');
  message.className = 'text-center';
  message.style.cssText = `
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  message.innerHTML = `
    <p class="text-white text-3xl font-bold tracking-wide drop-shadow-lg">
      기억의 문을 엽니다.
    </p>
  `;
  
  overlay.appendChild(message);
  document.body.appendChild(overlay);
  
  // Trigger fade-in with delay for smooth rendering
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.background = 'rgba(0, 0, 0, 0.4)';
      overlay.style.backdropFilter = 'blur(12px)';
      
      setTimeout(() => {
        message.style.opacity = '1';
        message.style.transform = 'translateY(0)';
      }, 200);
    });
  });
  
  // Fade out after 2 seconds, then redirect
  setTimeout(() => {
    message.style.opacity = '0';
    message.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      overlay.style.background = 'rgba(0, 0, 0, 0)';
      overlay.style.backdropFilter = 'blur(0px)';
      
      setTimeout(() => {
        window.location.href = '/timeline';
      }, 600);
    }, 800);
  }, 2000);
}

function showWrongAnswerPopup() {
  // Create blur overlay
  const overlay = document.createElement('div');
  overlay.id = 'answer-overlay';
  overlay.className = 'fixed inset-0 flex items-center justify-center z-50';
  overlay.style.cssText = `
    background: rgba(0, 0, 0, 0);
    backdrop-filter: blur(0px);
    transition: background 0.6s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  
  // Create message
  const message = document.createElement('div');
  message.className = 'text-center';
  message.style.cssText = `
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  message.innerHTML = `
    <p class="text-white text-3xl font-bold tracking-wide drop-shadow-lg">
      기억을 잊지 마세요.
    </p>
  `;
  
  overlay.appendChild(message);
  document.body.appendChild(overlay);
  
  // Trigger fade-in with delay for smooth rendering
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.background = 'rgba(0, 0, 0, 0.4)';
      overlay.style.backdropFilter = 'blur(12px)';
      
      setTimeout(() => {
        message.style.opacity = '1';
        message.style.transform = 'translateY(0)';
      }, 200);
    });
  });
  
  // Fade out after 2 seconds, then remove
  setTimeout(() => {
    message.style.opacity = '0';
    message.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      overlay.style.background = 'rgba(0, 0, 0, 0)';
      overlay.style.backdropFilter = 'blur(0px)';
      
      setTimeout(() => {
        overlay.remove();
      }, 600);
    }, 800);
  }, 2000);
}

function applyDarkMode() {
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
