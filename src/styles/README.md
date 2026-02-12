# Tailwind CSS Migration Guide

Complete guide for migrating from custom CSS to Tailwind CSS in the React frontend.

## Quick Reference

### CSS Variables to Tailwind Classes

| CSS Variable | Tailwind Class | Example Usage |
|--------------|----------------|---------------|
| `var(--primary-color)` | `text-primary` / `bg-primary` | `className="bg-primary text-white"` |
| `var(--secondary-color)` | `text-secondary` / `bg-secondary` | `className="bg-secondary"` |
| `var(--spacing-sm)` | `p-sm` / `m-sm` / `gap-sm` | `className="p-sm gap-sm"` |
| `var(--spacing-md)` | `p-md` / `m-md` / `gap-md` | `className="p-md"` |
| `var(--spacing-lg)` | `p-lg` / `m-lg` / `gap-lg` | `className="p-lg"` |
| `var(--border-radius-sm)` | `rounded-sm` | `className="rounded-sm"` |
| `var(--border-radius-md)` | `rounded-md` | `className="rounded-md"` |
| `var(--shadow-sm)` | `shadow-sm` | `className="shadow-sm"` |
| `var(--shadow-md)` | `shadow-md` | `className="shadow-md"` |

### Common Color Mappings

```jsx
// Status colors
<span className="bg-status-processing">Processing</span>
<span className="bg-status-confirmed">Confirmed</span>
<span className="bg-status-delivered">Delivered</span>

// Semantic colors
<button className="bg-success text-white">Success</button>
<button className="bg-danger text-white">Danger</button>
<button className="bg-warning text-dark">Warning</button>
```

---

## Component Pattern Examples

### Buttons

Original CSS:
```css
.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-sm);
  transition: all 0.3s ease;
}
.btn-primary {
  background-color: var(--primary-color);
  color: white;
}
```

Tailwind equivalent:
```jsx
<button className="inline-flex items-center justify-content-center px-4 py-2 rounded-md bg-primary text-white font-semibold transition-all duration-short hover:-translate-y-0.5 hover:shadow-sm">
  Primary Button
</button>

// Or use the custom component class:
<button className="btn-base bg-primary text-white">
  Primary Button
</button>
```

### Cards

Original CSS:
```css
.product-card {
  background-color: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}
.product-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-5px);
}
```

Tailwind equivalent:
```jsx
<div className="bg-white rounded-lg shadow-sm transition-all duration-medium hover:shadow-md hover:-translate-y-1 overflow-hidden">
  {/* Card content */}
</div>

// Or use the custom component class:
<div className="card-base">
  {/* Card content */}
</div>
```

### Forms

Original CSS:
```css
.form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
}
.form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgba(0, 102, 204, 0.25);
}
```

Tailwind equivalent:
```jsx
<input 
  type="text"
  className="w-full px-3 py-2 border border-border-light rounded-md text-base transition-all duration-short focus:outline-none focus:border-primary focus:shadow-focus"
  placeholder="Enter text"
/>

// Or use the custom component class:
<input type="text" className="input-base" placeholder="Enter text" />
```

---

## Layout Components

### Container

```jsx
<div className="container mx-auto px-4">
  {/* Container content - max-width 1320px, centered */}
</div>
```

### Grid System

Original CSS:
```css
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}
```

Tailwind equivalent:
```jsx
<div className="grid grid-cols-product gap-lg">
  {/* Grid items */}
</div>

// Or with responsive breakpoints:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
  {/* Grid items */}
</div>
```

### Flexbox Layouts

```jsx
// Flex row with gap
<div className="flex items-center gap-md">
  {/* Flex items */}
</div>

// Flex column
<div className="flex flex-col gap-sm">
  {/* Flex items */}
</div>

// Space between
<div className="flex justify-between items-center">
  {/* Flex items */}
</div>
```

---

## Complex Component Patterns

### Dropdown Menu

See [`components/Dropdown.md`](./components/Dropdown.md) for complete dropdown implementation.

**Basic structure:**
```jsx
<div className="relative">
  {/* Trigger */}
  <button className="flex items-center gap-xs px-lg py-sm rounded-md hover:bg-grey-lighter transition-colors duration-short">
    Menu <i className="fas fa-angle-down transition-transform duration-medium"></i>
  </button>
  
  {/* Menu */}
  <div className="absolute top-full left-0 min-w-[220px] bg-white shadow-md rounded-md opacity-0 invisible translate-y-2 transition-all duration-medium z-dropdown group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
    <a href="#" className="block px-md py-sm text-dark hover:bg-grey-lighter transition-colors duration-short">
      Item 1
    </a>
  </div>
</div>
```

### Badges

See [`components/Badge.md`](./components/Badge.md) for complete badge variants.

**Status badges:**
```jsx
// Processing
<span className="inline-block px-3 py-1 rounded-pill text-xs font-semibold bg-status-processing text-white">
  Processing
</span>

// Discount badge (absolute positioned)
<div className="relative">
  <span className="absolute top-2 left-2 bg-danger text-white px-2 py-1 rounded-full text-xs font-bold z-10">
    -20%
  </span>
</div>
```

