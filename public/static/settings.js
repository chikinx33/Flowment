// Settings Page JavaScript
(async function() {
  // Apply dark mode preference
  applyDarkMode();
  
  // Load settings
  try {
    const response = await fetch('/api/settings');
    const data = await response.json();
    
    if (data.success && data.data) {
      const settings = data.data;
      
      // Set notification time
      document.getElementById('notification-time-display').textContent = formatTime(settings.notification_time);
      
      // Set dark mode toggle
      const darkModeToggle = document.getElementById('dark-mode-toggle');
      darkModeToggle.checked = settings.dark_mode === 1;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  
  // Dark mode toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  darkModeToggle.addEventListener('change', async (e) => {
    const isDarkMode = e.target.checked;
    
    // Update UI immediately
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('darkMode', isDarkMode);
    
    // Save to server
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_time: document.getElementById('notification-time-display').textContent,
          dark_mode: isDarkMode
        })
      });
      
      const data = await response.json();
      if (!data.success) {
        console.error('Failed to save dark mode setting');
      }
    } catch (error) {
      console.error('Error saving dark mode setting:', error);
    }
  });
})();

function formatTime(time24) {
  // Convert 24-hour format to 12-hour format
  if (!time24) return '08:00 AM';
  
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  
  return `${String(hour12).padStart(2, '0')}:${minutes} ${ampm}`;
}

function applyDarkMode() {
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) toggle.checked = true;
  } else {
    document.documentElement.classList.remove('dark');
  }
}
