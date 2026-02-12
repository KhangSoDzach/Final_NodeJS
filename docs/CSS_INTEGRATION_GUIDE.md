# CSS Integration Guide

**Source Computer E-Commerce - Neomorphism Dark Mode Design System**

Version: 1.0.0  
Last Updated: February 12, 2026

---

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Integration Steps](#integration-steps)
4. [Design System](#design-system)
5. [Components Usage](#components-usage)
6. [JavaScript Integration](#javascript-integration)
7. [Theme Switching](#theme-switching)
8. [Performance Optimization](#performance-optimization)
9. [Browser Support](#browser-support)
10. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Option 1: Master CSS File (Recommended)

Include the master CSS file in your HTML `<head>`:

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Master Stylesheet -->
  <link rel="stylesheet" href="/css/master.css">
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
  
  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <title>Source Computer</title>
</head>
<body>
  <!-- Your content -->
</body>
</html>
```

### Option 2: Modular Imports

For custom builds, import only what you need:

```html
<!-- Required: Design System -->
<link rel="stylesheet" href="/css/design-system/variables-dark.css">
<link rel="stylesheet" href="/css/design-system/mixins.css">

<!-- Required: Layout -->
<link rel="stylesheet" href="/css/layout/header.css">
<link rel="stylesheet" href="/css/layout/footer.css">
<link rel="stylesheet" href="/css/layout/container.css">

<!-- Components (as needed) -->
<link rel="stylesheet" href="/css/components/buttons.css">
<link rel="stylesheet" href="/css/components/cards.css">
<link rel="stylesheet" href="/css/components/forms.css">

<!-- Utilities -->
<link rel="stylesheet" href="/css/utilities/responsive.css">
<link rel="stylesheet" href="/css/utilities/helpers.css">
```

### Option 3: EJS Template Integration

In your layout file (`views/layouts/main.ejs`):

```ejs
<!DOCTYPE html>
<html lang="<%= locale || 'en' %>" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="<%= description || 'Source Computer E-Commerce' %>">
  
  <!-- Master CSS -->
  <link rel="stylesheet" href="/css/master.css">
  
  <!-- Page-specific CSS -->
  <%- typeof additionalCSS !== 'undefined' ? additionalCSS : '' %>
  
  <title><%= title || 'Source Computer' %></title>
</head>
<body>
  <%- include('../partials/header') %>
  
  <main id="main-content" class="page-enter">
    <%- body %>
  </main>
  
  <%- include('../partials/footer') %>
  
  <!-- Scripts -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <script src="/js/animations/gsap-init.js"></script>
  <script src="/js/animations/page-transitions.js"></script>
  <script src="/js/main.js"></script>
</body>
</html>
```

---

## 📁 Project Structure

```
public/css/
├── master.css                    # Master import file (use this)
│
├── design-system/               # Design tokens & variables
│   ├── variables-dark.css       # Dark theme variables
│   ├── variables-light.css      # Light theme variables
│   ├── mixins.css              # Reusable mixins
│   └── index.css               # Design system docs
│
├── layout/                      # Page structure
│   ├── header.css              # Site header
│   ├── footer.css              # Site footer
│   ├── container.css           # Container layouts
│   ├── sidebar.css             # Sidebar navigation
│   └── index.css               # Layout docs
│
├── components/                  # Reusable UI components
│   ├── cards.css               # Card components
│   ├── buttons.css             # Button styles
│   ├── forms.css               # Form elements
│   ├── badges.css              # Badge components
│   ├── modals.css              # Modal dialogs
│   ├── alerts.css              # Alert messages
│   └── index.css               # Components docs
│
├── interactive/                 # Interactive elements
│   ├── tooltips.css            # Tooltip styles
│   ├── dropdowns.css           # Dropdown menus
│   ├── accordion.css           # Accordion components
│   ├── tabs.css                # Tab navigation
│   ├── loaders.css             # Loading states
│   ├── carousel.css            # Image carousels
│   └── index.css               # Interactive docs
│
├── pages/                       # Page-specific styles
│   ├── home.css                # Homepage
│   ├── products.css            # Product listing
│   ├── product-detail.css      # Single product
│   ├── cart.css                # Shopping cart
│   ├── user.css                # User dashboard
│   ├── admin.css               # Admin panel
│   └── index.css               # Pages docs
│
├── utilities/                   # Helper classes
│   ├── responsive.css          # Responsive utilities
│   ├── animations.css          # Animation classes
│   ├── helpers.css             # Common helpers
│   ├── print.css               # Print styles
│   └── index.css               # Utilities docs
│
└── animations/                  # Page transitions
    └── page-load.css           # Load animations

public/js/animations/
├── gsap-init.js                # GSAP configuration
└── page-transitions.js         # Page transition logic
```

---

## 🔧 Integration Steps

### Step 1: Update HTML Structure

Replace your old Bootstrap classes with new design system classes:

#### Before (Bootstrap):
```html
<div class="container">
  <div class="row">
    <div class="col-md-6">
      <button class="btn btn-primary">Click Me</button>
    </div>
  </div>
</div>
```

#### After (Custom Design System):
```html
<div class="container">
  <div class="grid grid-cols-2 gap-6">
    <div>
      <button class="btn btn-primary">Click Me</button>
    </div>
  </div>
</div>
```

### Step 2: Update EJS Templates

#### Header Template (`views/partials/header.ejs`):

```ejs
<header class="main-header" data-header>
  <div class="header-container container">
    <div class="header-content">
      <!-- Logo -->
      <a href="/" class="header-logo">
        <img src="/image/logo.png" alt="Source Computer" width="150" height="40">
      </a>
      
      <!-- Navigation -->
      <nav class="header-nav hide-mobile">
        <a href="/" class="nav-link <%= currentPage === 'home' ? 'active' : '' %>">
          <i class="fas fa-home"></i>
          Home
        </a>
        <a href="/products" class="nav-link <%= currentPage === 'products' ? 'active' : '' %>">
          <i class="fas fa-laptop"></i>
          Products
        </a>
        <a href="/about" class="nav-link">
          <i class="fas fa-info-circle"></i>
          About
        </a>
        <a href="/contact" class="nav-link">
          <i class="fas fa-envelope"></i>
          Contact
        </a>
      </nav>
      
      <!-- Actions -->
      <div class="header-actions">
        <!-- Theme Toggle -->
        <button class="icon-btn" id="theme-toggle" aria-label="Toggle theme">
          <i class="fas fa-moon"></i>
        </button>
        
        <!-- Search -->
        <button class="icon-btn" id="search-toggle" aria-label="Search">
          <i class="fas fa-search"></i>
        </button>
        
        <!-- Cart -->
        <a href="/cart" class="icon-btn cart-btn">
          <i class="fas fa-shopping-cart"></i>
          <% if (cartCount > 0) { %>
            <span class="badge badge-primary cart-count"><%= cartCount %></span>
          <% } %>
        </a>
        
        <!-- User Menu -->
        <% if (user) { %>
          <div class="dropdown">
            <button class="icon-btn" id="user-menu-toggle">
              <img src="<%= user.avatar || '/image/default-avatar.png' %>" 
                   alt="<%= user.name %>" 
                   class="user-avatar">
            </button>
            <div class="dropdown-menu" id="user-menu">
              <a href="/user/dashboard" class="dropdown-item">
                <i class="fas fa-user"></i> Dashboard
              </a>
              <a href="/user/orders" class="dropdown-item">
                <i class="fas fa-box"></i> Orders
              </a>
              <a href="/user/settings" class="dropdown-item">
                <i class="fas fa-cog"></i> Settings
              </a>
              <hr class="dropdown-divider">
              <a href="/auth/logout" class="dropdown-item text-danger">
                <i class="fas fa-sign-out-alt"></i> Logout
              </a>
            </div>
          </div>
        <% } else { %>
          <a href="/auth/login" class="btn btn-sm btn-primary">Login</a>
        <% } %>
        
        <!-- Mobile Menu Toggle -->
        <button class="icon-btn show-mobile" id="mobile-menu-toggle" aria-label="Menu">
          <i class="fas fa-bars"></i>
        </button>
      </div>
    </div>
  </div>
  
  <!-- Search Overlay -->
  <div class="search-overlay" id="search-overlay">
    <div class="search-overlay-content">
      <form action="/search" method="GET" class="search-form">
        <input type="search" 
               name="q" 
               placeholder="Search products..." 
               class="search-input"
               autocomplete="off">
        <button type="submit" class="search-submit">
          <i class="fas fa-search"></i>
        </button>
      </form>
      <button class="search-close" id="search-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
  
  <!-- Mobile Menu -->
  <div class="mobile-drawer" id="mobile-menu">
    <div class="mobile-menu-header">
      <h3>Menu</h3>
      <button class="icon-btn" id="mobile-menu-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <nav class="mobile-nav">
      <a href="/" class="mobile-nav-link">
        <i class="fas fa-home"></i> Home
      </a>
      <a href="/products" class="mobile-nav-link">
        <i class="fas fa-laptop"></i> Products
      </a>
      <a href="/about" class="mobile-nav-link">
        <i class="fas fa-info-circle"></i> About
      </a>
      <a href="/contact" class="mobile-nav-link">
        <i class="fas fa-envelope"></i> Contact
      </a>
    </nav>
  </div>
  
  <!-- Mobile Menu Overlay -->
  <div class="mobile-menu-overlay" id="mobile-menu-overlay"></div>
</header>
```

### Step 3: Product Card Component

Create reusable product card partial (`views/partials/product-card.ejs`):

```ejs
<article class="product-card">
  <div class="product-card-image">
    <img src="<%= product.image || '/image/products/default.jpg' %>" 
         alt="<%= product.name %>"
         loading="lazy">
    
    <% if (product.discount > 0) { %>
      <span class="product-badge badge-danger">
        -<%= product.discount %>%
      </span>
    <% } %>
    
    <% if (product.stock === 0) { %>
      <span class="product-badge badge-dark">Out of Stock</span>
    <% } %>
    
    <div class="product-card-actions">
      <button class="icon-btn btn-wishlist" 
              data-product-id="<%= product._id %>"
              aria-label="Add to wishlist">
        <i class="far fa-heart"></i>
      </button>
      <button class="icon-btn btn-quick-view" 
              data-product-id="<%= product._id %>"
              aria-label="Quick view">
        <i class="fas fa-eye"></i>
      </button>
      <button class="icon-btn btn-compare" 
              data-product-id="<%= product._id %>"
              aria-label="Add to compare">
        <i class="fas fa-exchange-alt"></i>
      </button>
    </div>
  </div>
  
  <div class="product-card-content">
    <div class="product-category">
      <%= product.category %>
    </div>
    
    <h3 class="product-title">
      <a href="/products/<%= product.slug %>"><%= product.name %></a>
    </h3>
    
    <div class="product-rating">
      <div class="stars">
        <% for (let i = 1; i <= 5; i++) { %>
          <i class="<%= i <= Math.floor(product.rating) ? 'fas' : 'far' %> fa-star"></i>
        <% } %>
      </div>
      <span class="rating-count">(<%= product.reviewCount %>)</span>
    </div>
    
    <div class="product-price">
      <% if (product.discount > 0) { %>
        <span class="price-original">$<%= product.price.toFixed(2) %></span>
        <span class="price-current">$<%= (product.price * (1 - product.discount/100)).toFixed(2) %></span>
      <% } else { %>
        <span class="price-current">$<%= product.price.toFixed(2) %></span>
      <% } %>
    </div>
    
    <button class="btn btn-primary btn-block add-to-cart" 
            data-product-id="<%= product._id %>"
            <%= product.stock === 0 ? 'disabled' : '' %>>
      <i class="fas fa-shopping-cart"></i>
      <%= product.stock === 0 ? 'Out of Stock' : 'Add to Cart' %>
    </button>
  </div>
</article>
```

---

## 🎨 Design System

### Color Tokens

```css
/* Primary Colors */
--primary: #00d4ff;           /* Cyan neon */
--primary-hover: #00b8e6;
--primary-rgb: 0, 212, 255;

/* Accent Colors */
--accent: #7c3aed;            /* Violet */
--accent-hover: #6d28d9;
--accent-rgb: 124, 58, 237;

/* Background Colors */
--bg-primary: #0f0f23;        /* Dark navy */
--bg-secondary: #1a1a3e;
--bg-tertiary: #252550;

/* Status Colors */
--success: #00e676;
--danger: #ff5252;
--warning: #ffd740;
--info: #00d4ff;
```

### Spacing Scale

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Typography

```css
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 20px;
--font-size-2xl: 24px;
--font-size-3xl: 30px;
--font-size-4xl: 36px;
```

---

## 🎬 JavaScript Integration

### Initialize Animations

```javascript
// public/js/main.js

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  
  // Initialize theme
  initTheme();
  
  // Initialize mobile menu
  initMobileMenu();
  
  // Initialize dropdowns
  initDropdowns();
  
  // Initialize tooltips
  initTooltips();
  
  // Initialize cart functionality
  initCart();
  
  // Initialize wishlist
  initWishlist();
  
  // Initialize search
  initSearch();
});

// Theme switching
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  
  // Get saved theme or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);
  
  themeToggle?.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update icon
    const icon = themeToggle.querySelector('i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  });
}

// Mobile menu
function initMobileMenu() {
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const menuClose = document.getElementById('mobile-menu-close');
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-menu-overlay');
  
  const openMenu = () => {
    menu?.classList.add('open');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  
  const closeMenu = () => {
    menu?.classList.remove('open');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  };
  
  menuToggle?.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);
}

// Add to cart
function initCart() {
  document.addEventListener('click', async (e) => {
    if (e.target.closest('.add-to-cart')) {
      const btn = e.target.closest('.add-to-cart');
      const productId = btn.dataset.productId;
      
      try {
        const response = await fetch('/api/cart/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId, quantity: 1 })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showToast('Product added to cart!', 'success');
          updateCartCount(data.cartCount);
        }
      } catch (error) {
        showToast('Failed to add product', 'error');
      }
    }
  });
}

// Toast notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} toast-enter`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Trigger custom event for GSAP animation
  document.dispatchEvent(new CustomEvent('showToast', {
    detail: { element: toast }
  }));
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

---

## 📱 Responsive Design

### Breakpoints

- **Mobile**: < 576px
- **Tablet**: 576px - 991px  
- **Desktop**: 992px+
- **Large Desktop**: 1200px+

### Usage Examples

```html
<!-- Hide on mobile -->
<div class="hide-mobile">Desktop content</div>

<!-- Show only on mobile -->
<div class="show-mobile">Mobile content</div>

<!-- Responsive grid -->
<div class="grid-responsive">
  <!-- 1 col mobile, 2 tablet, 3-4 desktop -->
</div>

<!-- Stack on mobile, row on desktop -->
<div class="flex-mobile-column">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## ⚡ Performance Optimization

See [CSS_PERFORMANCE.md](./CSS_PERFORMANCE.md) for detailed optimization guide.

### Quick Tips

1. **Use master.css** for production (includes all optimizations)
2. **Enable gzip compression** on your server
3. **Lazy load images** with `loading="lazy"`
4. **Use GSAP** for complex animations
5. **Preload critical resources**

```html
<!-- Preload critical CSS -->
<link rel="preload" href="/css/master.css" as="style">

<!-- Preload fonts -->
<link rel="preload" href="/fonts/roboto.woff2" as="font" type="font/woff2" crossorigin>
```

---

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11 (Limited support, fallbacks provided)

---

## 🐛 Troubleshooting

### Issue: Styles not loading

**Solution**: Check console for 404 errors, verify file paths are correct.

### Issue: GSAP animations not working

**Solution**: Ensure GSAP is loaded before `gsap-init.js`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="/js/animations/gsap-init.js"></script>
```

### Issue: Theme toggle not working

**Solution**: Initialize theme in JavaScript:

```javascript
document.addEventListener('DOMContentLoaded', initTheme);
```

---

## 📞 Support

For issues or questions, create an issue in the project repository.

---

**Happy Coding! 🚀**