### Alerts

```jsx
<div className="flex justify-between items-center p-md mb-lg border border-transparent rounded-sm shadow-md opacity-100 transition-opacity duration-500 bg-green-50 border-l-4 border-l-success animate-fade-in">
  <span>Success message!</span>
  <button className="bg-transparent border-none text-inherit text-xl leading-none cursor-pointer transition-transform duration-medium hover:scale-110">
    ×
  </button>
</div>
```

### Toast Notifications

```jsx
<div className="fixed bottom-5 right-5 min-w-[300px] max-w-[400px] bg-white shadow-lg rounded-md p-md z-toast opacity-0 translate-y-24 transition-all duration-medium [&.show]:opacity-100 [&.show]:translate-y-0">
  <div className="flex items-center">
    <i className="fas fa-check-circle text-2xl mr-md text-success"></i>
    <span className="flex-1">Toast message</span>
    <button className="bg-transparent border-none text-xl cursor-pointer text-grey">×</button>
  </div>
</div>
```

---

## Responsive Patterns

### Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `xs:` | 400px | Extra small phones |
| `sm:` | 576px | Small phones |
| `md:` | 768px | Tablets |
| `lg:` | 992px | Desktops |
| `xl:` | 1200px | Large desktops |
| `2xl:` | 1400px | Extra large screens |

### Responsive Examples

```jsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-md">
  {/* Items */}
</div>

// Different grid columns per breakpoint
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
  {/* Grid items */}
</div>

// Hide/show elements
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>

// Responsive spacing
<div className="p-sm md:p-md lg:p-lg">
  {/* Content */}
</div>
```

---

## Migration Notes

### 1. Custom CSS Variables Still Needed

Some dynamic values require CSS custom properties (in `tokens.css`):
- Complex gradients
- Calc() expressions
- Dynamic theme values modified at runtime

### 2. Animation Handling

**Simple transitions:** Use Tailwind utilities
```jsx
<div className="transition-colors duration-short hover:bg-primary">
  {/* Content */}
</div>
```

**Complex animations:** Use custom keyframes defined in `tailwind.config.js`
```jsx
<div className="animate-fade-in">
  {/* Animated content */}
</div>
```

### 3. State-Based Styling

Use conditional classes for state:
```jsx
<div className={`p-md rounded-md ${isActive ? 'bg-primary text-white' : 'bg-grey-light text-dark'}`}>
  {/* Content */}
</div>
```

Or use libraries like `clsx` or `classnames`:
```jsx
import clsx from 'clsx';

<div className={clsx(
  'p-md rounded-md transition-colors',
  isActive && 'bg-primary text-white',
  !isActive && 'bg-grey-light text-dark'
)}>
  {/* Content */}
</div>
```

### 4. Pseudo-classes

Tailwind supports most pseudo-classes out of the box:
```jsx
// Hover
<button className="bg-primary hover:bg-primary-dark">

// Focus
<input className="border-grey-light focus:border-primary focus:shadow-focus" />

// Active
<button className="bg-primary active:translate-y-0">

// Disabled
<button className="disabled:opacity-50 disabled:cursor-not-allowed">

// First/last child
<li className="first:border-t last:border-b">
```

### 5. Group and Peer Modifiers

For parent-based styling:
```jsx
// Group hover
<div className="group">
  <button>Hover me</button>
  <div className="group-hover:opacity-100 group-hover:visible">
    Dropdown menu
  </div>
</div>

// Peer (sibling-based)
<input type="checkbox" className="peer" />
<label className="peer-checked:text-primary">
  Label changes when checkbox is checked
</label>
```

### 6. Common Pitfalls

**❌ Don't use arbitrary values for theme tokens:**
```jsx
<div className="p-[16px]"> {/* Bad */}
```

**✅ Use theme values:**
```jsx
<div className="p-md"> {/* Good - uses theme spacing */}
```

**❌ Don't concatenate classes:**
```jsx
<div className={`text-${color}`}> {/* Bad - doesn't work with purge */}
```

**✅ Use complete class names:**
```jsx
<div className={color === 'primary' ? 'text-primary' : 'text-secondary'}> {/* Good */}
```

---

## Best Practices

1. **Use theme tokens consistently** - Always use theme values instead of arbitrary values
2. **Leverage custom component classes** - Use `.btn-base`, `.card-base`, `.input-base` for consistency
3. **Group related utilities** - Order classes logically: layout → sizing → spacing → colors → effects
4. **Extract repeated patterns** - Create reusable components for common UI patterns
5. **Use responsive utilities** - Apply mobile-first approach with breakpoint modifiers
6. **Maintain accessibility** - Include focus states and ARIA attributes
7. **Test in all breakpoints** - Verify responsive behavior across all screen sizes

---

## Additional Resources

- [Layout Style Examples](./layout/) - Header, Footer, Navigation
- [Component Patterns](./components/) - Dropdowns, Badges, Forms
- [Tailwind Documentation](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)
