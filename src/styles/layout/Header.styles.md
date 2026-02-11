# Header Component Styling Guide

Styling guidance for the Header component without modifying component logic.

## Structure Overview

The Header consists of:
1. **Top Header** - Logo, search bar, user actions
2. **Main Navigation** - Primary navigation menu

---

## Top Header Styling

### Container
```jsx
<header className="bg-white shadow-sm sticky top-0 z-sticky">
  <div className="border-b border-grey-light">
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center flex-wrap gap-md py-md">
        {/* Header content */}
      </div>
    </div>
  </div>
</header>
```

### Logo
```jsx
<div className="text-2xl font-bold">
  <a href="/" className="text-secondary flex items-center no-underline hover:text-secondary">
    <h1 className="mb-0 text-2xl">Source Computer</h1>
  </a>
</div>
```

### Mobile Navigation Toggle
```jsx
<button className="nav-toggle hidden bg-transparent border-none text-secondary text-2xl cursor-pointer p-1">
  <i className="fas fa-bars"></i>
</button>
```

**Mobile styles (add to component):**
```jsx
// In media query or conditional class
className="block md:hidden" // Show on mobile only
```

### Search Bar
```jsx
<div className="flex-1 mx-xl max-w-2xl">
  <form className="flex">
    <input
      type="text"
      placeholder="Search products..."
      className="flex-1 border border-border-light border-r-0 rounded-l-md px-4 py-2 focus:outline-none focus:border-primary"
    />
    <button
      type="submit"
      className="bg-primary text-white border-none rounded-r-md px-4 py-2 cursor-pointer transition-colors duration-short hover:bg-primary-dark"
    >
      <i className="fas fa-search"></i>
    </button>
  </form>
</div>
```

**Responsive search bar:**
```jsx
<div className="flex-1 mx-0 md:mx-xl w-full md:w-auto order-3 md:order-2 mt-sm md:mt-0">
  {/* Same search form */}
</div>
```

### User Actions

**Container:**
```jsx
<div className="flex items-center gap-md">
  {/* User action items */}
</div>
```

**Cart Icon with Badge:**
```jsx
<a href="/cart" className="relative text-secondary ml-md hover:text-primary transition-colors">
  <i className="fas fa-shopping-cart text-xl"></i>
  {cartCount > 0 && (
    <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full w-[18px] h-[18px] flex items-center justify-center">
      {cartCount}
    </span>
  )}
</a>
```

**Wishlist Icon:**
```jsx
<a href="/wishlist" className="relative text-secondary text-xl mr-md hover:text-primary transition-colors">
  <i className="fas fa-heart"></i>
  {wishlistCount > 0 && (
    <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full w-[18px] h-[18px] flex items-center justify-center">
      {wishlistCount}
    </span>
  )}
</a>
```

**User Dropdown:**
```jsx
<div className="relative group">
  <button className="flex items-center cursor-pointer px-3 py-2 rounded hover:bg-grey-lighter transition-colors">
    <i className="fas fa-user mr-2"></i>
    <span className="hidden md:inline">{userName}</span>
    <i className="fas fa-angle-down ml-xs transition-transform duration-medium group-hover:rotate-180"></i>
  </button>
  
  {/* Dropdown menu - see Dropdown.md for complete implementation */}
  <div className="absolute top-full right-0 left-auto min-w-[180px] bg-white shadow-md rounded-md opacity-0 invisible translate-y-2 transition-all duration-medium z-dropdown group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
    <a href="/profile" className="block px-md py-sm text-dark hover:bg-grey-lighter transition-colors">
      <i className="fas fa-user mr-2"></i> Profile
    </a>
    <a href="/orders" className="block px-md py-sm text-dark hover:bg-grey-lighter transition-colors">
      <i className="fas fa-box mr-2"></i> Orders
    </a>
    <a href="/logout" className="block px-md py-sm text-dark hover:bg-grey-lighter transition-colors">
      <i className="fas fa-sign-out-alt mr-2"></i> Logout
    </a>
  </div>
</div>
```

---

## Main Navigation Styling

### Navigation Container
```jsx
<nav className="bg-secondary text-white">
  <div className="container mx-auto px-4">
    <ul className="flex m-0 p-0 list-none">
      {/* Navigation items */}
    </ul>
  </div>
</nav>
```

### Navigation Items
```jsx
<li className="relative">
  <a
    href="/products"
    className="block px-lg py-md text-white uppercase text-sm font-medium tracking-wide no-underline hover:bg-white/10 transition-colors"
  >
    <i className="fas fa-laptop mr-xs"></i>
    Products
  </a>
</li>
```

### Navigation with Dropdown
```jsx
<li className="relative group">
  <a
    href="/categories"
    className="flex items-center px-lg py-md text-white uppercase text-sm font-medium tracking-wide no-underline hover:bg-white/10 transition-colors"
  >
    <i className="fas fa-list mr-xs"></i>
    Categories
    <i className="fas fa-angle-down ml-xs transition-transform duration-medium group-hover:rotate-180"></i>
  </a>
  
  {/* Dropdown menu */}
  <div className="hidden md:block absolute top-full left-0 bg-white min-w-[220px] shadow-md z-dropdown opacity-0 invisible translate-y-2 transition-all duration-medium group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
    <a href="/category/laptops" className="block px-md py-sm text-dark hover:bg-grey-lighter transition-colors normal-case">
      Laptops
    </a>
    <a href="/category/desktops" className="block px-md py-sm text-dark hover:bg-grey-lighter transition-colors normal-case">
      Desktops
    </a>
  </div>
</li>
```

