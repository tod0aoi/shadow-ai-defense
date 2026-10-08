document.addEventListener('DOMContentLoaded', () => {
  const dot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const statScanned = document.getElementById('stat-scanned');
  const statLeaks = document.getElementById('stat-leaks');
  const openBtn = document.getElementById('open-soc-btn');

  // Check backend health
  chrome.runtime.sendMessage({ action: 'GET_HEALTH' }, (response) => {
    if (response && response.healthy) {
      dot.classList.remove('offline');
      statusText.textContent = 'SOC Gateway Connected (5000)';
    } else {
      dot.classList.add('offline');
      statusText.textContent = 'SOC Gateway Offline';
    }
  });

  // Load stats from storage
  chrome.storage.local.get(['scannedCount', 'leakageCount'], (items) => {
    statScanned.textContent = items.scannedCount || 0;
    statLeaks.textContent = items.leakageCount || 0;
  });

  openBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5000' });
  });
});
