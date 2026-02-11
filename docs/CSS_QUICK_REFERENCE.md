# CSS Quick Reference - Source Computer Design System

**⚡ Fast lookup for common classes and patterns**

---

## 🎨 Colors

```css
/* Text Colors */
.text-primary      /* Cyan neon */
.text-accent       /* Violet */
.text-success      /* Green */
.text-danger       /* Red */
.text-warning      /* Yellow */
.text-muted        /* Secondary text */

/* Backgrounds */
.bg-primary        /* Cyan background */
.bg-accent         /* Violet background */
.bg-success        /* Green background */
.bg-danger         /* Red background */
```

---

## 🔘 Buttons

```html
<!-- Primary Actions -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-accent">Accent</button>
<button class="btn btn-outline-primary">Outline</button>

<!-- Sizes -->
<button class="btn btn-sm btn-primary">Small</button>
<button class="btn btn-primary">Default</button>
<button class="btn btn-lg btn-primary">Large</button>

<!-- Full Width -->
<button class="btn btn-primary btn-block">Full Width</button>

<!-- Icon Button -->
<button class="icon-btn"><i class="fas fa-heart"></i></button>
```

---

## 🎴 Cards

```html
<!-- Basic Card -->
<div class="card">
  <div class="card-header">Header</div>
  <div class="card-body">Content</div>
  <div class="card-footer">Footer</div>
</div>

<!-- Glass Card -->
<div class="card glass-card">
  <div class="card-body">Glassmorphism effect</div>
</div>

<!-- Product Card -->
<article class="product-card">
  <div class="product-card-image">
    <img src="..." alt="...">
  </div>
  <div class="product-card-content">
    <h3 class="product-title">Title</h3>
    <div class="product-price">$99.99</div>
  </div>
</article>
```

---

## 📝 Forms

```html
<!-- Input -->
<div class="form-group">
  <label class="form-label">Email</label>
  <input type="email" class="form-control" placeholder="Enter email">
</div>

<!-- Select -->
<select class="form-control">
  <option>Option 1</option>
</select>

<!-- Checkbox -->
<label class="custom-checkbox">
  <input type="checkbox">
  <span class="checkbox-label">Remember me</span>
</label>

<!-- Radio -->
<label class="custom-radio">
  <input type="radio" name="choice">
  <span class="radio-label">Option 1</span>
</label>
```

---

## 🏷️ Badges

```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-danger">Danger</span>
<span class="badge badge-warning">Warning</span>

<!-- Pill -->
<span class="badge badge-pill badge-primary">12</span>

<!-- Dot Badge -->
<span class="badge badge-dot badge-success"></span>
```

---

## 🎭 Modals

```html
<div class="modal" id="myModal">
  <div class="modal-overlay"></div>
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Modal Title</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">Content</div>
      <div class="modal-footer">
        <button class="btn btn-secondary">Close</button>
        <button class="btn btn-primary">Save</button>
      </div>
    </div>
  </div>
</div>
```

---

## 📐 Layout

```html
<!-- Container -->
<div class="container">Content</div>
<div class="container-fluid">Full width</div>

<!-- Grid -->
<div class="grid grid-cols-3 gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>

<!-- Flex -->
<div class="d-flex justify-between align-center gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## 📱 Responsive

```html
<!-- Visibility -->
<div class="hide-mobile">Desktop only</div>
<div class="show-mobile">Mobile only</div>
<div class="hide-desktop">Mobile & tablet</div>

<!-- Responsive Grid -->
<div class="grid-responsive">
  <!-- 1 col mobile, 2 tablet, 3-4 desktop -->
</div>

<!-- Flex Mobile Column -->
<div class="flex-mobile-column">
  <!-- Stack on mobile, row on desktop -->
</div>
```

---

## 🎬 Animations

```html
<!-- Fade In -->
<div class="animate-fadeIn">Fade in</div>
<div class="animate-fadeInUp">Fade from bottom</div>

<!-- Slide -->
<div class="animate-slideInLeft">Slide from left</div>

<!-- Hover Effects -->
<div class="hover-lift">Lifts on hover</div>
<div class="hover-glow">Glows on hover</div>
<div class="hover-grow">Grows on hover</div>

<!-- Scroll Animations -->
<div class="scroll-fade">Fades in on scroll</div>
<div class="scroll-scale">Scales in on scroll</div>

<!-- Loading -->
<div class="skeleton skeleton-text"></div>
<div class="loading-bar"></div>
```

---

## 🎨 Utilities

```css
/* Spacing */
.m-4           /* Margin: 16px */
.p-6           /* Padding: 24px */
.mx-auto       /* Center horizontally */
.my-4          /* Margin top & bottom */
.gap-4         /* Gap: 16px */

