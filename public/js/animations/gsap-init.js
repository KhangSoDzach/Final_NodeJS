/**
 * GSAP Animation Initialization
 * Advanced animations using GSAP 3.14.2
 * Source Computer E-Commerce
 */

// Wait for GSAP to load
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined') {
    console.warn('GSAP library not loaded. Advanced animations disabled.');
    return;
  }

  // Register ScrollTrigger plugin if available
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ===================================================================
  // Hero Section Animations
  // ===================================================================

  const heroTimeline = gsap.timeline({
    defaults: {
      ease: 'power3.out',
      duration: 1
    }
  });

  // Animate hero badge
  if (document.querySelector('.hero-badge')) {
    heroTimeline.from('.hero-badge', {
      y: -30,
      opacity: 0,
      scale: 0.8,
      duration: 0.8
    });
  }

  // Animate hero title
  if (document.querySelector('.hero-title')) {
    heroTimeline.from('.hero-title', {
      y: 50,
      opacity: 0,
      duration: 1
    }, '-=0.5');
  }

  // Animate hero subtitle
  if (document.querySelector('.hero-subtitle')) {
    heroTimeline.from('.hero-subtitle', {
      y: 30,
      opacity: 0,
      duration: 0.8
    }, '-=0.7');
  }

  // Animate hero buttons
  if (document.querySelectorAll('.hero-actions .btn').length > 0) {
    heroTimeline.from('.hero-actions .btn', {
      y: 20,
      opacity: 0,
      stagger: 0.2,
      duration: 0.6
    }, '-=0.5');
  }

  // Animate hero image (if exists)
  if (document.querySelector('.hero-image')) {
    heroTimeline.from('.hero-image', {
      x: 100,
      opacity: 0,
      duration: 1.2
    }, '-=1');
  }

  // ===================================================================
  // Stats Counter Animation
  // ===================================================================

  if (document.querySelectorAll('.stat-value').length > 0) {
    document.querySelectorAll('.stat-value').forEach(stat => {
      const endValue = parseInt(stat.textContent.replace(/\D/g, ''));
      const suffix = stat.textContent.replace(/[\d,]/g, '');
      
      gsap.from(stat, {
        textContent: 0,
        duration: 2,
        ease: 'power1.out',
        snap: { textContent: 1 },
        scrollTrigger: {
          trigger: stat,
          start: 'top 80%',
          once: true
        },
        onUpdate: function() {
          const value = Math.ceil(this.targets()[0].textContent);
          stat.textContent = value.toLocaleString() + suffix;
        }
      });
    });
  }

  // ===================================================================
  // Product Cards Stagger Animation
  // ===================================================================

  if (document.querySelectorAll('.product-card').length > 0) {
    gsap.from('.product-card', {
      scrollTrigger: {
        trigger: '.products-grid',
        start: 'top 75%',
        once: true
      },
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power2.out'
    });
  }

  // ===================================================================
  // Category Cards Reveal
  // ===================================================================

  if (document.querySelectorAll('.category-card').length > 0) {
    gsap.from('.category-card', {
      scrollTrigger: {
        trigger: '.featured-categories',
        start: 'top 70%',
        once: true
      },
      scale: 0.8,
      opacity: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: 'back.out(1.7)'
    });
  }

  // ===================================================================
  // Feature Cards Animation
  // ===================================================================

  if (document.querySelectorAll('.feature-card').length > 0) {
    gsap.from('.feature-card', {
      scrollTrigger: {
        trigger: '.features-section',
        start: 'top 75%',
        once: true
      },
      y: 50,
      opacity: 0,
      duration: 0.7,
      stagger: 0.2,
      ease: 'power2.out'
    });
  }

  // ===================================================================
  // Section Titles Animation
  // ===================================================================

  if (document.querySelectorAll('.section-title').length > 0) {
    gsap.from('.section-title', {
      scrollTrigger: {
        trigger: '.section-title',
        start: 'top 80%',
        once: true
      },
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out'
    });
  }

  // ===================================================================
  // Timeline Items Animation (User Dashboard)
  // ===================================================================

  if (document.querySelectorAll('.timeline-item').length > 0) {
    gsap.from('.timeline-item', {
      scrollTrigger: {
        trigger: '.timeline',
        start: 'top 75%',
        once: true
      },
      x: -50,
      opacity: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: 'power2.out'
    });
  }

  // ===================================================================
  // Modal Entrance Animation
  // ===================================================================

  const animateModal = (modal) => {
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');
    const modalOverlay = modal.querySelector('.modal-overlay');

    const tl = gsap.timeline({
      defaults: {
        ease: 'power2.out'
      }
    });

    tl.fromTo(modalOverlay, {
      opacity: 0
    }, {
      opacity: 1,
      duration: 0.3
    });

    tl.fromTo(modalContent, {
      scale: 0.8,
      opacity: 0,
      y: 50
    }, {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.5
    }, '-=0.2');

    return tl;
  };

  // Listen for modal open events
  document.addEventListener('modalOpen', (e) => {
    animateModal(e.detail.modal);
  });

  // ===================================================================
  // Cart Item Add Animation
  // ===================================================================

  const animateCartAdd = (element) => {
    gsap.from(element, {
      scale: 0.5,
      opacity: 0,
      duration: 0.4,
      ease: 'back.out(2)'
    });
  };

  // Listen for cart item add events
  document.addEventListener('cartItemAdded', (e) => {
    animateCartAdd(e.detail.element);
  });

  // ===================================================================
  // Notification Toast Animation
  // ===================================================================

  const animateToast = (toast) => {
    const tl = gsap.timeline();

    tl.fromTo(toast, {
      x: 400,
      opacity: 0
    }, {
      x: 0,
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out'
    });

    // Auto-hide after 3 seconds
    tl.to(toast, {
      x: 400,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      delay: 3
    });

    return tl;
  };

  // Listen for toast events
  document.addEventListener('showToast', (e) => {
    animateToast(e.detail.element);
  });

  // ===================================================================
  // Image Gallery Animation (Product Detail)
  // ===================================================================

  if (document.querySelector('.product-gallery')) {
    gsap.from('.product-main-image', {
      scale: 0.95,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out'
    });

    gsap.from('.product-thumbnail', {
      y: 20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out',
      delay: 0.3
    });
  }

  // ===================================================================
  // Price Change Animation
  // ===================================================================

  const animatePriceChange = (element, newPrice) => {
    gsap.to(element, {
      scale: 1.1,
      duration: 0.2,
      ease: 'power1.out',
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        element.textContent = newPrice;
      }
    });
  };

  // Global animation helpers
  window.SourceComputerAnimations = {
    animateModal,
    animateCartAdd,
    animateToast,
    animatePriceChange
  };

  // ===================================================================
  // Parallax Effects
  // ===================================================================

  if (typeof ScrollTrigger !== 'undefined') {
    // Parallax backgrounds
    gsap.utils.toArray('.parallax-bg').forEach(bg => {
      gsap.to(bg, {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: bg,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    // Parallax elements
    gsap.utils.toArray('.parallax-slow').forEach(element => {
      gsap.to(element, {
        y: 100,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
  }

  // ===================================================================
  // Hover Animations Enhancement
  // ===================================================================

  // Add magnetic effect to buttons
  document.querySelectorAll('.btn-primary, .btn-accent').forEach(btn => {
    btn.addEventListener('mouseenter', function(e) {
      gsap.to(this, {
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    btn.addEventListener('mouseleave', function(e) {
      gsap.to(this, {
        scale: 1,
        x: 0,
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    btn.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(this, {
        x: x * 0.1,
        y: y * 0.1,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
  });

  // ===================================================================
  // Page Load Complete
  // ===================================================================

  console.log('✨ GSAP animations initialized');
});

// ===================================================================
// Intersection Observer Fallback
// For browsers without ScrollTrigger
// ===================================================================

if (typeof ScrollTrigger === 'undefined') {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements with scroll animations
  document.querySelectorAll('.scroll-fade, .scroll-scale, .scroll-fade-left, .scroll-fade-right').forEach(el => {
    observer.observe(el);
  });
}
