/**
 * Page Transition Effects
 * Smooth page load and navigation transitions
 * Source Computer E-Commerce
 */

(function() {
  'use strict';

  // ===================================================================
  // Configuration
  // ===================================================================

  const config = {
    pageLoadAnimation: true,
    navigationTransition: true,
    transitionDuration: 800,
    overlayColor: 'rgba(15, 15, 35, 0.95)'
  };

  // ===================================================================
  // Page Load Animation
  // ===================================================================

  class PageTransition {
    constructor() {
      this.overlay = null;
      this.isTransitioning = false;
      this.init();
    }

    init() {
      // Create transition overlay
      this.createOverlay();

      // Animate page entrance
      if (config.pageLoadAnimation) {
        this.animatePageLoad();
      }

      // Setup navigation listeners
      if (config.navigationTransition) {
        this.setupNavigationTransitions();
      }

      // Handle back/forward browser navigation
      window.addEventListener('popstate', () => {
        this.handlePageChange();
      });
    }

    createOverlay() {
      this.overlay = document.createElement('div');
      this.overlay.id = 'page-transition-overlay';
      this.overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: ${config.overlayColor};
        backdrop-filter: blur(10px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity ${config.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1);
      `;

      // Add loader
      const loader = document.createElement('div');
      loader.className = 'page-loader';
      loader.innerHTML = `
        <div class="loader-spinner" style="
          width: 50px;
          height: 50px;
          border: 3px solid rgba(0, 212, 255, 0.2);
          border-top-color: #00d4ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
      `;

      this.overlay.appendChild(loader);
      document.body.appendChild(this.overlay);

      // Add spinner animation
      if (!document.getElementById('page-transition-styles')) {
        const style = document.createElement('style');
        style.id = 'page-transition-styles';
        style.textContent = `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .page-fade-in {
            animation: pageFadeIn ${config.transitionDuration}ms ease-out;
          }
          
          @keyframes pageFadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `;
        document.head.appendChild(style);
      }
    }

    animatePageLoad() {
      // Show overlay initially
      document.body.style.overflow = 'hidden';
      this.overlay.style.opacity = '1';

      // Wait for page content to be ready
      const onReady = () => {
        setTimeout(() => {
          this.hideOverlay();
          
          // Fade in main content
          const mainContent = document.querySelector('main, .main-content, .page-content');
          if (mainContent) {
            mainContent.classList.add('page-fade-in');
          }

          document.body.style.overflow = '';
        }, 300);
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
      } else {
        onReady();
      }
    }

    setupNavigationTransitions() {
      // Intercept link clicks
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        
        if (!link) return;
        if (link.target === '_blank') return;
        if (link.download) return;
        if (link.href.startsWith('javascript:')) return;
        if (link.href.startsWith('mailto:')) return;
        if (link.href.startsWith('tel:')) return;
        if (link.getAttribute('data-no-transition')) return;
        
        // Check if it's an internal link
        const url = new URL(link.href);
        if (url.origin === window.location.origin) {
          e.preventDefault();
          this.navigateTo(link.href);
        }
      });
    }

    navigateTo(url) {
      if (this.isTransitioning) return;

      this.isTransitioning = true;
      this.showOverlay();

      setTimeout(() => {
        window.location.href = url;
      }, config.transitionDuration);
    }

    showOverlay() {
      this.overlay.style.pointerEvents = 'all';
      this.overlay.style.opacity = '1';
      document.body.style.overflow = 'hidden';
    }

    hideOverlay() {
      this.overlay.style.opacity = '0';
      setTimeout(() => {
        this.overlay.style.pointerEvents = 'none';
        this.isTransitioning = false;
      }, config.transitionDuration);
    }

    handlePageChange() {
      this.showOverlay();
      setTimeout(() => {
        window.location.reload();
      }, config.transitionDuration / 2);
    }
  }

  // ===================================================================
  // Smooth Scroll Enhancement
  // ===================================================================

  class SmoothScroll {
    constructor() {
      this.init();
    }

    init() {
      // Smooth scroll for anchor links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const href = anchor.getAttribute('href');
          
          if (href === '#') return;

          const target = document.querySelector(href);
          if (!target) return;

          e.preventDefault();

          const offsetTop = target.getBoundingClientRect().top + window.pageYOffset;
          const headerHeight = document.querySelector('header')?.offsetHeight || 0;

          window.scrollTo({
            top: offsetTop - headerHeight - 20,
            behavior: 'smooth'
          });

          // Update URL hash
          if (history.pushState) {
            history.pushState(null, null, href);
          }
        });
      });
    }
  }

  // ===================================================================
  // Lazy Loading Images Enhancement
  // ===================================================================

  class LazyLoadImages {
    constructor() {
      this.images = [];
      this.observer = null;
      this.init();
    }

    init() {
      this.images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
      
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadImage(entry.target);
              this.observer.unobserve(entry.target);
            }
          });
        }, {
          rootMargin: '50px'
        });

        this.images.forEach(img => this.observer.observe(img));
      } else {
        // Fallback for browsers without IntersectionObserver
        this.images.forEach(img => this.loadImage(img));
      }
    }

    loadImage(img) {
      const src = img.getAttribute('data-src');
      if (!src) return;

      // Create a new image to preload
      const tempImg = new Image();
      tempImg.onload = () => {
        img.src = src;
        img.removeAttribute('data-src');
        img.classList.add('loaded');
        
        // Add fade-in effect
        img.style.opacity = '0';
        setTimeout(() => {
          img.style.transition = 'opacity 0.3s ease-in';
          img.style.opacity = '1';
        }, 10);
      };
      tempImg.src = src;
    }
  }

  // ===================================================================
  // Progress Bar (page load)
  // ===================================================================

  class LoadingProgressBar {
    constructor() {
      this.bar = null;
      this.init();
    }

    init() {
      this.bar = document.createElement('div');
      this.bar.id = 'loading-progress-bar';
      this.bar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #00d4ff, #7c3aed);
        z-index: 10000;
        transition: width 0.3s ease;
        box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
      `;
      document.body.appendChild(this.bar);

      // Simulate progress
      this.start();

      // Complete when page is loaded
      window.addEventListener('load', () => {
        this.complete();
      });
    }

    start() {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 90) {
          clearInterval(interval);
          progress = 90;
        }
        this.bar.style.width = progress + '%';
      }, 200);
    }

    complete() {
      this.bar.style.width = '100%';
      setTimeout(() => {
        this.bar.style.opacity = '0';
        setTimeout(() => {
          this.bar.remove();
        }, 300);
      }, 200);
    }
  }

  // ===================================================================
  // Initialize
  // ===================================================================

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTransitions);
  } else {
    initTransitions();
  }

  function initTransitions() {
    // Initialize page transitions
    new PageTransition();

    // Initialize smooth scroll
    new SmoothScroll();

    // Initialize lazy loading
    new LazyLoadImages();

    // Initialize progress bar
    if (config.pageLoadAnimation) {
      new LoadingProgressBar();
    }

    console.log('📄 Page transitions initialized');
  }

  // Export to global scope
  window.SourceComputerTransitions = {
    config,
    PageTransition,
    SmoothScroll,
    LazyLoadImages
  };

})();
