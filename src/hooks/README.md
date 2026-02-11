# React Hooks Documentation

This directory contains reusable React hooks ported from the vanilla JavaScript DOM manipulation code in `public/js/main.js`.

## Table of Contents

- [useToast](#usetoast)
- [useFlashAlerts](#useflashalerts)
- [useNavToggle](#usenavtoggle)
- [useAdminSidebarToggle](#useadminsidebartoggle)
- [DOM Contracts](#dom-contracts)
- [Integration Guide](#integration-guide)

---

## useToast

Manages toast notifications with auto-dismiss and manual close functionality.

### Import

```javascript
import useToast from './hooks/useToast';
```

### API Signature

```typescript
useToast(options?: {
  autoDismissDelay?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  toastSelector?: string;
  closeButtonSelector?: string;
}): {
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `autoDismissDelay` | number | `5000` | Auto-dismiss delay in milliseconds |
| `position` | string | `'top-right'` | Toast container position |
| `toastSelector` | string | `'.toast'` | CSS selector for toast elements |
| `closeButtonSelector` | string | `'.toast-close'` | CSS selector for close buttons |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `showToast` | Function | Creates and shows a toast notification programmatically |

### DOM Contract

**Expected markup for server-rendered toasts:**

```html
<div class="toast">
  <span>Toast message</span>
  <button class="toast-close">×</button>
</div>
```

**Programmatic toasts** use dynamic container creation (no markup required).

### Usage Example

```javascript
import useToast from './hooks/useToast';

function ProductPage() {
  const { showToast } = useToast({ autoDismissDelay: 5000 });

  const handleAddToCart = async () => {
    try {
      await addToCart(productId);
      showToast('success', 'Product added to cart!');
    } catch (error) {
      showToast('error', 'Failed to add product. Please try again.');
    }
  };

  return <button onClick={handleAddToCart}>Add to Cart</button>;
}
```

---

## useFlashAlerts

Handles server-rendered flash messages (success/error alerts).

### Import

```javascript
import useFlashAlerts from './hooks/useFlashAlerts';
```

### API Signature

```typescript
useFlashAlerts(options?: {
  selector?: string;
  closeButtonSelector?: string;
  autoHideDuration?: number;
  scrollToTop?: boolean;
  fadeDuration?: number;
}): void
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `selector` | string | `'.alert'` | CSS selector for alert elements |
| `closeButtonSelector` | string | `'.close-alert'` | CSS selector for close buttons |
| `autoHideDuration` | number | `5000` | Auto-hide delay in milliseconds |
| `scrollToTop` | boolean | `true` | Whether to scroll to top when alerts present |
| `fadeDuration` | number | `500` | Fade out animation duration (ms) |

### Returns

This hook doesn't return any values (returns `void`).

### DOM Contract

**Expected markup:**

```html
<div class="alert alert-success">
  <span>Success message</span>
  <button class="close-alert">×</button>
</div>

<div class="alert alert-danger">
  <span>Error message</span>
  <button class="close-alert">×</button>
</div>
```

**Required classes:**
- `.alert` - Base alert class
- `.alert-success` - Success variant (for debug logging)
- `.alert-danger` - Error variant (for debug logging)
- `.close-alert` - Close button
- `.alert-visible` - Applied by hook for animation

### Usage Example

```javascript
import useFlashAlerts from './hooks/useFlashAlerts';

function App() {
  // Automatically handles all flash messages on the page
  useFlashAlerts({
    autoHideDuration: 5000,
    scrollToTop: true
  });

  return (
    <div className="app">
      {/* Server-rendered flash messages will be handled automatically */}
      <Header />
      <Routes />
      <Footer />
    </div>
  );
}
```

---

## useNavToggle

Controls mobile navigation menu toggle with icon switching.

### Import

```javascript
import useNavToggle from './hooks/useNavToggle';
```

### API Signature

```typescript
useNavToggle(options?: {
  navToggleSelector?: string;
  navListSelector?: string;
  mainNavSelector?: string;
}): {
  isOpen: boolean;
  toggleNav: () => void;
  closeNav: () => void;
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `navToggleSelector` | string | `'.nav-toggle'` | CSS selector for toggle button |
| `navListSelector` | string | `'.nav-list'` | CSS selector for nav menu |
| `mainNavSelector` | string | `'.main-nav'` | CSS selector for nav container |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `isOpen` | boolean | Whether the nav menu is currently open |
| `toggleNav` | Function | Toggles the nav menu |
| `closeNav` | Function | Closes the nav menu |

### DOM Contract

**Expected markup:**

```html
<nav class="main-nav">
  <button class="nav-toggle">
    <i class="fas fa-bars"></i>
  </button>
  <ul class="nav-list">
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
  </ul>
</nav>
```

**Icon behavior:**
- Closed state: `fa-bars` (hamburger icon)
- Open state: `fa-times` (close icon)

**Classes applied by hook:**
- `.nav-list.active` - When menu is open
- `.main-nav.menu-active` - When menu is open

### Usage Example

```javascript
import useNavToggle from './hooks/useNavToggle';

function Header() {
  const { isOpen, closeNav } = useNavToggle();

  // Close menu when navigating to new page
  const handleLinkClick = () => {
    closeNav();
  };

  return (
    <nav className="main-nav">
      <button className="nav-toggle" aria-expanded={isOpen}>
        <i className="fas fa-bars"></i>
      </button>
      <ul className="nav-list">
        <li><a href="/" onClick={handleLinkClick}>Home</a></li>
        <li><a href="/about" onClick={handleLinkClick}>About</a></li>
      </ul>
    </nav>
  );
}
```

---

## useAdminSidebarToggle

Manages admin sidebar visibility on mobile with outside-click detection.

### Import

```javascript
import useAdminSidebarToggle from './hooks/useAdminSidebarToggle';
```

### API Signature

```typescript
useAdminSidebarToggle(options?: {
  mobileToggleSelector?: string;
  sidebarSelector?: string;
  breakpoint?: number;
}): {
  isOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mobileToggleSelector` | string | `'.mobile-toggle'` | CSS selector for toggle button |
| `sidebarSelector` | string | `'.admin-sidebar'` | CSS selector for sidebar |
| `breakpoint` | number | `768` | Breakpoint width (px) for mobile/desktop |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `isOpen` | boolean | Whether the sidebar is currently open |
| `toggleSidebar` | Function | Toggles the sidebar |
| `closeSidebar` | Function | Closes the sidebar |

### DOM Contract

**Expected markup:**

```html
<div class="admin-container">
  <button class="mobile-toggle">
    <i class="fas fa-bars"></i>
  </button>
  
  <aside class="admin-sidebar">
    <nav>
      <ul>
        <li><a href="/admin/dashboard">Dashboard</a></li>
        <li><a href="/admin/products">Products</a></li>
      </ul>
    </nav>
  </aside>
  
  <main class="admin-content">
    <!-- Main content -->
  </main>
</div>
```

**Icon behavior:**
- Closed state: `fa-bars` (hamburger icon)
- Open state: `fa-times` (close icon)

**Classes applied by hook:**
- `.admin-sidebar.show` - When sidebar is open

**Behavior:**
- Closes when clicking outside sidebar
- Closes when window width exceeds breakpoint (default 768px)
- Prevents click propagation within sidebar

### Usage Example

```javascript
import useAdminSidebarToggle from './hooks/useAdminSidebarToggle';

function AdminLayout({ children }) {
  const { isOpen, closeSidebar } = useAdminSidebarToggle({
    breakpoint: 768
  });

  // Close sidebar after navigation
  const handleNavigate = () => {
    closeSidebar();
  };

  return (
    <div className="admin-container">
      <button className="mobile-toggle" aria-expanded={isOpen}>
        <i className="fas fa-bars"></i>
      </button>
      
      <aside className="admin-sidebar">
        <nav onClick={handleNavigate}>
          <ul>
            <li><a href="/admin/dashboard">Dashboard</a></li>
            <li><a href="/admin/products">Products</a></li>
          </ul>
        </nav>
      </aside>
      
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}
```

---

## DOM Contracts

All hooks interact with the DOM via `querySelector` and expect specific markup patterns. Here's a summary:

### Global Requirements

- **FontAwesome Icons**: Hooks use FontAwesome classes (`fa-bars`, `fa-times`, etc.)
- **CSS Classes**: All expected classes must be present in your markup
- **Event Propagation**: Hooks manage `stopPropagation()` where necessary

### Customization

Each hook accepts CSS selectors as parameters, allowing you to customize which elements it targets without changing markup classes:

```javascript
// Example: Custom class names
useNavToggle({
  navToggleSelector: '.my-custom-toggle',
  navListSelector: '.my-custom-menu'
});
```

---

## Integration Guide

### Basic Setup

1. **Create hook directory** (if not exists):
   ```bash
   mkdir -p src/hooks
   ```

2. **Import hooks in your components**:
   ```javascript
   import useToast from './hooks/useToast';
   import useFlashAlerts from './hooks/useFlashAlerts';
   import useNavToggle from './hooks/useNavToggle';
   import useAdminSidebarToggle from './hooks/useAdminSidebarToggle';
   ```

### App-Level Integration

For hooks that should run once (like `useFlashAlerts`), place them in your root component:

```javascript
// App.jsx
import useFlashAlerts from './hooks/useFlashAlerts';
import useToast from './hooks/useToast';

function App() {
  useFlashAlerts(); // Handles server-rendered flash messages
  const { showToast } = useToast();

  return (
    <AppContext.Provider value={{ showToast }}>
      <Router>
        <Routes />
      </Router>
    </AppContext.Provider>
  );
}
```

### Component-Level Integration

For component-specific hooks:

```javascript
// Header.jsx
import useNavToggle from './hooks/useNavToggle';

function Header() {
  const { isOpen } = useNavToggle();
  
  return (
    <header>
      <nav className="main-nav">
        <button className="nav-toggle" aria-expanded={isOpen}>
          <i className="fas fa-bars"></i>
        </button>
        <ul className="nav-list">
          <li><a href="/">Home</a></li>
        </ul>
      </nav>
    </header>
  );
}
```

```javascript
// AdminLayout.jsx
import useAdminSidebarToggle from './hooks/useAdminSidebarToggle';

function AdminLayout({ children }) {
  const { isOpen } = useAdminSidebarToggle();
  
  return (
    <div className="admin-container">
      <button className="mobile-toggle" aria-expanded={isOpen}>
        <i className="fas fa-bars"></i>
      </button>
      <aside className="admin-sidebar">
        {/* sidebar content */}
      </aside>
      <main>{children}</main>
    </div>
  );
}
```

### Context Pattern (Optional)

To share `showToast` across your app without prop drilling:

```javascript
// contexts/ToastContext.jsx
import { createContext, useContext } from 'react';
import useToast from '../hooks/useToast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const { showToast } = useToast();
  
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}
```

```javascript
// Usage in any component
import { useToastContext } from './contexts/ToastContext';

function ProductCard() {
  const { showToast } = useToastContext();
  
  const handleClick = () => {
    showToast('success', 'Added to cart!');
  };
  
  return <button onClick={handleClick}>Add to Cart</button>;
}
```

---

## Best Practices

1. **Cleanup**: All hooks properly clean up event listeners and timers on unmount
2. **Dependencies**: Dependency arrays are carefully managed to prevent unnecessary re-runs
3. **Refs**: Use refs for DOM elements to avoid querying on every render
4. **Selectors**: Use custom selectors when your markup differs from defaults
5. **Error Handling**: Hooks log warnings when required DOM elements aren't found

---

## Migration from vanilla JS

If you're migrating from `public/js/main.js`:

| Original Code | React Hook | Notes |
|---------------|------------|-------|
| Toast handling (lines 13-30) | `useToast` | Programmatic API added |
| Flash messages (lines 32-64) | `useFlashAlerts` | Auto-scroll maintained |
| Nav toggle (lines 66-88) | `useNavToggle` | Icon switching preserved |
| Admin sidebar (lines 90-149) | `useAdminSidebarToggle` | All interactions maintained |

All original functionality has been preserved, including:
- Auto-dismiss timers
- Icon class toggling
- Outside-click detection
- Window resize handling
- Click propagation control
