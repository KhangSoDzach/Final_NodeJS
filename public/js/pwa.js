/**
 * PWA Registration & Install Script
 * Source Computer E-commerce
 */

(function() {
  'use strict';

  // ============================================
  // SERVICE WORKER REGISTRATION
  // ============================================
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });
        
        console.log('[PWA] Service Worker registered:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[PWA] New Service Worker found');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available, show refresh prompt
              showUpdateNotification();
            }
          });
        });
        
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    });
    
    // Handle controller change (when new SW takes over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Controller changed, reloading...');
      window.location.reload();
    });
  }

  // ============================================
  // INSTALL PROMPT HANDLING
  // ============================================
  
  let deferredPrompt = null;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] Install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install button/banner
    showInstallBanner();
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
    hideInstallBanner();
    
    // Track installation
    if (typeof gtag === 'function') {
      gtag('event', 'app_install', {
        event_category: 'PWA',
        event_label: 'App Installed'
      });
    }
  });

  // ============================================
  // UI COMPONENTS
  // ============================================
  
  /**
   * Show install banner/button
   */
  function showInstallBanner() {
    // Check if already dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return; // Don't show for 7 days after dismiss
    }
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Already running as PWA
    }
    
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="pwa-install-content">
        <img src="/icons/icon-192x192.svg" alt="Source Computer" class="pwa-install-icon">
        <div class="pwa-install-text">
          <strong>Cài đặt Source Computer</strong>
          <span>Thêm vào màn hình chính để truy cập nhanh hơn</span>
        </div>
      </div>
      <div class="pwa-install-actions">
        <button class="pwa-btn pwa-btn-install" onclick="PWA.install()">
          <i class="fas fa-download"></i> Cài đặt
        </button>
        <button class="pwa-btn pwa-btn-dismiss" onclick="PWA.dismissInstall()">
          Để sau
        </button>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Animate in
    setTimeout(() => banner.classList.add('show'), 100);
  }
  
  /**
   * Hide install banner
   */
  function hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 300);
    }
  }
  
  /**
   * Show update notification
   */
  function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.className = 'pwa-update-notification';
    notification.innerHTML = `
      <div class="pwa-update-content">
        <i class="fas fa-sync-alt"></i>
        <span>Phiên bản mới có sẵn!</span>
        <button class="pwa-btn pwa-btn-update" onclick="PWA.update()">
          Cập nhật
        </button>
        <button class="pwa-btn-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
  }

  // ============================================
  // ONLINE/OFFLINE STATUS
  // ============================================
  
  function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    document.body.classList.toggle('offline', !isOnline);
    
    if (!isOnline) {
      showOfflineIndicator();
    } else {
      hideOfflineIndicator();
    }
  }
  
  function showOfflineIndicator() {
    if (document.getElementById('offline-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.className = 'offline-indicator';
    indicator.innerHTML = `
      <i class="fas fa-wifi-slash"></i>
      <span>Không có kết nối mạng</span>
    `;
    document.body.appendChild(indicator);
    setTimeout(() => indicator.classList.add('show'), 100);
  }
  
  function hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.classList.remove('show');
      setTimeout(() => indicator.remove(), 300);
    }
  }
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // ============================================
  // PUSH NOTIFICATIONS
  // ============================================
  
  async function requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('[PWA] Notifications not supported');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }
  
  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // VAPID public key - cần generate và đặt vào .env
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
        )
      });
      
      console.log('[PWA] Push subscription:', subscription);
      
      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      
      return true;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      return false;
    }
  }
  
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // ============================================
  // PUBLIC API
  // ============================================
  
  window.PWA = {
    /**
     * Trigger app install
     */
    install: async function() {
      if (!deferredPrompt) {
        console.log('[PWA] Install prompt not available');
        return false;
      }
      
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('[PWA] Install choice:', outcome);
      deferredPrompt = null;
      hideInstallBanner();
      
      return outcome === 'accepted';
    },
    
    /**
     * Dismiss install banner
     */
    dismissInstall: function() {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      hideInstallBanner();
    },
    
    /**
     * Update app (reload with new SW)
     */
    update: function() {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
    },
    
    /**
     * Clear all caches
     */
    clearCache: async function() {
      const registration = await navigator.serviceWorker.ready;
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => resolve(event.data);
        registration.active.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });
    },
    
    /**
     * Get SW version
     */
    getVersion: async function() {
      const registration = await navigator.serviceWorker.ready;
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => resolve(event.data.version);
        registration.active.postMessage(
          { type: 'GET_VERSION' },
          [messageChannel.port2]
        );
      });
    },
    
    /**
     * Enable push notifications
     */
    enableNotifications: async function() {
      const granted = await requestNotificationPermission();
      if (granted) {
        return subscribeToPush();
      }
      return false;
    },
    
    /**
     * Check if running as installed PWA
     */
    isInstalled: function() {
      return window.matchMedia('(display-mode: standalone)').matches ||
             window.navigator.standalone === true;
    },
    
    /**
     * Check online status
     */
    isOnline: function() {
      return navigator.onLine;
    }
  };

  // Log PWA status on load
  console.log('[PWA] Status:', {
    installed: window.PWA.isInstalled(),
    online: window.PWA.isOnline(),
    serviceWorker: 'serviceWorker' in navigator
  });

})();
