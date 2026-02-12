# Footer Component Styling Guide

Styling guidance for the Footer component without modifying component logic.

## Structure Overview

The Footer consists of:
1. **Footer Content** - Grid of footer sections (About, Links, Contact, etc.)
2. **Footer Bottom** - Copyright and legal information

---

## Footer Container

```jsx
<footer className="bg-secondary text-white pt-xl pb-0">
  <div className="container mx-auto px-4">
    {/* Footer content */}
  </div>
</footer>
```

With PWA safe area:
```jsx
<footer className="bg-secondary text-white pt-xl pb-0 safe-area-padding-bottom">
  {/* Footer content */}
</footer>
```

---

## Footer Content Grid

### Grid Layout
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-xl mb-xl">
  {/* Footer sections */}
</div>
```

**Auto-fit variant:**
```jsx
<div className="grid grid-cols-auto-fit-250 gap-xl mb-xl">
  {/* Footer sections */}
</div>
```

### Footer Section

```jsx
<div className="footer-section">
  <h3 className="text-white text-xl mb-lg font-semibold">
    About Us
  </h3>
  <p className="text-white/70 mb-md text-base">
    Your description text here...
  </p>
</div>
```

### Footer Links List

```jsx
<div>
  <h3 className="text-white text-xl mb-lg font-semibold">
    Quick Links
  </h3>
  <ul className="m-0 p-0 list-none">
    <li className="mb-sm">
      <a
        href="/about"
        className="text-white/70 no-underline hover:text-white transition-colors duration-short"
      >
        About Us
      </a>
    </li>
    <li className="mb-sm">
      <a
        href="/contact"
        className="text-white/70 no-underline hover:text-white transition-colors duration-short"
      >
        Contact
      </a>
    </li>
    <li className="mb-sm">
      <a
        href="/privacy"
        className="text-white/70 no-underline hover:text-white transition-colors duration-short"
      >
        Privacy Policy
      </a>
    </li>
    <li className="mb-sm">
      <a
        href="/terms"
        className="text-white/70 no-underline hover:text-white transition-colors duration-short"
      >
        Terms of Service
      </a>
    </li>
  </ul>
</div>
```

### Contact Information

```jsx
<div>
  <h3 className="text-white text-xl mb-lg font-semibold">
    Contact Info
  </h3>
  <div className="space-y-sm">
    <p className="flex items-center text-white/70 mb-md">
      <i className="fas fa-map-marker-alt mr-sm text-primary"></i>
      123 Main Street, City, Country
    </p>
    <p className="flex items-center text-white/70 mb-md">
      <i className="fas fa-phone mr-sm text-primary"></i>
      +1 234 567 8900
    </p>
    <p className="flex items-center text-white/70 mb-md">
      <i className="fas fa-envelope mr-sm text-primary"></i>
      info@example.com
    </p>
  </div>
</div>
```

### Social Media Links

```jsx
<div>
  <h3 className="text-white text-xl mb-lg font-semibold">
    Follow Us
  </h3>
  <div className="flex gap-md">
    <a
      href="https://facebook.com"
      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-primary hover:text-white transition-all duration-short"
      aria-label="Facebook"
    >
      <i className="fab fa-facebook-f"></i>
    </a>
    <a
      href="https://twitter.com"
      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-primary hover:text-white transition-all duration-short"
      aria-label="Twitter"
    >
      <i className="fab fa-twitter"></i>
    </a>
    <a
      href="https://instagram.com"
      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-primary hover:text-white transition-all duration-short"
      aria-label="Instagram"
    >
      <i className="fab fa-instagram"></i>
    </a>
    <a
      href="https://linkedin.com"
      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-primary hover:text-white transition-all duration-short"
      aria-label="LinkedIn"
    >
      <i className="fab fa-linkedin-in"></i>
    </a>
  </div>
</div>
```

---

## Footer Bottom

### Container
```jsx
<div className="bg-black/20 py-md text-center mt-xl">
  <div className="container mx-auto px-4">
    <p className="mb-0 text-white/50 text-sm">
      &copy; {new Date().getFullYear()} Source Computer. All rights reserved.
    </p>
  </div>
</div>
```

### With Additional Links
```jsx
<div className="bg-black/20 py-md mt-xl">
  <div className="container mx-auto px-4">
    <div className="flex flex-col md:flex-row justify-between items-center gap-md">
      <p className="mb-0 text-white/50 text-sm order-2 md:order-1">
        &copy; {new Date().getFullYear()} Source Computer. All rights reserved.
      </p>
      <div className="flex gap-md order-1 md:order-2">
        <a href="/privacy" className="text-white/50 text-sm hover:text-white transition-colors">
          Privacy
        </a>
        <a href="/terms" className="text-white/50 text-sm hover:text-white transition-colors">
          Terms
        </a>
        <a href="/cookies" className="text-white/50 text-sm hover:text-white transition-colors">
          Cookies
        </a>
      </div>
    </div>
  </div>
