# Navigation Component Styling Guide

Styling guidance for Navigation components (main nav, sidebar nav) without modifying component logic.

## Main Navigation

### Container
```jsx
<nav className="bg-secondary text-white">
  <div className="container mx-auto px-4">
    {/* Nav list */}
  </div>
</nav>
```

### Nav List
```jsx
<ul className="flex flex-col md:flex-row m-0 p-0 list-none">
  {navItems.map(item => (
    <li key={item.id} className="relative">
      {/* Nav item */}
    </li>
  ))}
</ul>
```

### Nav Link (Basic)
```jsx
<a
  href={item.href}
  className="block px-lg py-md text-white uppercase text-sm font-medium tracking-wide no-underline hover:bg-white/10 transition-colors duration-short"
>
  <i className={`${item.icon} mr-xs`}></i>
  {item.label}
</a>
```

### Nav Link with Active State
```jsx
<a
  href={item.href}
  className={`block px-lg py-md text-white uppercase text-sm font-medium tracking-wide no-underline transition-colors duration-short ${
    isActive
      ? 'bg-white/10 border-b-2 border-primary'
      : 'hover:bg-white/10'
  }`}
>
  <i className={`${item.icon} mr-xs`}></i>
  {item.label}
</a>
```

---

## Navigation with Dropdowns

### Dropdown Container
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
  
  {/* Dropdown Menu - Desktop */}
  <div className="hidden md:block absolute top-full left-0 bg-white min-w-[220px] shadow-md rounded-md z-dropdown opacity-0 invisible translate-y-2 transition-all duration-medium group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
    {/* Dropdown items */}
  </div>
</li>
```

### Dropdown Items
```jsx
<a
  href="/category/laptops"
  className="block px-md py-sm text-dark no-underline normal-case hover:bg-grey-lighter transition-colors duration-short"
>
  <i className="fas fa-laptop mr-sm text-primary"></i>
  Laptops
</a>
```

---

## Mobile Navigation

### Mobile Toggle Button
```jsx
<button
  onClick={onToggle}
  className="md:hidden p-2 text-white hover:bg-white/10 rounded transition-colors"
  aria-label="Toggle navigation"
  aria-expanded={isOpen}
>
  <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
</button>
```

### Mobile Nav List
```jsx
<ul className={`
  flex flex-col md:flex-row 
  m-0 p-0 list-none 
  max-h-0 md:max-h-none 
  overflow-hidden md:overflow-visible 
  transition-all duration-300
  ${isOpen ? 'max-h-[500px]' : ''}
`}>
  {/* Nav items */}
