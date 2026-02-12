# Layout Components

React components for the application's layout structure, converted from EJS partials. These components maintain the original semantic HTML structure and ARIA attributes while introducing type-safe props and config-driven navigation.

## Components Overview

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **Header** | Main site navigation | Search, cart, wishlist, user dropdown, category navigation |
| **Footer** | Site footer | Company info, category links, information pages, account links |
| **UserSidebar** | User profile navigation | User info display, profile menu with active state |

---

## Header Component

### Props

```typescript
{
  user?: {
    name: string;
    email: string;
    role: 'admin' | 'user';
  };
  cart?: {
    items: Array<any>;
  };
  searchQuery?: string;
  wishlist?: {
    count: number;
  };
}
```

### Usage Example

```jsx
// Guest User (Not Logged In)
<Header 
  searchQuery="laptop gaming"
  cart={{ items: [{ id: 1 }, { id: 2 }] }}
/>

// Authenticated User
<Header 
  user={{
    name: "Nguyễn Văn A",
    email: "user@example.com",
    role: "user"
  }}
  cart={{ items: [{ id: 1 }] }}
  wishlist={{ count: 5 }}
  searchQuery=""
/>

// Admin User
<Header 
  user={{
    name: "Admin",
    email: "admin@example.com",
    role: "admin"
  }}
  cart={{ items: [] }}
/>
```

### Navigation Configuration

The Header component uses three configuration objects:

- **PRODUCT_CATEGORIES**: Product category definitions with icons
- **MAIN_NAV_ITEMS**: Main navigation menu structure
- **USER_MENU_ITEMS**: User dropdown menu items

These can be extracted to a separate config file if needed for centralized management.

---

## Footer Component

### Props

```typescript
{
  user?: {
    name: string;
    email: string;
  };
}
```

### Usage Example

```jsx
// Guest User
<Footer />

// Authenticated User
<Footer 
  user={{
    name: "Nguyễn Văn A",
    email: "user@example.com"
  }}
/>
```

### Link Configuration

The Footer component uses four configuration objects:

- **CONTACT_INFO**: Company contact information
- **FOOTER_CATEGORIES**: Product category links
- **INFO_LINKS**: Information and policy page links
- **ACCOUNT_LINKS_AUTHENTICATED**: Links for logged-in users
- **ACCOUNT_LINKS_GUEST**: Links for guest users

The component automatically switches between authenticated and guest account links based on the `user` prop.

---

## UserSidebar Component

### Props

```typescript
{
  user: {
    name: string;
    email: string;
    loyaltyPoints?: number;
  };
  activePage?: 'profile' | 'orders' | 'addresses' | 'loyalty' | 'pre-orders' | 'notifications' | 'password';
}
```

### Usage Example

```jsx
// Profile Page
<UserSidebar 
  user={{
    name: "Nguyễn Văn A",
    email: "user@example.com",
    loyaltyPoints: 1500
  }}
  activePage="profile"
/>

// Orders Page
<UserSidebar 
  user={{
    name: "Nguyễn Văn A",
    email: "user@example.com",
    loyaltyPoints: 0
  }}
  activePage="orders"
/>

// User Without Loyalty Points
<UserSidebar 
  user={{
    name: "New User",
    email: "newuser@example.com"
  }}
  activePage="profile"
/>
```

### Navigation Configuration

The UserSidebar component uses:

- **PROFILE_NAV_ITEMS**: Profile navigation menu with icons and labels

### Styling Note

⚠️ **Important**: This component does NOT include CSS styling. The original EJS template had inline `<style>` tags that should be maintained in a separate CSS file. The component relies on the following CSS classes:

- `.profile-sidebar`
- `.user-info`
- `.user-avatar`
- `.loyalty-points`
- `.profile-nav`
- `.profile-nav li.active`

---

## Integration Patterns

### Server-Side Rendering (SSR)

These components are designed to work with server-side rendering, where props are passed from Express route handlers:

```javascript
// Example Express route
app.get('/user/profile', isAuthenticated, async (req, res) => {
  const cart = await getCartForUser(req.user.id);
  const wishlist = await getWishlistForUser(req.user.id);
  
  // In a React SSR setup, pass these as props
  renderReactComponent('UserProfile', {
    header: {
      user: req.user,
      cart,
      wishlist
    },
    sidebar: {
      user: req.user,
      activePage: 'profile'
    }
  });
});
```

### Client-Side Integration

For client-side React applications, these components can receive data from:

- **Context API**: For shared user/cart state
- **Redux/Zustand**: For global application state
- **React Query/SWR**: For server state synchronization

```jsx
// Example with Context
const { user, cart, wishlist } = useAuth();

return (
  <>
    <Header 
      user={user}
      cart={cart}
      wishlist={wishlist}
    />
    {/* Page content */}
    <Footer user={user} />
  </>
);
```

### Static Site Generation (SSG)

For static pages without user context:

```jsx
// Public landing page
<Header />
<Footer />
```

---

## Data Flow Recommendations

### Prop Contracts Only

These components define **prop contracts only** and do not contain:
- ❌ State management (`useState`, `useReducer`)
- ❌ Side effects (`useEffect`)
- ❌ API calls or data fetching
- ❌ Business logic

### Future Enhancements

When integrating these components into your application, consider:

1. **Event Handlers**: Add `onClick`, `onSubmit` handlers for interactive behavior
2. **State Synchronization**: Connect to global state for cart/wishlist updates
3. **Search Autocomplete**: Implement search suggestions logic
4. **Responsive Behavior**: Add mobile menu toggle functionality
5. **Accessibility**: Enhance keyboard navigation and screen reader support

---

## File Structure

```
src/components/layout/
├── Header.jsx           # Main navigation header
├── Footer.jsx           # Site footer
├── UserSidebar.jsx      # User profile sidebar
└── README.md            # This documentation file
```

---

## Migration Notes

These components were converted from EJS templates located at:
- `views/partials/header.ejs` → `Header.jsx`
- `views/partials/footer.ejs` → `Footer.jsx`
- `views/partials/user-sidebar.ejs` → `UserSidebar.jsx`

**Preserved**:
- ✅ Semantic HTML structure
- ✅ CSS class names
- ✅ ARIA attributes (where present)
- ✅ Conditional rendering logic
- ✅ Navigation structure

**Changed**:
- 🔄 EJS template syntax → JSX
- 🔄 EJS variables → Typed props
- 🔄 Hardcoded links → Configuration objects
- 🔄 Inline conditionals → React conditional rendering

**Not Included**:
- ❌ CSS styling (maintain separately)
- ❌ JavaScript behavior (add as needed)
- ❌ Form validation logic
