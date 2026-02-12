/**
 * Search Features - Autocomplete, Voice Search, Search History
 * SourceComputer E-commerce
 */

(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    debounceDelay: 300,
    minSearchLength: 2,
    maxHistoryItems: 10,
    maxSuggestions: 8,
    localStorageKey: 'sourcecomputer_search_history'
  };
  
  // DOM Elements
  let searchInput, searchForm, suggestionsContainer, voiceBtn;
  
  // State
  let debounceTimer = null;
  let isVoiceSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  let recognition = null;
  
  /**
   * Initialize search features
   */
  function init() {
    searchInput = document.getElementById('search-input');
    searchForm = document.getElementById('search-form');
    
    if (!searchInput || !searchForm) {
      // Fallback: tìm search form cũ
      const oldForm = document.querySelector('.search-bar form');
      const oldInput = document.querySelector('.search-bar input[name="search"]');
      if (oldForm && oldInput) {
        searchForm = oldForm;
        searchInput = oldInput;
        searchInput.id = 'search-input';
        searchForm.id = 'search-form';
      } else {
        return;
      }
    }
    
    createSuggestionsContainer();
    createVoiceButton();
    attachEventListeners();
    loadRecentSearches();
  }
  
  /**
   * Create suggestions dropdown container
   */
  function createSuggestionsContainer() {
    // Kiểm tra nếu đã tồn tại
    if (document.getElementById('search-suggestions')) {
      suggestionsContainer = document.getElementById('search-suggestions');
      return;
    }
    
    suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = 'search-suggestions';
    suggestionsContainer.className = 'search-suggestions';
    suggestionsContainer.style.display = 'none';
    
    // Thêm vào sau search input
    const searchBar = searchInput.closest('.search-bar') || searchInput.parentElement;
    searchBar.style.position = 'relative';
    searchBar.appendChild(suggestionsContainer);
  }
  
  /**
   * Create voice search button
   */
  function createVoiceButton() {
    if (!isVoiceSupported) return;
    
    // Kiểm tra nếu đã tồn tại
    if (document.getElementById('voice-search-btn')) {
      voiceBtn = document.getElementById('voice-search-btn');
      return;
    }
    
    voiceBtn = document.createElement('button');
    voiceBtn.type = 'button';
    voiceBtn.id = 'voice-search-btn';
    voiceBtn.className = 'voice-search-btn';
    voiceBtn.title = 'Tìm kiếm bằng giọng nói';
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    
    // Thêm vào search form
    const submitBtn = searchForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.parentNode.insertBefore(voiceBtn, submitBtn);
    }
    
    // Initialize speech recognition
    initSpeechRecognition();
  }
  
  /**
   * Initialize Speech Recognition
   */
  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = function() {
      voiceBtn.classList.add('listening');
      voiceBtn.innerHTML = '<i class="fas fa-microphone-alt"></i>';
      searchInput.placeholder = 'Đang lắng nghe...';
    };
    
    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      searchInput.value = transcript;
      
      if (event.results[0].isFinal) {
        // Tự động search sau khi nhận được kết quả cuối cùng
        setTimeout(() => {
          trackSearch(transcript, 'voice');
          searchForm.submit();
        }, 500);
      }
    };
    
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      voiceBtn.classList.remove('listening');
      voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      searchInput.placeholder = 'Tìm kiếm sản phẩm...';
      
      if (event.error === 'not-allowed') {
        alert('Vui lòng cho phép trình duyệt truy cập microphone để sử dụng tìm kiếm giọng nói.');
      }
    };
    
    recognition.onend = function() {
      voiceBtn.classList.remove('listening');
      voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      searchInput.placeholder = 'Tìm kiếm sản phẩm...';
    };
  }
  
  /**
   * Attach event listeners
   */
  function attachEventListeners() {
    // Input event - debounced autocomplete
    searchInput.addEventListener('input', function(e) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = e.target.value.trim();
        if (query.length >= CONFIG.minSearchLength) {
          fetchSuggestions(query);
        } else if (query.length === 0) {
          showRecentSearches();
        } else {
          hideSuggestions();
        }
      }, CONFIG.debounceDelay);
    });
    
    // Focus event - show recent searches
    searchInput.addEventListener('focus', function() {
      const query = this.value.trim();
      if (query.length >= CONFIG.minSearchLength) {
        fetchSuggestions(query);
      } else {
        showRecentSearches();
      }
    });
    
    // Blur event - hide suggestions (with delay for click)
    searchInput.addEventListener('blur', function() {
      setTimeout(hideSuggestions, 200);
    });
    
    // Keyboard navigation
    searchInput.addEventListener('keydown', handleKeyboardNavigation);
    
    // Form submit - track search
    searchForm.addEventListener('submit', function(e) {
      const query = searchInput.value.trim();
      if (query.length > 0) {
        saveToLocalHistory(query);
        trackSearch(query, 'text');
      }
    });
    
    // Voice button click
    if (voiceBtn) {
      voiceBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (recognition) {
          if (voiceBtn.classList.contains('listening')) {
            recognition.stop();
          } else {
            recognition.start();
          }
        }
      });
    }
    
    // Click outside to close
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.search-bar')) {
        hideSuggestions();
      }
    });
  }
  
  /**
   * Fetch suggestions from API
   */
  async function fetchSuggestions(query) {
    try {
      const response = await fetch(`/search/suggestions?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        renderSuggestions(data.suggestions, query);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }
  
  /**
   * Render suggestions dropdown
   */
  function renderSuggestions(suggestions, query) {
    if (!suggestions) {
      hideSuggestions();
      return;
    }
    
    const { products, queries, categories, brands } = suggestions;
    let html = '';
    
    // Recent/Popular queries
    if (queries && queries.length > 0) {
      html += `
        <div class="suggestion-section">
          <div class="suggestion-header">
            <i class="fas fa-history"></i> Gợi ý tìm kiếm
          </div>
          ${queries.map(q => `
            <div class="suggestion-item suggestion-query" data-query="${escapeHtml(q)}">
              <i class="fas fa-search"></i>
              <span>${highlightMatch(q, query)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // Categories
    if (categories && categories.length > 0) {
      html += `
        <div class="suggestion-section">
          <div class="suggestion-header">
            <i class="fas fa-folder"></i> Danh mục
          </div>
          ${categories.slice(0, 3).map(cat => `
            <div class="suggestion-item suggestion-category" data-category="${escapeHtml(cat)}">
              <i class="fas fa-tag"></i>
              <span>${highlightMatch(cat, query)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // Brands
    if (brands && brands.length > 0) {
      html += `
        <div class="suggestion-section">
          <div class="suggestion-header">
            <i class="fas fa-building"></i> Thương hiệu
          </div>
          ${brands.slice(0, 3).map(brand => `
            <div class="suggestion-item suggestion-brand" data-brand="${escapeHtml(brand)}">
              <i class="fas fa-certificate"></i>
              <span>${highlightMatch(brand, query)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // Products
    if (products && products.length > 0) {
      html += `
        <div class="suggestion-section">
          <div class="suggestion-header">
            <i class="fas fa-box"></i> Sản phẩm
          </div>
          ${products.map(p => `
            <a href="/products/${p.slug}" class="suggestion-item suggestion-product">
              <div class="product-thumb">
                ${p.image ? `<img src="/uploads/products/${p.image}" alt="${escapeHtml(p.name)}">` : '<i class="fas fa-image"></i>'}
              </div>
              <div class="product-info">
                <div class="product-name">${highlightMatch(p.name, query)}</div>
                <div class="product-meta">
                  <span class="product-category">${p.category}</span>
                  <span class="product-price">${formatPrice(p.price)}</span>
                </div>
              </div>
            </a>
          `).join('')}
        </div>
      `;
    }
    
    // No results
    if (!html) {
      html = `
        <div class="suggestion-empty">
          <i class="fas fa-search"></i>
          <p>Không tìm thấy gợi ý cho "${escapeHtml(query)}"</p>
        </div>
      `;
    }
    
    // View all results link
    html += `
      <div class="suggestion-footer">
        <a href="/products?search=${encodeURIComponent(query)}" class="view-all-results">
          <i class="fas fa-arrow-right"></i>
          Xem tất cả kết quả cho "${escapeHtml(query)}"
        </a>
      </div>
    `;
    
    suggestionsContainer.innerHTML = html;
    suggestionsContainer.style.display = 'block';
    
    // Attach click handlers
    attachSuggestionHandlers();
  }
  
  /**
   * Show recent searches from local storage
   */
  function showRecentSearches() {
    const history = getLocalHistory();
    
    if (history.length === 0) {
      // Fetch popular searches instead
      fetchPopularSearches();
      return;
    }
    
    let html = `
      <div class="suggestion-section">
        <div class="suggestion-header">
          <i class="fas fa-clock"></i> Tìm kiếm gần đây
          <button type="button" class="clear-history-btn" title="Xóa lịch sử">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
        ${history.map((q, index) => `
          <div class="suggestion-item suggestion-history" data-query="${escapeHtml(q)}">
            <i class="fas fa-history"></i>
            <span>${escapeHtml(q)}</span>
            <button type="button" class="remove-history-item" data-index="${index}">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `).join('')}
      </div>
    `;
    
    suggestionsContainer.innerHTML = html;
    suggestionsContainer.style.display = 'block';
    
    attachSuggestionHandlers();
  }
  
  /**
   * Fetch popular searches
   */
  async function fetchPopularSearches() {
    try {
      const response = await fetch('/search/popular');
      const data = await response.json();
      
      if (data.success && data.popular && data.popular.length > 0) {
        let html = `
          <div class="suggestion-section">
            <div class="suggestion-header">
              <i class="fas fa-fire"></i> Tìm kiếm phổ biến
            </div>
            ${data.popular.map(item => `
              <div class="suggestion-item suggestion-popular" data-query="${escapeHtml(item.query)}">
                <i class="fas fa-chart-line"></i>
                <span>${escapeHtml(item.query)}</span>
                <span class="search-count">${item.searchCount} lượt</span>
              </div>
            `).join('')}
          </div>
        `;
        
        suggestionsContainer.innerHTML = html;
        suggestionsContainer.style.display = 'block';
        attachSuggestionHandlers();
      }
    } catch (error) {
      console.error('Error fetching popular searches:', error);
    }
  }
  
  /**
   * Attach handlers to suggestion items
   */
  function attachSuggestionHandlers() {
    // Query/History/Popular clicks
    suggestionsContainer.querySelectorAll('.suggestion-query, .suggestion-history, .suggestion-popular').forEach(item => {
      item.addEventListener('click', function(e) {
        if (e.target.closest('.remove-history-item')) return;
        const query = this.dataset.query;
        searchInput.value = query;
        saveToLocalHistory(query);
        trackSearch(query, 'suggestion');
        searchForm.submit();
      });
    });
    
    // Category clicks
    suggestionsContainer.querySelectorAll('.suggestion-category').forEach(item => {
      item.addEventListener('click', function() {
        window.location.href = `/products?category=${encodeURIComponent(this.dataset.category)}`;
      });
    });
    
    // Brand clicks
    suggestionsContainer.querySelectorAll('.suggestion-brand').forEach(item => {
      item.addEventListener('click', function() {
        window.location.href = `/products?brand=${encodeURIComponent(this.dataset.brand)}`;
      });
    });
    
    // Clear history button
    const clearBtn = suggestionsContainer.querySelector('.clear-history-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        clearLocalHistory();
        hideSuggestions();
      });
    }
    
    // Remove individual history items
    suggestionsContainer.querySelectorAll('.remove-history-item').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const index = parseInt(this.dataset.index);
        removeFromLocalHistory(index);
        showRecentSearches();
      });
    });
  }
  
  /**
   * Hide suggestions dropdown
   */
  function hideSuggestions() {
    if (suggestionsContainer) {
      suggestionsContainer.style.display = 'none';
    }
  }
  
  /**
   * Handle keyboard navigation
   */
  function handleKeyboardNavigation(e) {
    if (!suggestionsContainer || suggestionsContainer.style.display === 'none') return;
    
    const items = suggestionsContainer.querySelectorAll('.suggestion-item');
    const activeItem = suggestionsContainer.querySelector('.suggestion-item.active');
    let currentIndex = Array.from(items).indexOf(activeItem);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < items.length - 1) {
          if (activeItem) activeItem.classList.remove('active');
          items[currentIndex + 1].classList.add('active');
          items[currentIndex + 1].scrollIntoView({ block: 'nearest' });
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          if (activeItem) activeItem.classList.remove('active');
          items[currentIndex - 1].classList.add('active');
          items[currentIndex - 1].scrollIntoView({ block: 'nearest' });
        }
        break;
        
      case 'Enter':
        if (activeItem) {
          e.preventDefault();
          activeItem.click();
        }
        break;
        
      case 'Escape':
        hideSuggestions();
        searchInput.blur();
        break;
    }
  }
  
  /**
   * Local storage history management
   */
  function getLocalHistory() {
    try {
      const history = localStorage.getItem(CONFIG.localStorageKey);
      return history ? JSON.parse(history) : [];
    } catch (e) {
      return [];
    }
  }
  
  function saveToLocalHistory(query) {
    try {
      let history = getLocalHistory();
      // Remove if exists
      history = history.filter(q => q.toLowerCase() !== query.toLowerCase());
      // Add to front
      history.unshift(query);
      // Limit items
      history = history.slice(0, CONFIG.maxHistoryItems);
      localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(history));
    } catch (e) {
      console.error('Error saving to local history:', e);
    }
  }
  
  function removeFromLocalHistory(index) {
    try {
      let history = getLocalHistory();
      history.splice(index, 1);
      localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(history));
    } catch (e) {
      console.error('Error removing from local history:', e);
    }
  }
  
  function clearLocalHistory() {
    try {
      localStorage.removeItem(CONFIG.localStorageKey);
      // Also clear server history if logged in
      fetch('/search/history', { method: 'DELETE' }).catch(() => {});
    } catch (e) {
      console.error('Error clearing local history:', e);
    }
  }
  
  function loadRecentSearches() {
    // Pre-load recent searches for faster display
    getLocalHistory();
  }
  
  /**
   * Track search to server
   */
  function trackSearch(query, source) {
    fetch('/search/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, source })
    }).catch(() => {});
  }
  
  /**
   * Helper functions
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark>$1</mark>');
  }
  
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Export for global access
  window.SearchFeatures = {
    init,
    clearHistory: clearLocalHistory,
    getHistory: getLocalHistory
  };
})();