/* Width/Height */
.w-full        /* Width: 100% */
.h-full        /* Height: 100% */
.max-w-screen-lg /* Max-width: 1024px */

/* Text */
.text-center   /* Center align */
.text-lg       /* Font size: 18px */
.font-bold     /* Font weight: 700 */
.truncate      /* Text overflow ellipsis */

/* Display */
.d-flex        /* Display: flex */
.d-grid        /* Display: grid */
.d-none        /* Display: none */

/* Position */
.position-relative
.position-absolute
.position-sticky

/* Border */
.rounded       /* Border radius: 8px */
.rounded-lg    /* Border radius: 12px */
.rounded-full  /* Border radius: 9999px */

/* Shadow */
.shadow        /* Box shadow */
.shadow-lg     /* Large shadow */
.shadow-glow-primary /* Neon glow */

/* Opacity */
.opacity-50    /* 50% opacity */
.opacity-0     /* Hidden */
```

---

## 🎯 Common Patterns

### Hero Section
```html
<section class="home-hero">
  <div class="container">
    <div class="home-hero-content">
      <span class="hero-badge">Welcome</span>
      <h1 class="hero-title">Amazing Title</h1>
      <p class="hero-subtitle">Description text</p>
      <div class="hero-actions">
        <button class="btn btn-primary btn-lg">Get Started</button>
        <button class="btn btn-outline-light btn-lg">Learn More</button>
      </div>
    </div>
  </div>
</section>
```

### Stats Grid
```html
<div class="home-stats">
  <div class="stat-card">
    <div class="stat-icon"><i class="fas fa-users"></i></div>
    <div class="stat-value">10,000+</div>
    <div class="stat-label">Customers</div>
  </div>
  <!-- More stat cards... -->
</div>
```

### Dropdown Menu
```html
<div class="dropdown">
  <button class="dropdown-toggle">Menu</button>
  <div class="dropdown-menu">
    <a href="#" class="dropdown-item">Action</a>
    <a href="#" class="dropdown-item">Another action</a>
    <hr class="dropdown-divider">
    <a href="#" class="dropdown-item">Separated link</a>
  </div>
</div>
```

### Alert Message
```html
<div class="alert alert-success">
  <i class="fas fa-check-circle"></i>
  <span>Success message!</span>
  <button class="alert-close">&times;</button>
</div>
```

### Tabs
```html
<div class="tabs" data-tabs>
  <div class="tab-nav">
    <button class="tab-link active" data-tab="tab1">Tab 1</button>
    <button class="tab-link" data-tab="tab2">Tab 2</button>
  </div>
  <div class="tab-content active" data-tab-content="tab1">
    Content 1
  </div>
  <div class="tab-content" data-tab-content="tab2">
    Content 2
  </div>
</div>
```

---

## 🎨 Design Tokens

```css
/* Colors */
--primary: #00d4ff;
--accent: #7c3aed;
--success: #00e676;
--danger: #ff5252;

/* Spacing */
--space-2: 8px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;

/* Typography */
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 20px;

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
--shadow-md: 0 4px 8px rgba(0,0,0,0.15);
--shadow-lg: 0 8px 16px rgba(0,0,0,0.2);
```

---

## 🎬 JavaScript

### Theme Toggle
```javascript
const html = document.documentElement;
const currentTheme = html.getAttribute('data-theme');
const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
html.setAttribute('data-theme', newTheme);
```

### Show Toast
```javascript
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} toast-enter`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

### Trigger Animation
```javascript
// Trigger GSAP animation
gsap.from('.element', {
  y: 50,
  opacity: 0,
  duration: 0.6
});

// Scroll trigger
gsap.from('.product-card', {
  scrollTrigger: {
    trigger: '.products-grid',
    start: 'top 75%'
  },
  y: 60,
  opacity: 0,
  stagger: 0.1
});
```

---

## 📦 Integration

### HTML Template
```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <!-- CSS -->
  <link rel="stylesheet" href="/css/master.css">
  
  <!-- Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
  
  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
  <!-- Content -->
  
  <!-- Scripts -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <script src="/js/animations/gsap-init.js"></script>
  <script src="/js/animations/page-transitions.js"></script>
</body>
</html>
```

---

## 🔍 Reference

📖 **Full Documentation**: `docs/CSS_INTEGRATION_GUIDE.md`  
⚡ **Performance**: `docs/CSS_PERFORMANCE.md`  
📊 **Project Summary**: `docs/CSS_PROJECT_SUMMARY.md`

---

**Quick Tip**: Search this file with `Ctrl+F` to quickly find what you need! 🔍