</div>
```

---

## Newsletter Subscription

```jsx
<div>
  <h3 className="text-white text-xl mb-lg font-semibold">
    Newsletter
  </h3>
  <p className="text-white/70 mb-md text-sm">
    Subscribe to get special offers and updates
  </p>
  <form className="flex gap-sm" onSubmit={handleSubscribe}>
    <input
      type="email"
      placeholder="Enter your email"
      className="flex-1 px-3 py-2 rounded-md border border-white/20 bg-white/10 text-white placeholder-white/50 focus:outline-none focus:border-primary focus:bg-white/20 transition-all"
    />
    <button
      type="submit"
      className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-dark transition-colors whitespace-nowrap"
    >
      Subscribe
    </button>
  </form>
</div>
```

---

## Responsive Behavior

### Mobile (max-width: 768px)

**Grid stacking:**
```jsx
<div className="grid grid-cols-1 gap-xl mb-xl">
  {/* Footer sections stack vertically */}
</div>
```

**Section spacing:**
```jsx
<div className="mb-lg md:mb-0">
  <h3 className="text-white text-lg md:text-xl mb-md md:mb-lg">
    {/* Section title */}
  </h3>
  {/* Section content */}
</div>
```

### Tablet (576px - 767px)

**Two columns:**
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg md:gap-xl mb-xl">
  {/* Sections in 2 columns on tablet */}
</div>
```

### Desktop (min-width: 992px)

**Four columns:**
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-xl mb-xl">
  {/* Full 4-column layout */}
</div>
```

---

## Payment Methods / Trust Badges

```jsx
<div>
  <h3 className="text-white text-xl mb-lg font-semibold">
    We Accept
  </h3>
  <div className="flex flex-wrap gap-md">
    <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
      <i className="fab fa-cc-visa text-2xl text-blue-600"></i>
    </div>
    <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
      <i className="fab fa-cc-mastercard text-2xl text-orange-600"></i>
    </div>
    <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
      <i className="fab fa-cc-paypal text-2xl text-blue-500"></i>
    </div>
    <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
      <i className="fab fa-cc-amex text-2xl text-blue-700"></i>
    </div>
  </div>
</div>
```

---

## Accessibility

1. **Heading hierarchy:**
```jsx
<h3 className="text-white text-xl mb-lg"> {/* Use h3 for footer sections */}
  Section Title
</h3>
```

2. **Link accessibility:**
```jsx
<a
  href="/link"
  className="text-white/70 hover:text-white"
  aria-label="Descriptive label for screen readers"
>
  Link Text
</a>
```

3. **Social media links:**
```jsx
<a
  href="https://facebook.com"
  aria-label="Follow us on Facebook"
  target="_blank"
  rel="noopener noreferrer"
>
  <i className="fab fa-facebook-f" aria-hidden="true"></i>
</a>
```

4. **Form labels:**
```jsx
<form>
  <label htmlFor="newsletter-email" className="sr-only">
    Email address for newsletter
  </label>
  <input
    id="newsletter-email"
    type="email"
    placeholder="Enter your email"
    aria-required="true"
  />
  <button type="submit" aria-label="Subscribe to newsletter">
    Subscribe
  </button>
</form>
```

---

## Complete Example

```jsx
export function Footer({ onSubscribe }) {
  return (
    <footer className="bg-secondary text-white pt-xl pb-0">
      <div className="container mx-auto px-4">
        {/* Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-xl mb-xl">
          {/* About Section */}
          <div>
            <h3 className="text-white text-xl mb-lg font-semibold">
              About Us
            </h3>
            <p className="text-white/70 mb-md text-base">
              Your trusted source for computer components and accessories.
              Quality products at competitive prices.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white text-xl mb-lg font-semibold">
              Quick Links
            </h3>
            <ul className="m-0 p-0 list-none space-y-sm">
              <li>
                <a href="/about" className="text-white/70 hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="/contact" className="text-white/70 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-white/70 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-white text-xl mb-lg font-semibold">
              Contact Info
            </h3>
            <div className="space-y-sm">
              <p className="flex items-center text-white/70">
                <i className="fas fa-map-marker-alt mr-sm text-primary"></i>
                123 Main Street, City
              </p>
              <p className="flex items-center text-white/70">
                <i className="fas fa-phone mr-sm text-primary"></i>
                +1 234 567 8900
              </p>
              <p className="flex items-center text-white/70">
                <i className="fas fa-envelope mr-sm text-primary"></i>
                info@example.com
              </p>
            </div>
          </div>
          
          {/* Newsletter */}
          <div>
            <h3 className="text-white text-xl mb-lg font-semibold">
              Newsletter
            </h3>
            <p className="text-white/70 mb-md text-sm">
              Get special offers and updates
            </p>
            <form className="flex gap-sm" onSubmit={onSubscribe}>
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary rounded-md hover:bg-primary-dark transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Footer Bottom */}
      <div className="bg-black/20 py-md text-center">
        <div className="container mx-auto px-4">
          <p className="mb-0 text-white/50 text-sm">
            &copy; {new Date().getFullYear()} Source Computer. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
```
