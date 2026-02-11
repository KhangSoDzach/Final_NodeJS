# Badge Pattern Documentation

Complete badge implementation patterns for status indicators, labels, and overlays using Tailwind CSS.

## Basic Badges

### Inline Badge
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-white bg-primary">
  New
</span>
```

### Badge Variants

**Primary:**
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-white bg-primary">
  Primary
</span>
```

**Success:**
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-white bg-success">
  Success
</span>
```

**Danger:**
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-white bg-danger">
  Danger
</span>
```

**Warning:**
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-dark bg-warning">
  Warning
</span>
```

**Info:**
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-white bg-info">
  Info
</span>
```

---

## Status Badges

### Order Status

**Processing:**
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-dark bg-warning">
  Processing
</span>
```

**Confirmed:**
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-white bg-primary">
  Confirmed
</span>
```

**Shipped:**
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-white bg-status-shipped">
  Shipped
</span>
```

**Delivered:**
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-white bg-success">
  Delivered
</span>
```

**Cancelled:**
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-white bg-danger">
  Cancelled
</span>
```

### Payment Status

**Pending:**
```jsx
<span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
  Pending
</span>
```

**Paid:**
```jsx
<span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Paid
</span>
```

**Failed:**
```jsx
<span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
  Failed
</span>
```

### User Status

**Active:**
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-white bg-status-active">
  Active
</span>
```

**Banned:**
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-white bg-status-banned">
  Banned
</span>
```

---

## Product Badges

### Discount Badge (Absolute Positioned)

```jsx
<div className="relative">
  {/* Product image */}
  <img src="product.jpg" alt="Product" />
  
  {/* Discount badge */}
  {discount > 0 && (
    <span className="absolute top-2 left-2 bg-danger text-white px-2 py-1 rounded-full text-xs font-bold z-10">
      -{discount}%
    </span>
  )}
</div>
```

### Stock Badge

**Out of Stock:**
```jsx
<span className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium bg-danger text-white z-10">
  Out of Stock
</span>
```

**Low Stock:**
```jsx
<span className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium bg-warning text-dark z-10">
  Only {stock} left
</span>
```

**In Stock:**
```jsx
<span className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium bg-success text-white z-10">
  In Stock
</span>
```

### New Product Badge

```jsx
<span className="absolute top-2 right-2 bg-accent text-white px-2 py-1 rounded-full text-xs font-bold z-10">
  NEW
</span>
```

### Featured Badge

```jsx
<span className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1">
  <i className="fas fa-star text-xs"></i>
  Featured
</span>
```

---

## Cart/Icon Badges (Notification Count)

### Cart Count Badge

```jsx
<a href="/cart" className="relative text-secondary text-xl hover:text-primary transition-colors">
  <i className="fas fa-shopping-cart"></i>
  {cartCount > 0 && (
    <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full w-[18px] h-[18px] flex items-center justify-center font-semibold">
      {cartCount}
    </span>
  )}
</a>
```

### Wishlist Count Badge

```jsx
<a href="/wishlist" className="relative text-secondary text-xl hover:text-primary transition-colors">
  <i className="fas fa-heart"></i>
  {wishlistCount > 0 && (
    <span className="absolute -top-2 -right-2 bg-accent text-white text-xs rounded-full w-[18px] h-[18px] flex items-center justify-center font-semibold">
      {wishlistCount}
    </span>
  )}
</a>
```

### Notification Badge

```jsx
<button className="relative p-2 text-grey hover:text-dark transition-colors">
  <i className="fas fa-bell text-xl"></i>
  {unreadCount > 0 && (
    <span className="absolute top-0 right-0 bg-danger text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-semibold px-1">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )}
</button>
```

---

## Badge Sizes

### Extra Small
```jsx
<span className="inline-block px-1.5 py-0.5 rounded-pill text-[10px] font-semibold text-white bg-primary">
  XS
</span>
```

### Small (Default)
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-white bg-primary">
  Small
</span>
```

### Medium
```jsx
<span className="inline-block px-4 py-1.5 rounded-pill text-sm font-semibold text-white bg-primary">
  Medium
</span>
```

### Large
```jsx
<span className="inline-block px-5 py-2 rounded-pill text-base font-semibold text-white bg-primary">
  Large
</span>
```

---

## Badge with Icons

### Icon Left
```jsx
<span className="inline-flex items-center gap-1 px-3 py-1 rounded-pill text-xs font-semibold text-white bg-success">
  <i className="fas fa-check text-xs"></i>
  Verified
</span>
```

### Icon Right
```jsx
<span className="inline-flex items-center gap-1 px-3 py-1 rounded-pill text-xs font-semibold text-white bg-danger">
  Alert
  <i className="fas fa-exclamation-triangle text-xs"></i>
</span>
```

### Icon Only
```jsx
<span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold text-white bg-primary">
  <i className="fas fa-star"></i>
</span>
```

---

## Interactive Badges

### Removable Badge (Tag)

```jsx
<span className="inline-flex items-center gap-2 px-3 py-1 rounded-pill text-xs font-semibold text-white bg-primary">
  Tag Name
  <button
    onClick={onRemove}
    className="bg-transparent border-none text-white hover:text-grey-lighter cursor-pointer p-0 transition-colors"
    aria-label="Remove tag"
  >
    <i className="fas fa-times text-xs"></i>
  </button>
</span>
```

