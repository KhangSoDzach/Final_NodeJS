/**
 * Product Features JavaScript
 * Xử lý các tính năng: Wishlist, Compare, Recently Viewed
 */

const ProductFeatures = (function() {
  'use strict';

  // Constants
  const RECENTLY_VIEWED_KEY = 'recentlyViewedProducts';
  const MAX_RECENTLY_VIEWED = 10;
  
  // State
  let wishlistCount = 0;
  let compareCount = 0;

  /**
   * Initialize all product features
   */
  function init() {
    initWishlistButtons();
    initCompareButtons();
    trackRecentlyViewed();
    loadRecentlyViewed();
    updateHeaderCounts();
    initQuickView();
  }

  /**
   * Wishlist functions
   */
  function initWishlistButtons() {
    // Bind click events to all wishlist buttons
    document.querySelectorAll('.btn-wishlist').forEach(btn => {
      btn.addEventListener('click', handleWishlistClick);
    });
  }

  async function handleWishlistClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const btn = e.currentTarget;
    const productId = btn.dataset.productId;
    const isActive = btn.classList.contains('active');
    
    // Check if user is logged in
    if (!isUserLoggedIn()) {
      showLoginPrompt('Vui lòng đăng nhập để thêm vào yêu thích');
      return;
    }
    
    try {
      btn.disabled = true;
      
      if (isActive) {
        // Remove from wishlist
        const res = await fetch(`/user/wishlist/remove/${productId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        
        if (data.success) {
          btn.classList.remove('active');
          btn.title = 'Thêm vào yêu thích';
          updateWishlistIcon(btn, false);
          showToast('Đã xóa khỏi danh sách yêu thích', 'info');
          wishlistCount = data.itemCount || 0;
        }
      } else {
        // Add to wishlist
        const res = await fetch('/user/wishlist/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        });
        const data = await res.json();
        
        if (data.success) {
          btn.classList.add('active');
          btn.title = 'Xóa khỏi yêu thích';
          updateWishlistIcon(btn, true);
          showToast('Đã thêm vào danh sách yêu thích', 'success');
          wishlistCount = data.itemCount || 0;
        } else if (data.message === 'Sản phẩm đã có trong danh sách yêu thích') {
          btn.classList.add('active');
        }
      }
      
      updateWishlistBadge();
    } catch (error) {
      console.error('Wishlist error:', error);
      showToast('Có lỗi xảy ra', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  function updateWishlistIcon(btn, isActive) {
    const icon = btn.querySelector('i');
    if (icon) {
      if (isActive) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        icon.style.color = '#dc3545';
      } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        icon.style.color = '';
      }
    }
  }

  function updateWishlistBadge() {
    const badge = document.querySelector('.wishlist-count');
    if (badge) {
      badge.textContent = wishlistCount;
      badge.style.display = wishlistCount > 0 ? 'inline-block' : 'none';
    }
  }

  /**
   * Compare functions
   */
  function initCompareButtons() {
    document.querySelectorAll('.btn-compare').forEach(btn => {
      btn.addEventListener('click', handleCompareClick);
    });
  }

  async function handleCompareClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const btn = e.currentTarget;
    const productId = btn.dataset.productId;
    const isActive = btn.classList.contains('active');
    
    try {
      btn.disabled = true;
      
      if (isActive) {
        // Remove from compare
        const res = await fetch(`/compare/remove/${productId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        
        if (data.success) {
          btn.classList.remove('active');
          btn.title = 'Thêm vào so sánh';
          showToast('Đã xóa khỏi danh sách so sánh', 'info');
          compareCount = data.count || 0;
        }
      } else {
        // Add to compare
        const res = await fetch('/compare/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        });
        const data = await res.json();
        
        if (data.success) {
          btn.classList.add('active');
          btn.title = 'Xóa khỏi so sánh';
          showToast('Đã thêm vào so sánh. ' + (4 - data.count) + ' vị trí còn lại.', 'success');
          compareCount = data.count || 0;
          showCompareFloatingBar();
        } else {
          showToast(data.message || 'Không thể thêm vào so sánh', 'warning');
        }
      }
      
      updateCompareBadge();
    } catch (error) {
      console.error('Compare error:', error);
      showToast('Có lỗi xảy ra', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  function updateCompareBadge() {
    const badge = document.querySelector('.compare-count');
    if (badge) {
      badge.textContent = compareCount;
      badge.style.display = compareCount > 0 ? 'inline-block' : 'none';
    }
    
    // Update floating bar
    const floatBar = document.getElementById('compare-float-bar');
    if (floatBar) {
      if (compareCount > 0) {
        floatBar.style.display = 'block';
        floatBar.querySelector('.compare-float-count').textContent = compareCount;
      } else {
        floatBar.style.display = 'none';
      }
    }
  }

  function showCompareFloatingBar() {
    let floatBar = document.getElementById('compare-float-bar');
    
    if (!floatBar) {
      floatBar = document.createElement('div');
      floatBar.id = 'compare-float-bar';
      floatBar.className = 'compare-float-bar';
      floatBar.innerHTML = `
        <div class="compare-float-content">
          <i class="fas fa-balance-scale me-2"></i>
          <span>So sánh: <strong class="compare-float-count">${compareCount}</strong> sản phẩm</span>
          <a href="/compare" class="btn btn-primary btn-sm ms-3">Xem so sánh</a>
          <button class="btn btn-outline-danger btn-sm ms-2" id="clear-compare-float">Xóa</button>
        </div>
      `;
      document.body.appendChild(floatBar);
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .compare-float-bar {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #fff;
          padding: 12px 20px;
          border-radius: 30px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          z-index: 1050;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        .compare-float-content {
          display: flex;
          align-items: center;
        }
      `;
      document.head.appendChild(style);
      
      // Clear button
      floatBar.querySelector('#clear-compare-float').addEventListener('click', async () => {
        try {
          await fetch('/compare/clear', { method: 'POST' });
          compareCount = 0;
          updateCompareBadge();
          document.querySelectorAll('.btn-compare.active').forEach(b => {
            b.classList.remove('active');
          });
          showToast('Đã xóa danh sách so sánh', 'info');
        } catch (e) {
          console.error(e);
        }
      });
    }
    
    floatBar.style.display = 'block';
    floatBar.querySelector('.compare-float-count').textContent = compareCount;
  }

  /**
   * Recently Viewed Products (Local Storage)
   */
  function trackRecentlyViewed() {
    // Check if on product detail page
    const productId = document.querySelector('[data-product-id]')?.dataset.productId;
    const productData = window.productData; // Set from product detail page
    
    if (!productId || !productData) return;
    
    let recentlyViewed = getRecentlyViewed();
    
    // Remove if already exists
    recentlyViewed = recentlyViewed.filter(p => p.id !== productId);
    
    // Add to beginning
    recentlyViewed.unshift({
      id: productId,
      name: productData.name,
      slug: productData.slug,
      image: productData.image,
      price: productData.price,
      discountPrice: productData.discountPrice,
      viewedAt: new Date().toISOString()
    });
    
    // Limit to max items
    recentlyViewed = recentlyViewed.slice(0, MAX_RECENTLY_VIEWED);
    
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed));
  }

  function getRecentlyViewed() {
    try {
      return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY)) || [];
    } catch {
      return [];
    }
  }

  function loadRecentlyViewed() {
    const container = document.getElementById('recently-viewed-products');
    if (!container) return;
    
    const recentlyViewed = getRecentlyViewed();
    const currentProductId = document.querySelector('[data-product-id]')?.dataset.productId;
    
    // Filter out current product
    const productsToShow = recentlyViewed.filter(p => p.id !== currentProductId).slice(0, 4);
    
    if (productsToShow.length === 0) {
      container.closest('.recently-viewed-section')?.remove();
      return;
    }
    
    container.innerHTML = productsToShow.map(product => `
      <div class="col-6 col-md-3">
        <div class="card product-card h-100">
          <a href="/products/${product.slug}">
            <img src="${product.image || '/image/no-image.png'}" 
                 class="card-img-top" 
                 alt="${product.name}"
                 style="height: 150px; object-fit: cover;">
          </a>
          <div class="card-body p-2">
            <h6 class="card-title small text-truncate">
              <a href="/products/${product.slug}" class="text-decoration-none">${product.name}</a>
            </h6>
            <p class="card-text mb-0">
              ${product.discountPrice 
                ? `<del class="text-muted small">${formatPrice(product.price)}</del> 
                   <span class="text-danger fw-bold">${formatPrice(product.discountPrice)}</span>`
                : `<span class="fw-bold">${formatPrice(product.price)}</span>`
              }
            </p>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Quick View Modal
   */
  function initQuickView() {
    document.querySelectorAll('.btn-quick-view').forEach(btn => {
      btn.addEventListener('click', handleQuickView);
    });
  }

  async function handleQuickView(e) {
    e.preventDefault();
    const productId = e.currentTarget.dataset.productId;
    
    try {
      // Show loading
      showLoadingModal();
      
      const res = await fetch(`/api/products/${productId}`);
      const product = await res.json();
      
      if (product) {
        showQuickViewModal(product);
      }
    } catch (error) {
      console.error('Quick view error:', error);
      hideLoadingModal();
    }
  }

  function showQuickViewModal(product) {
    // Implementation for quick view modal
    // This would create/update a modal with product details
    hideLoadingModal();
    
    let modal = document.getElementById('quickViewModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'quickViewModal';
      modal.className = 'modal fade';
      modal.innerHTML = `
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"></h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <img src="" alt="" class="img-fluid quick-view-image">
                </div>
                <div class="col-md-6">
                  <div class="quick-view-details"></div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <a href="" class="btn btn-outline-primary">Xem chi tiết</a>
              <button type="button" class="btn btn-success btn-add-cart">
                <i class="fas fa-cart-plus me-1"></i>Thêm vào giỏ
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    
    // Update modal content
    modal.querySelector('.modal-title').textContent = product.name;
    modal.querySelector('.quick-view-image').src = product.images?.[0] || '/image/no-image.png';
    modal.querySelector('.modal-footer a').href = `/products/${product.slug}`;
    modal.querySelector('.quick-view-details').innerHTML = `
      <p class="text-muted">${product.category}</p>
      <h4 class="text-danger">${formatPrice(product.discountPrice || product.price)}</h4>
      ${product.discountPrice ? `<del class="text-muted">${formatPrice(product.price)}</del>` : ''}
      <p class="mt-3">${product.description?.substring(0, 200)}...</p>
      <p>
        <strong>Tình trạng:</strong> 
        ${product.stock > 0 
          ? '<span class="text-success">Còn hàng</span>' 
          : '<span class="text-danger">Hết hàng</span>'}
      </p>
    `;
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  }

  /**
   * Update header counts
   */
  async function updateHeaderCounts() {
    // Wishlist count (for logged in users)
    try {
      const res = await fetch('/user/wishlist/count');
      const data = await res.json();
      wishlistCount = data.count || 0;
      updateWishlistBadge();
    } catch {
      // User not logged in or error
    }
    
    // Compare count (from session)
    try {
      const res = await fetch('/compare/list');
      const data = await res.json();
      compareCount = data.count || 0;
      updateCompareBadge();
      
      // Mark buttons as active
      if (data.products?.length > 0) {
        data.products.forEach(p => {
          const btn = document.querySelector(`.btn-compare[data-product-id="${p._id}"]`);
          if (btn) btn.classList.add('active');
        });
      }
    } catch {
      // Error
    }
    
    // Check wishlist status for visible products
    await checkWishlistStatus();
  }

  async function checkWishlistStatus() {
    if (!isUserLoggedIn()) return;
    
    const productIds = [...document.querySelectorAll('.btn-wishlist[data-product-id]')]
      .map(btn => btn.dataset.productId);
    
    for (const productId of productIds) {
      try {
        const res = await fetch(`/user/wishlist/check/${productId}`);
        const data = await res.json();
        
        if (data.inWishlist) {
          const btn = document.querySelector(`.btn-wishlist[data-product-id="${productId}"]`);
          if (btn) {
            btn.classList.add('active');
            updateWishlistIcon(btn, true);
          }
        }
      } catch {
        // Error
      }
    }
  }

  /**
   * Utility functions
   */
  function isUserLoggedIn() {
    return document.body.classList.contains('user-logged-in') || 
           document.querySelector('.user-menu') !== null;
  }

  function showLoginPrompt(message) {
    if (confirm(message + '. Đăng nhập ngay?')) {
      const currentUrl = encodeURIComponent(window.location.href);
      window.location.href = `/auth/login?redirect=${currentUrl}`;
    }
  }

  function showToast(message, type = 'info') {
    // Simple toast notification
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      toastContainer.style.zIndex = '1080';
      document.body.appendChild(toastContainer);
    }
    
    const typeClasses = {
      success: 'bg-success text-white',
      error: 'bg-danger text-white',
      warning: 'bg-warning',
      info: 'bg-info text-white'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center ${typeClasses[type] || typeClasses.info} border-0`;
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  function showLoadingModal() {
    let loader = document.getElementById('loading-modal');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'loading-modal';
      loader.innerHTML = `
        <div class="loading-backdrop">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      `;
      loader.querySelector('.loading-backdrop').style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      `;
      document.body.appendChild(loader);
    }
    loader.style.display = 'block';
  }

  function hideLoadingModal() {
    const loader = document.getElementById('loading-modal');
    if (loader) loader.style.display = 'none';
  }

  // Public API
  return {
    init,
    updateWishlistBadge,
    updateCompareBadge,
    showToast,
    formatPrice,
    getRecentlyViewed
  };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  ProductFeatures.init();
});

// Export for global use
window.ProductFeatures = ProductFeatures;
