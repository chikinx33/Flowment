// Flowment PWA - Service Worker Registration
// V2.1.0

// Service Worker 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope);
        
        // 업데이트 확인
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[PWA] New Service Worker found, installing...');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New Service Worker installed, refresh to update');
              
              // 사용자에게 업데이트 알림 (선택 사항)
              if (confirm('새로운 버전이 있습니다. 지금 업데이트하시겠습니까?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });

  // Service Worker 메시지 수신
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('[PWA] Message from Service Worker:', event.data);
  });
}

// 설치 프롬프트 표시
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] Install prompt available');
  
  // 기본 프롬프트 방지
  e.preventDefault();
  
  // 나중에 사용하기 위해 저장
  deferredPrompt = e;
  
  // 설치 버튼 표시 (향후 UI 추가)
  showInstallButton();
});

// 설치 버튼 표시 함수
function showInstallButton() {
  const banner = document.getElementById('pwa-install-banner');
  const installButton = document.getElementById('pwa-install-button');
  const closeButton = document.getElementById('pwa-install-close');
  
  if (!banner || !installButton) {
    console.log('[PWA] Install banner elements not found');
    return;
  }
  
  // 이미 설치된 경우 배너 숨김
  if (isInstalled()) {
    console.log('[PWA] App already installed, hiding banner');
    return;
  }
  
  // 배너 표시
  banner.classList.remove('hidden');
  console.log('[PWA] Install banner shown');
  
  // 설치 버튼 클릭 핸들러
  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No deferred prompt available');
      showManualInstallGuide();
      return;
    }
    
    // 설치 프롬프트 표시
    deferredPrompt.prompt();
    
    // 사용자 선택 대기
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User choice:', outcome);
    
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
      banner.classList.add('hidden');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }
    
    // 프롬프트 초기화
    deferredPrompt = null;
  });
  
  // 닫기 버튼 클릭 핸들러
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      banner.classList.add('hidden');
      // 오늘 하루 동안 배너 숨김 (localStorage 사용)
      localStorage.setItem('pwa-banner-dismissed', new Date().toDateString());
    });
  }
}

// 수동 설치 가이드 표시 (iOS 또는 beforeinstallprompt 미지원 브라우저)
function showManualInstallGuide() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  let message = '';
  
  if (isIOS && isSafari) {
    message = 'Safari 하단의 공유 버튼(📤)을 누른 후\n"홈 화면에 추가"를 선택하세요!';
  } else {
    message = '브라우저 메뉴(⋮)에서\n"앱 설치" 또는 "홈 화면에 추가"를 선택하세요!';
  }
  
  alert(message);
}

// 앱 설치 완료 이벤트
window.addEventListener('appinstalled', (e) => {
  console.log('[PWA] App installed successfully');
  
  // 설치 배너 숨기기
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.classList.add('hidden');
  }
  
  // 설치 완료 토스트 표시
  showToast('Flowment가 성공적으로 설치되었습니다! 🎉');
});

// 온라인/오프라인 상태 감지
window.addEventListener('online', () => {
  console.log('[PWA] Network status: ONLINE');
  
  // 온라인 상태 UI 업데이트
  const statusIndicator = document.getElementById('network-status');
  if (statusIndicator) {
    statusIndicator.textContent = '온라인';
    statusIndicator.className = 'text-green-600';
  }
  
  // 오프라인 동안 저장된 데이터 동기화
  syncOfflineData();
});

window.addEventListener('offline', () => {
  console.log('[PWA] Network status: OFFLINE');
  
  // 오프라인 상태 UI 업데이트
  const statusIndicator = document.getElementById('network-status');
  if (statusIndicator) {
    statusIndicator.textContent = '오프라인';
    statusIndicator.className = 'text-red-600';
  }
});

// 오프라인 데이터 동기화 (Background Sync API 사용)
async function syncOfflineData() {
  if ('serviceWorker' in navigator && 'sync' in registration) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-entries');
      console.log('[PWA] Background sync registered');
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
      
      // Background Sync 미지원 시 직접 동기화
      syncEntriesDirectly();
    }
  } else {
    // Background Sync 미지원 시 직접 동기화
    syncEntriesDirectly();
  }
}

// 직접 동기화 (Background Sync 미지원 브라우저용)
async function syncEntriesDirectly() {
  console.log('[PWA] Syncing offline entries directly...');
  
  try {
    // FlowmentCache에서 오프라인 일기 가져오기
    const offlineEntries = window.FlowmentCache?.getOfflineEntries?.() || [];
    
    if (offlineEntries.length === 0) {
      console.log('[PWA] No offline entries to sync');
      return;
    }
    
    // 각 일기를 API로 전송
    for (const entry of offlineEntries) {
      try {
        const response = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });
        
        if (response.ok) {
          console.log('[PWA] Entry synced:', entry.entry_date);
          // FlowmentCache에서 제거
          window.FlowmentCache?.removeOfflineEntry?.(entry.entry_date);
        }
      } catch (error) {
        console.error('[PWA] Entry sync failed:', entry.entry_date, error);
      }
    }
    
    console.log('[PWA] Sync completed');
  } catch (error) {
    console.error('[PWA] Sync failed:', error);
  }
}

// 푸시 알림 권한 요청 (향후 구현)
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('[PWA] Notifications not supported');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    console.log('[PWA] Notification permission already granted');
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
    return permission === 'granted';
  }
  
  return false;
}

// PWA 설치 상태 확인
function isInstalled() {
  // 스탠드얼론 모드 확인 (홈 화면에서 실행 중)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone ||
                       document.referrer.includes('android-app://');
  
  console.log('[PWA] Is installed:', isStandalone);
  return isStandalone;
}

// 초기화
console.log('[PWA] Registration script loaded');
console.log('[PWA] Is installed:', isInstalled());

// 페이지 로드 시 배너 표시 확인
window.addEventListener('DOMContentLoaded', () => {
  // 오늘 배너를 이미 닫았는지 확인
  const dismissedDate = localStorage.getItem('pwa-banner-dismissed');
  const today = new Date().toDateString();
  
  if (dismissedDate === today) {
    console.log('[PWA] Banner dismissed today, not showing');
    return;
  }
  
  // 설치되지 않았고 deferredPrompt가 없으면 배너 표시 (iOS/Safari 대응)
  setTimeout(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (!isInstalled() && (deferredPrompt || isIOS)) {
      showInstallButton();
    }
  }, 2000); // 2초 후 배너 표시
});

// 토스트 표시 함수
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('animate-fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
