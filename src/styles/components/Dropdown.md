# Dropdown Pattern Documentation

Complete dropdown implementation patterns for React components using Tailwind CSS.

## Basic Dropdown

### Desktop Hover-Based Dropdown

```jsx
<div className="relative group">
  {/* Trigger */}
  <button className="flex items-center gap-xs px-lg py-sm text-grey-dark bg-transparent border-none cursor-pointer rounded-md hover:bg-grey-lighter transition-colors duration-short">
    Menu
    <i className="fas fa-angle-down transition-transform duration-medium group-hover:rotate-180"></i>
  </button>
  
  {/* Dropdown Menu */}
  <div className="
    absolute top-full left-0 mt-1
    min-w-[220px] 
    bg-white 
    shadow-md 
    rounded-md 
    border border-border-light
    z-dropdown
    opacity-0 invisible translate-y-2
    transition-all duration-medium
    group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
  ">
    <a href="#" className="block px-md py-sm text-dark no-underline hover:bg-grey-lighter transition-colors duration-short">
      Item 1
    </a>
    <a href="#" className="block px-md py-sm text-dark no-underline hover:bg-grey-lighter transition-colors duration-short">
      Item 2
    </a>
    <div className="h-px bg-border-light my-sm"></div>
    <a href="#" className="block px-md py-sm text-danger no-underline hover:bg-grey-lighter transition-colors duration-short">
      Delete
    </a>
  </div>
</div>
```

### Click-Based Dropdown (Mobile Friendly)