---

## Responsive Behavior

### Mobile Header (max-width: 768px)

**Header layout:**
```jsx
<div className="flex flex-row flex-wrap items-center justify-between py-sm">
  <div className="w-1/2 mb-0">{/* Logo */}</div>
  <div className="w-auto order-2 mt-0">{/* User actions */}</div>
  <div className="block md:hidden order-3">{/* Mobile toggle */}</div>
  <div className="w-full order-4 mt-sm md:mt-0 md:flex-1 md:mx-xl md:order-2">
    {/* Search bar */}
  </div>
</div>
```

**Mobile navigation:**
```jsx
<ul className="flex flex-col md:flex-row m-0 p-0 list-none max-h-0 md:max-h-none overflow-hidden md:overflow-visible transition-all duration-300 [&.active]:max-h-[500px]">
  {/* Nav items */}
</ul>
```

**Mobile dropdown behavior:**
```jsx
// On mobile, dropdowns should use click instead of hover
<div className="md:hidden absolute top-full right-0 left-auto w-[200px] bg-white shadow-md z-[9999] hidden [&.show]:block">
  {/* Dropdown items */}
</div>
```

### Very Small Screens (max-width: 400px)

**Logo size:**
```jsx
<h1 className="text-lg sm:text-xl md:text-2xl">
  Source Computer
</h1>
```

**Search bar:**
```jsx
<input
  className="px-2 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base"
  // ...
/>
```

**User actions spacing:**
```jsx
<div className="flex items-center gap-xs sm:gap-sm md:gap-md">
  {/* User actions */}
</div>
```

---

## Sticky Header

For sticky positioning:
```jsx
<header className="bg-white shadow-sm sticky top-0 z-sticky">
  {/* Header content */}
</header>
```

With safe area for PWA:
```jsx
<header className="bg-white shadow-sm sticky top-0 z-sticky safe-area-padding-top">
  {/* Header content */}
</header>
```

---

## Animation States

### Dropdown arrow rotation:
```jsx
<i className="fas fa-angle-down transition-transform duration-medium group-hover:rotate-180"></i>
```

### Navigation hover:
```jsx
<a className="hover:bg-white/10 transition-colors duration-short">
  {/* Link content */}
</a>
```

### Mobile menu toggle:
```jsx
// Use JavaScript to toggle 'active' class
<ul className="max-h-0 overflow-hidden transition-all duration-300 [&.active]:max-h-[500px]">
  {/* Menu items */}
</ul>
```

---

## Accessibility

1. **Skip to content link:**
```jsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[9999] focus:p-md focus:bg-primary focus:text-white">
  Skip to main content
</a>
```

2. **ARIA labels:**
```jsx
<button aria-label="Toggle navigation menu" aria-expanded={isOpen}>
  <i className="fas fa-bars"></i>
</button>

<a href="/cart" aria-label={`Shopping cart with ${cartCount} items`}>
  <i className="fas fa-shopping-cart"></i>
</a>
```

3. **Focus states:**
```jsx
<a className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
  {/* Link content */}
</a>
```

---

## Complete Example

```jsx
export function Header({ cartCount, wishlistCount, user, isNavOpen, onToggleNav }) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-sticky">
      {/* Top Header */}
      <div className="border-b border-grey-light">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center flex-wrap gap-md py-md">
            {/* Logo */}
            <div className="w-full sm:w-auto order-1">
              <a href="/" className="text-secondary text-2xl font-bold flex items-center">
                <h1 className="mb-0 text-lg sm:text-2xl">Source Computer</h1>
              </a>
            </div>
            
            {/* Search Bar */}
            <div className="w-full md:flex-1 md:mx-xl order-3 md:order-2 mt-sm md:mt-0">
              <form className="flex">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="flex-1 border border-border-light border-r-0 rounded-l-md px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  className="bg-primary text-white rounded-r-md px-4 py-2 hover:bg-primary-dark transition-colors"
                >
                  <i className="fas fa-search"></i>
                </button>
              </form>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center gap-md order-2 md:order-3">
              <a href="/wishlist" className="relative text-secondary text-xl hover:text-primary">
                <i className="fas fa-heart"></i>
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full w-[18px] h-[18px] flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </a>
              
              <a href="/cart" className="relative text-secondary text-xl hover:text-primary">
                <i className="fas fa-shopping-cart"></i>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full w-[18px] h-[18px] flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </a>
              
              {user && (
                <div className="relative group">
                  <button className="flex items-center px-3 py-2 rounded hover:bg-grey-lighter">
                    <i className="fas fa-user mr-2"></i>
                    <span className="hidden md:inline">{user.name}</span>
                    <i className="fas fa-angle-down ml-xs transition-transform group-hover:rotate-180"></i>
                  </button>
                  {/* Dropdown menu */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Navigation */}
      <nav className="bg-secondary text-white">
        <div className="container mx-auto px-4">
          <ul className={`flex flex-col md:flex-row m-0 p-0 list-none transition-all ${isNavOpen ? 'max-h-[500px]' : 'max-h-0 md:max-h-none'} overflow-hidden md:overflow-visible`}>
            {/* Nav items */}
          </ul>
        </div>
      </nav>
    </header>
  );
}
```