### Clickable Badge

```jsx
<button
  onClick={onClick}
  className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark hover:scale-105 transition-all duration-short"
>
  Clickable
</button>
```

---

## Outlined Badges

### Primary Outline
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-primary bg-transparent border border-primary">
  Outlined
</span>
```

### Success Outline
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-success bg-transparent border border-success">
  Success
</span>
```

### Danger Outline
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-danger bg-transparent border border-danger">
  Danger
</span>
```

---

## Soft/Subtle Badges (Light Background)

### Primary Soft
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-primary bg-primary/10">
  Soft Primary
</span>
```

### Success Soft
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-success bg-success/10">
  Soft Success
</span>
```

### Danger Soft
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-danger bg-danger/10">
  Soft Danger
</span>
```

### Warning Soft
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-warning-dark bg-warning/20">
  Soft Warning
</span>
```

---

## Badge Positioning on Cards

### Top-Left Corner
```jsx
<div className="relative overflow-hidden rounded-lg bg-white shadow-sm">
  <span className="absolute top-2 left-2 px-2 py-1 bg-danger text-white text-xs font-bold rounded-full z-10">
    Sale
  </span>
  {/* Card content */}
</div>
```

### Top-Right Corner
```jsx
<div className="relative overflow-hidden rounded-lg bg-white shadow-sm">
  <span className="absolute top-2 right-2 px-2 py-1 bg-primary text-white text-xs font-bold rounded-full z-10">
    New
  </span>
  {/* Card content */}
</div>
```

### Bottom-Left Corner
```jsx
<div className="relative overflow-hidden rounded-lg bg-white shadow-sm">
  <span className="absolute bottom-2 left-2 px-2 py-1 bg-warning text-dark text-xs font-medium rounded z-10">
    Low Stock
  </span>
  {/* Card content */}
</div>
```

### Multiple Badges
```jsx
<div className="relative overflow-hidden rounded-lg bg-white shadow-sm">
  {/* Discount badge - top-left */}
  {discount > 0 && (
    <span className="absolute top-2 left-2 bg-danger text-white px-2 py-1 rounded-full text-xs font-bold z-10">
      -{discount}%
    </span>
  )}
  
  {/* New badge - top-right */}
  {isNew && (
    <span className="absolute top-2 right-2 bg-accent text-white px-2 py-1 rounded-full text-xs font-bold z-10">
      NEW
    </span>
  )}
  
  {/* Stock badge - bottom-left */}
  {stock < 5 && (
    <span className="absolute bottom-2 left-2 bg-warning text-dark px-2 py-1 rounded text-xs font-medium z-10">
      Only {stock} left
    </span>
  )}
  
  {/* Card content */}
</div>
```

---

## Animated Badges

### Pulse Animation
```jsx
<span className="relative inline-block px-3 py-1 rounded-pill text-xs font-semibold text-white bg-danger animate-pulse">
  Live
</span>
```

### With Dot Indicator
```jsx
<span className="inline-flex items-center gap-2 px-3 py-1 rounded-pill text-xs font-semibold text-white bg-success">
  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
  Online
</span>
```

---

## Accessibility

### ARIA Labels
```jsx
<span
  className="/* ... */"
  role="status"
  aria-label="Order status: Processing"
>
  Processing
</span>
```

### Screen Reader Text
```jsx
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold text-white bg-primary">
  <span className="sr-only">You have </span>
  5
  <span className="sr-only"> unread notifications</span>
</span>
```

---

## Dynamic Badge Component

```jsx
function Badge({ 
  children, 
  variant = 'primary', 
  size = 'sm', 
  rounded = 'pill',
  outline = false,
  soft = false,
  icon,
  onRemove
}) {
  const baseClasses = 'inline-flex items-center gap-1 font-semibold transition-all';
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
    lg: 'px-5 py-2 text-base'
  };
  
  const variantClasses = {
    primary: outline 
      ? 'text-primary bg-transparent border border-primary'
      : soft
      ? 'text-primary bg-primary/10'
      : 'text-white bg-primary',
    success: outline
      ? 'text-success bg-transparent border border-success'
      : soft
      ? 'text-success bg-success/10'
      : 'text-white bg-success',
    danger: outline
      ? 'text-danger bg-transparent border border-danger'
      : soft
      ? 'text-danger bg-danger/10'
      : 'text-white bg-danger',
    warning: outline
      ? 'text-warning-dark bg-transparent border border-warning'
      : soft
      ? 'text-warning-dark bg-warning/20'
      : 'text-dark bg-warning'
  };
  
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    pill: 'rounded-pill',
    full: 'rounded-full'
  };
  
  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${roundedClasses[rounded]}`}>
      {icon && <i className={icon}></i>}
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="bg-transparent border-none text-current hover:opacity-70 cursor-pointer p-0"
          aria-label="Remove"
        >
          <i className="fas fa-times text-xs"></i>
        </button>
      )}
    </span>
  );
}
```

**Usage:**
```jsx
<Badge variant="primary">Primary</Badge>
<Badge variant="success" size="lg">Success</Badge>
<Badge variant="danger" outline>Outlined</Badge>
<Badge variant="primary" soft icon="fas fa-check">Verified</Badge>
<Badge variant="primary" onRemove={() => handleRemove()}>Removable</Badge>
```