```jsx
function Dropdown({ isOpen, onToggle, items }) {
  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={onToggle}
        className="flex items-center gap-xs px-lg py-sm text-grey-dark bg-transparent border-none cursor-pointer rounded-md hover:bg-grey-lighter transition-colors duration-short"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Menu
        <i className={`fas fa-angle-down transition-transform duration-medium ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>
      
      {/* Dropdown Menu */}
      <div className={`
        absolute top-full left-0 mt-1
        min-w-[220px]
        bg-white
        shadow-md
        rounded-md
        border border-border-light
        z-dropdown
        transition-all duration-medium
        ${isOpen 
          ? 'opacity-100 visible translate-y-0' 
          : 'opacity-0 invisible translate-y-2 pointer-events-none'
        }
      `}>
        {items.map(item => (
          <a
            key={item.id}
            href={item.href}
            className="block px-md py-sm text-dark no-underline hover:bg-grey-lighter transition-colors duration-short"
          >
            {item.icon && <i className={`${item.icon} mr-sm`}></i>}
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}
```

---

## Dropdown Positioning

### Right-Aligned Dropdown

```jsx
<div className="relative group">
  <button className="/* ... */">Menu</button>
  
  <div className="
    absolute top-full right-0 left-auto mt-1
    /* rest of classes */
  ">
    {/* Items */}
  </div>
</div>
```

### Center-Aligned Dropdown

```jsx
<div className="relative group">
  <button className="/* ... */">Menu</button>
  
  <div className="
    absolute top-full left-1/2 -translate-x-1/2 mt-1
    /* rest of classes */
  ">
    {/* Items */}
  </div>
</div>
```

### Dropup (Opens Upward)

```jsx
<div className="relative group">
  <button className="/* ... */">Menu</button>
  
  <div className="
    absolute bottom-full left-0 mb-1
    /* rest of classes */
    translate-y-2
    group-hover:translate-y-0
  ">
    {/* Items */}
  </div>
</div>
```

---

## User Actions Dropdown (Navigation)

```jsx
<div className="relative group">
  <button className="flex items-center px-3 py-2 rounded-md hover:bg-grey-lighter transition-colors">
    <i className="fas fa-user mr-2 text-grey"></i>
    <span className="hidden md:inline text-dark">{userName}</span>
    <i className="fas fa-angle-down ml-2 transition-transform duration-medium group-hover:rotate-180"></i>
  </button>
  
  {/* Desktop Dropdown */}
  <div className="
    hidden md:block
    absolute top-full right-0 left-auto mt-1
    min-w-[180px]
    bg-white
    shadow-md
    rounded-md
    z-dropdown
    opacity-0 invisible translate-y-2
    transition-all duration-medium
    group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
  ">
    <div className="px-md py-sm border-b border-grey-lighter">
      <p className="m-0 text-sm font-semibold text-dark">{userName}</p>
      <p className="m-0 text-xs text-grey">{userEmail}</p>
    </div>
    
    <a href="/profile" className="block px-md py-sm text-dark hover:bg-grey-lighter transition-colors">
      <i className="fas fa-user mr-sm text-primary"></i>
      Profile
    </a>
    <a href="/orders" className="block px-md py-sm text-dark hover:bg-grey-lighter transition-colors">
      <i className="fas fa-box mr-sm text-primary"></i>
      Orders
    </a>
    <a href="/wishlist" className="block px-md py-sm text-dark hover:bg-grey-lighter transition-colors">
      <i className="fas fa-heart mr-sm text-primary"></i>
      Wishlist
    </a>
    
    <div className="h-px bg-border-light"></div>
    
    <a href="/logout" className="block px-md py-sm text-danger hover:bg-grey-lighter transition-colors">
      <i className="fas fa-sign-out-alt mr-sm"></i>
      Logout
    </a>
  </div>
</div>
```

---

## Mobile Dropdown Behavior

### Responsive Dropdown

```jsx
<div className="relative group">
  <button
    onClick={handleToggle}
    className="flex items-center gap-xs px-lg py-sm rounded-md hover:bg-grey-lighter transition-colors"
  >
    Menu
    <i className={`fas fa-angle-down transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
  </button>
  
  {/* Mobile: Static positioning, Desktop: Absolute positioning */}
  <div className={`
    md:absolute md:top-full md:left-0 md:mt-1
    md:min-w-[220px]
    bg-white
    md:shadow-md
    md:rounded-md
    md:border md:border-border-light
    md:z-dropdown
    overflow-hidden
    transition-all duration-medium
    ${isOpen ? 'max-h-[400px]' : 'max-h-0'}
    md:opacity-0 md:invisible md:translate-y-2
    md:group-hover:opacity-100 md:group-hover:visible md:group-hover:translate-y-0
    md:[&.show]:opacity-100 md:[&.show]:visible md:[&.show]:translate-y-0
  `}
    className={isOpen ? 'show' : ''}
  >
    {/* Items */}
  </div>
</div>
```

---

## Navigation Dropdown with Categories

```jsx
<li className="relative group">
  <a
    href="/categories"
    className="flex items-center px-lg py-md text-white uppercase text-sm font-medium hover:bg-white/10 transition-colors"
  >
    <i className="fas fa-list mr-xs"></i>
    Categories
    <i className="fas fa-angle-down ml-xs transition-transform duration-medium group-hover:rotate-180"></i>
  </a>
  
  <div className="
    hidden md:block
    absolute top-full left-0
    min-w-[220px]
    bg-white
    shadow-md
    rounded-md
    z-dropdown
    opacity-0 invisible translate-y-2
    transition-all duration-medium
    group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
  ">
    <a href="/category/laptops" className="flex items-center px-md py-sm text-dark hover:bg-grey-lighter transition-colors normal-case">
      <i className="fas fa-laptop mr-sm text-primary w-6"></i>
      <span>Laptops</span>
      <span className="ml-auto text-xs text-grey">(124)</span>
    </a>
    <a href="/category/desktops" className="flex items-center px-md py-sm text-dark hover:bg-grey-lighter transition-colors normal-case">
      <i className="fas fa-desktop mr-sm text-primary w-6"></i>
      <span>Desktops</span>
      <span className="ml-auto text-xs text-grey">(89)</span>
    </a>
    <a href="/category/components" className="flex items-center px-md py-sm text-dark hover:bg-grey-lighter transition-colors normal-case">
      <i className="fas fa-microchip mr-sm text-primary w-6"></i>
      <span>Components</span>
      <span className="ml-auto text-xs text-grey">(256)</span>
    </a>
    
    <div className="h-px bg-border-light my-xs"></div>
    
    <a href="/categories" className="block px-md py-sm text-primary hover:bg-grey-lighter transition-colors text-center font-medium normal-case">
      View All Categories
    </a>
  </div>
</li>
```

---

## Z-Index Management

Dropdown z-index values from `tailwind.config.js`:

```jsx
// Use these z-index classes for proper layering
z-dropdown    // 100 - Standard dropdowns
z-sticky      // 100 - Sticky headers
z-fixed       // 1000 - Fixed sidebars
z-modal       // 1050 - Modal dialogs
z-tooltip     // 1070 - Tooltips
z-toast       // 9998 - Toast notifications
z-pwa         // 9999 - PWA install banner
```

---

## Accessibility

### ARIA Attributes

```jsx
<div className="relative">
  <button
    onClick={handleToggle}
    aria-haspopup="true"
    aria-expanded={isOpen}
    aria-controls="dropdown-menu"
    className="/* ... */"
  >
    Menu
  </button>
  
  <div
    id="dropdown-menu"
    role="menu"
    aria-labelledby="menu-button"
    className={`/* ... */ ${isOpen ? 'block' : 'hidden'}`}
  >
    <a href="#" role="menuitem" className="/* ... */">
      Item 1
    </a>
  </div>
</div>
```

### Keyboard Navigation

```jsx
function Dropdown() {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Focus next item
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Focus previous item
    }
  };
  
  return (
    <div onKeyDown={handleKeyDown}>
      {/* Dropdown */}
    </div>
  );
}
```

### Focus Management

```jsx
// Trap focus within dropdown when open
<div
  className="/* ... */"
  onKeyDown={(e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      // Move focus to next/previous item
    }
  }}
>
```

---

## Close on Outside Click

```jsx
function Dropdown() {
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  return (
    <div ref={dropdownRef} className="relative">
      {/* Dropdown */}
    </div>
  );
}
```

---

## Animation Variants

### Fade + Slide
```jsx
className="
  opacity-0 invisible translate-y-2
  transition-all duration-medium
  group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
"
```

### Scale + Fade
```jsx
className="
  opacity-0 invisible scale-95
  transition-all duration-medium
  group-hover:opacity-100 group-hover:visible group-hover:scale-100
"
```

### Slide from Side
```jsx
className="
  opacity-0 invisible -translate-x-4
  transition-all duration-medium
  group-hover:opacity-100 group-hover:visible group-hover:translate-x-0
"
```