</ul>
```

### Mobile Dropdown
```jsx
// On mobile, dropdowns should expand inline instead of absolute positioning
<li className="relative">
  <button
    onClick={onToggleDropdown}
    className="flex items-center justify-between w-full px-lg py-md text-white uppercase text-sm font-medium tracking-wide hover:bg-white/10 transition-colors"
  >
    <span>
      <i className="fas fa-list mr-xs"></i>
      Categories
    </span>
    <i className={`fas fa-angle-down transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
  </button>
  
  {/* Mobile Dropdown Items - Static positioning */}
  <div className={`
    md:absolute md:top-full md:left-0 
    bg-white md:min-w-[220px] md:shadow-md md:rounded-md 
    md:z-dropdown
    overflow-hidden transition-all duration-300
    ${isDropdownOpen ? 'max-h-[300px]' : 'max-h-0'}
    md:opacity-0 md:invisible md:translate-y-2
    md:group-hover:opacity-100 md:group-hover:visible md:group-hover:translate-y-0
  `}>
    <a
      href="/category/laptops"
      className="block px-lg md:px-md py-sm text-dark bg-grey-lighter md:bg-white hover:bg-grey-light transition-colors"
    >
      Laptops
    </a>
  </div>
</li>
```

---

## Sidebar Navigation (Admin)

### Sidebar Container
```jsx
<aside className="bg-gradient-sidebar text-white w-64 min-h-screen flex flex-col pb-xl rounded-r-[18px] shadow-xl fixed top-0 left-0 h-screen z-fixed overflow-y-auto sidebar-scrollbar transition-all duration-300">
  {/* Sidebar content */}
</aside>
```

### Sidebar Header
```jsx
<div className="px-md py-xl border-b border-admin-sidebar-border text-center">
  <h2 className="m-0 text-3xl font-bold tracking-widest text-white text-shadow-sidebar select-none">
    ADMIN
  </h2>
</div>
```

### Sidebar Nav
```jsx
<nav className="flex-1 px-xs pt-md">
  <ul className="m-0 p-0 list-none">
    {navItems.map(item => (
      <li key={item.id} className="mb-xs">
        <a
          href={item.href}
          className={`
            flex items-center gap-md 
            px-lg py-sm 
            text-base font-medium 
            text-admin-sidebar-link 
            rounded-md 
            transition-all duration-short 
            select-none
            ${isActive(item.href)
              ? 'bg-gradient-primary text-admin-sidebar-active shadow-nav-active'
              : 'hover:bg-gradient-primary hover:text-admin-sidebar-active hover:shadow-nav-active'
            }
          `}
        >
          <i className={`${item.icon} text-xl w-6 text-center text-admin-sidebar-icon flex-shrink-0 transition-colors ${isActive(item.href) ? 'text-admin-sidebar-active' : ''}`}></i>
          <span>{item.label}</span>
        </a>
      </li>
    ))}
  </ul>
</nav>
```

### Sidebar Footer Items
```jsx
<nav className="px-xs mt-auto">
  <ul className="m-0 p-0 list-none">
    <li className="mb-xs pt-md border-t border-admin-sidebar-border">
      <a
        href="/settings"
        className="flex items-center gap-md px-lg py-sm text-base font-medium text-admin-sidebar-link rounded-md hover:bg-gradient-primary hover:text-admin-sidebar-active"
      >
        <i className="fas fa-cog text-xl w-6 text-center text-admin-sidebar-icon"></i>
        <span>Settings</span>
      </a>
    </li>
    <li className="mb-xs">
      <a
        href="/logout"
        className="flex items-center gap-md px-lg py-sm text-base font-medium text-admin-sidebar-link rounded-md hover:bg-gradient-primary hover:text-admin-sidebar-active"
      >
        <i className="fas fa-sign-out-alt text-xl w-6 text-center text-admin-sidebar-icon"></i>
        <span>Logout</span>
      </a>
    </li>
  </ul>
</nav>
```

---

## Breadcrumb Navigation

```jsx
<nav aria-label="Breadcrumb" className="mb-lg text-sm">
  <ol className="flex items-center gap-xs list-none m-0 p-0">
    <li>
      <a href="/" className="text-primary hover:text-primary-dark transition-colors">
        Home
      </a>
    </li>
    <li aria-hidden="true" className="text-grey">
      /
    </li>
    <li>
      <a href="/products" className="text-primary hover:text-primary-dark transition-colors">
        Products
      </a>
    </li>
    <li aria-hidden="true" className="text-grey">
      /
    </li>
    <li aria-current="page" className="text-grey font-medium">
      Gaming Laptops
    </li>
  </ol>
</nav>
```

---

## Tab Navigation

### Tab Headers
```jsx
<div className="border-b border-grey-light">
  <nav className="flex" role="tablist">
    {tabs.map(tab => (
      <button
        key={tab.id}
        role="tab"
        aria-selected={activeTab === tab.id}
        aria-controls={`panel-${tab.id}`}
        className={`
          px-lg py-md 
          font-medium text-base 
          border-b-2 
          transition-all duration-short 
          relative
          ${activeTab === tab.id
            ? 'text-primary border-primary'
            : 'text-grey border-transparent hover:text-dark hover:border-grey-light'
          }
        `}
        onClick={() => setActiveTab(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </nav>
</div>
```

### Tab Panels
```jsx
<div className="p-lg">
  {tabs.map(tab => (
    <div
      key={tab.id}
      id={`panel-${tab.id}`}
      role="tabpanel"
      aria-labelledby={`tab-${tab.id}`}
      className={activeTab === tab.id ? 'block' : 'hidden'}
    >
      {tab.content}
    </div>
  ))}
</div>
```

---

## Pagination Navigation

```jsx
<nav aria-label="Pagination" className="flex justify-center gap-xs mt-xl flex-wrap">
  <a
    href="?page=1"
    className="inline-flex items-center justify-center min-w-[36px] h-9 px-sm border border-border-light rounded-md text-dark bg-white no-underline font-medium cursor-pointer transition-all duration-short hover:bg-[#e6f0ff] hover:text-primary hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
    aria-label="Previous page"
  >
    <i className="fas fa-chevron-left"></i>
  </a>
  
  {pageNumbers.map(page => (
    <a
      key={page}
      href={`?page=${page}`}
      className={`
        inline-flex items-center justify-center 
        min-w-[36px] h-9 px-sm 
        border rounded-md 
        no-underline font-medium 
        transition-all duration-short
        ${currentPage === page
          ? 'bg-primary text-white border-primary cursor-default'
          : 'bg-white text-dark border-border-light hover:bg-[#e6f0ff] hover:text-primary hover:border-primary'
        }
      `}
      aria-label={`Page ${page}`}
      aria-current={currentPage === page ? 'page' : undefined}
    >
      {page}
    </a>
  ))}
  
  <a
    href={`?page=${totalPages}`}
    className="inline-flex items-center justify-center min-w-[36px] h-9 px-sm border border-border-light rounded-md text-dark bg-white no-underline font-medium cursor-pointer transition-all duration-short hover:bg-[#e6f0ff] hover:text-primary hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
    aria-label="Next page"
  >
    <i className="fas fa-chevron-right"></i>
  </a>
</nav>
```

---

## Responsive Considerations

### Desktop (min-width: 768px)
- Horizontal navigation
- Hover-based dropdowns
- Full sidebar visible

### Mobile (max-width: 767px)
- Vertical stacked navigation
- Click-based dropdowns
- Collapsible sidebar
- Hamburger menu toggle

### Example Responsive Classes
```jsx
// Hide on mobile, show on desktop
<nav className="hidden md:block">

// Show on mobile, hide on desktop
<button className="block md:hidden">

// Different layout per breakpoint
<ul className="flex flex-col md:flex-row gap-sm md:gap-md">
```

---

## Accessibility

1. **Keyboard Navigation:**
```jsx
<a
  href="/link"
  className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
  onKeyDown={handleKeyDown}
>
```

2. **ARIA Labels:**
```jsx
<nav aria-label="Main navigation">
<button aria-expanded={isOpen} aria-label="Toggle menu">
<a aria-current="page">Current page</a>
```

3. **Skip Links:**
```jsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[9999] focus:p-md focus:bg-primary focus:text-white"
>
  Skip to main content
</a>
```
