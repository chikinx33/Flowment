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
      <div class="text-center space-y-6">
        <div class="mb-8">
          <img src="/icons/icon-192.png?t=${Date.now()}" alt="Flowment Logo" class="w-32 h-32 mx-auto mb-6 drop-shadow-2xl">
        </div>
        <p class="text-primary/60 dark:text-primary/50 text-sm font-medium tracking-wide uppercase">Welcome to Flowment</p>
        <h2 class="text-slate-900 dark:text-slate-100 text-3xl md:text-4xl lg:text-5xl leading-tight font-semibold px-4">
          Your memory journal awaits
        </h2>
        <p class="text-slate-600 dark:text-slate-400 text-lg max-w-md mx-auto px-4">
          매일 일기를 쓰고, 키워드로 기억하세요.<br/>
          당신의 기억이 일기가 됩니다.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button onclick="window.location.href='/write'" class="flex h-14 px-8 items-center justify-center bg-primary text-white text-base font-semibold tracking-wide shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity rounded-full">
            첫 일기 작성하기
          </button>
        </div>
      </div>
    `;
  }
  
  function renderMemoryGate(gateData) {
    const { question, options, id, correctAnswer } = gateData;
    let selectedAnswer = null;
    
    appDiv.innerHTML = `
      <div class="absolute inset-0 flex flex-col">
        <!-- Top Section: Logo (30% height) -->
        <div class="flex items-center justify-center" style="height: 30%;">
          <div class="flex flex-col items-center">
            <img src="/icons/icon-192.png?t=${Date.now()}" alt="Flowment Logo" class="w-16 h-16 mb-2 drop-shadow-lg">
            <h1 class="text-primary text-lg font-semibold tracking-wide">Flowment</h1>
          </div>
        </div>
        
        <!-- Middle Section: Quiz (40% height) -->
        <div class="flex items-center justify-center px-4" style="height: 40%;">
          <!-- Question with Quotation Marks -->
          <div class="text-center max-w-md mx-auto">
            <img src="/icons/quote-start.png?t=${Date.now()}" alt="quote" class="w-8 h-8 mx-auto mb-4 opacity-30">
            <p class="text-slate-900 dark:text-slate-100 text-lg leading-relaxed px-4">
              ${question}
            </p>
            <img src="/icons/quote-end.png?t=${Date.now()}" alt="quote" class="w-8 h-8 mx-auto mt-4 opacity-30">
          </div>
        </div>
        
        <!-- Bottom Section: Keywords (30% height) -->
        <div class="flex items-center justify-center" style="height: 30%;">
          <div class="w-full max-w-md px-4">
            <!-- Lock Gate Divider -->
            <div class="flex items-center justify-center gap-4 mb-4">
              <div class="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-yellow-600/60 max-w-[80px]"></div>
              <img src="/icons/lock-gate.png?t=${Date.now()}" alt="Memory Gate Lock" class="w-14 h-14 flex-shrink-0">
              <div class="flex-1 h-px bg-gradient-to-l from-transparent via-yellow-600/40 to-yellow-600/60 max-w-[80px]"></div>
            </div>
            
            <!-- Options -->
            <div class="flex flex-col gap-3" id="options-container">
        ${options.map(option => `
          <button class="option-btn inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 transition-all hover:opacity-90 mx-auto" data-answer="${option}">
            <span class="text-white text-sm">${option}</span>
          </button>
        `).join('')}
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
