# React Migration Roadmap - EJS to React SPA

##  Tổng quan Migration

**Mục tiêu:** Chuyển đổi từ Express + EJS (Server-side Rendering) sang Express API + React SPA (Client-side Rendering)

**Thời gian ước tính:** 3-4 tuần (full-time)  
**Rủi ro:** Medium-High (breaking changes toàn bộ frontend)  
**Chiến lược:** Incremental migration với API versioning

---

##  Phase 0: Preparation & Assessment (2-3 ngày)

###  Checklist

- [ ] **Backup toàn bộ code hiện tại**
  ```powershell
  git checkout -b backup-before-react-migration
  git push origin backup-before-react-migration
  ```

- [ ] **Chạy và document tất cả test cases**
  ```powershell
  npm test
  npm run test:coverage
  ```
  - Export test results
  - Screenshot các pages quan trọng
  - Document các flows user hiện tại

- [ ] **Audit dependencies**
  ```powershell
  npm audit
  npm outdated
  ```
  - Update critical security patches
  - Document versions hiện tại

- [ ] **Tạo branch migration**
  ```powershell
  git checkout -b feature/react-migration
  ```

- [ ] **Setup skills cho migration**
  - Activate skills: `react-modernization`, `react-best-practices`, `api-design-principles`, `api-documentation-generator`
  - Review `.agent/skills.index.md`

- [ ] **Document API requirements**
  - List tất cả 51+ routes đang dùng `res.render()`
  - Xác định endpoints cần thiết
  - Design API schema (OpenAPI)

---

##  Phase 1: Setup React Infrastructure (2-3 ngày)

### 1.1 Install React Dependencies

```powershell
npm install react react-dom react-router-dom axios
npm install zustand # state management (lightweight)
npm install react-hook-form # form handling
npm install react-query # data fetching/caching
```

**Dev dependencies:**
```powershell
npm install -D vite @vitejs/plugin-react
npm install -D @types/react @types/react-dom # if using TypeScript
npm install -D eslint-plugin-react eslint-plugin-react-hooks
```

###  Checklist

- [ ] Dependencies installed
- [ ] `package.json` updated with React scripts

### 1.2 Create React App Structure

```
Final_NodeJS/
 client/                    # NEW React app
    public/
       index.html
       favicon.ico
    src/
       main.jsx          # Entry point
       App.jsx           # Root component
       api/              # API client
          client.js
       components/       # Reusable components
          common/
          layout/
          product/
       pages/            # Page components
          Home.jsx
          Products.jsx
          ProductDetail.jsx
          Cart.jsx
          Checkout.jsx
          User/
          Admin/
       hooks/            # Custom hooks
       store/            # Zustand stores
       utils/
       styles/
       constants/
    vite.config.js
    package.json
 server/                    # RENAMED from root
    controllers/
    models/
    routes/
    app.js
```

###  Checklist

- [ ] Create `client/` folder
- [ ] Create `client/public/index.html`
- [ ] Create `client/src/main.jsx`
- [ ] Create `client/src/App.jsx`
- [ ] Create `client/vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

- [ ] Update `package.json` scripts:
```json
{
  "scripts": {
    "dev:server": "nodemon server/app.js",
    "dev:client": "cd client && vite",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "build:client": "cd client && vite build",
    "start": "node server/app.js"
  }
}
```

- [ ] Install `concurrently` for parallel dev servers:
```powershell
npm install -D concurrently
```

### 1.3 Setup API Client

Create `client/src/api/client.js`:
```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true, // for cookies/session
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor (add auth token if using JWT)
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor (handle errors globally)
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

###  Checklist

- [ ] API client created
- [ ] Axios configured with interceptors
- [ ] Error handling setup

### 1.4 Setup Routing

Create `client/src/App.jsx`:
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
// ... other imports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          {/* User routes */}
          <Route path="user/*" element={<UserRoutes />} />
          {/* Admin routes */}
          <Route path="admin/*" element={<AdminRoutes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

###  Checklist

- [ ] React Router setup
- [ ] Basic routes defined
- [ ] Layout component created

---

##  Phase 2: Backend API Conversion (5-7 ngày)

### 2.1 Create API Routes Structure

```
server/routes/
 api/                       # NEW API routes
    index.js              # API router aggregator
    products.js           # GET /api/products
    cart.js               # POST /api/cart
    orders.js             # GET/POST /api/orders
    auth.js               # POST /api/auth/login
    user.js               # GET/PUT /api/user
    admin.js              # Admin APIs
 web/                       # OLD (keep for backward compatibility)
     index.js
```

### 2.2 Convert Controllers to API (Priority Order)

#### **Priority 1: Authentication & User (Day 1-2)**

**Files to modify:**
- `server/controllers/auth.js`
- `server/controllers/user.js`
- `server/routes/api/auth.js` (NEW)

**Example conversion:**

**Before (EJS):**
```javascript
// controllers/auth.js
exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Login' });
};
```

**After (API):**
```javascript
// controllers/auth.js
exports.getLoginPage = (req, res) => {
  // For backward compatibility or remove entirely
  res.render('auth/login', { title: 'Login' });
};

// NEW API method
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate JWT or set session
    const token = generateToken(user);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
```

###  Checklist - Auth & User APIs

- [ ] `POST /api/auth/login`
- [ ] `POST /api/auth/register`
- [ ] `POST /api/auth/logout`
- [ ] `GET /api/auth/me` (get current user)
- [ ] `GET /api/user/profile`
- [ ] `PUT /api/user/profile`
- [ ] `PUT /api/user/password`
- [ ] `GET /api/user/addresses`
- [ ] `POST /api/user/addresses`
- [ ] `PUT /api/user/addresses/:id`
- [ ] `DELETE /api/user/addresses/:id`

#### **Priority 2: Products (Day 3-4)**

**Files to modify:**
- `server/controllers/products.js`
- `server/routes/api/products.js` (NEW)

**Endpoints needed:**

###  Checklist - Products APIs

- [ ] `GET /api/products` (list with filters, pagination)
- [ ] `GET /api/products/:slug` (product detail)
- [ ] `GET /api/products/:slug/reviews` (reviews)
- [ ] `POST /api/products/:slug/reviews` (add review)
- [ ] `GET /api/products/categories` (categories list)
- [ ] `GET /api/products/brands` (brands list)
- [ ] `POST /api/products/:id/questions` (ask question)
- [ ] `GET /api/products/:id/questions` (get questions)

#### **Priority 3: Cart & Checkout (Day 4-5)**

**Files to modify:**
- `server/controllers/cart.js`
- `server/controllers/order.js`
- `server/routes/api/cart.js` (NEW)
- `server/routes/api/orders.js` (NEW)

###  Checklist - Cart & Orders APIs

- [ ] `GET /api/cart` (get cart)
- [ ] `POST /api/cart/items` (add to cart)
- [ ] `PUT /api/cart/items/:id` (update quantity)
- [ ] `DELETE /api/cart/items/:id` (remove from cart)
- [ ] `POST /api/cart/apply-coupon` (apply coupon)
- [ ] `POST /api/orders` (create order)
- [ ] `GET /api/orders` (user orders)
- [ ] `GET /api/orders/:id` (order detail)
- [ ] `GET /api/orders/:id/track` (track order)

#### **Priority 4: Wishlist & Compare (Day 5-6)**

###  Checklist - Wishlist & Compare APIs

- [ ] `GET /api/wishlist`
- [ ] `POST /api/wishlist`
- [ ] `DELETE /api/wishlist/:productId`
- [ ] `GET /api/compare`
- [ ] `POST /api/compare`
- [ ] `DELETE /api/compare/:productId`

#### **Priority 5: Admin APIs (Day 6-7)**

###  Checklist - Admin APIs

- [ ] `GET /api/admin/dashboard` (stats)
- [ ] `GET /api/admin/products`
- [ ] `POST /api/admin/products`
- [ ] `PUT /api/admin/products/:id`
- [ ] `DELETE /api/admin/products/:id`
- [ ] `GET /api/admin/orders`
- [ ] `PUT /api/admin/orders/:id/status`
- [ ] `GET /api/admin/users`
- [ ] `PUT /api/admin/users/:id/ban`

### 2.3 API Response Standards

**Create `server/utils/apiResponse.js`:**
```javascript
class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }
  
  static error(res, message = 'Error', statusCode = 400, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }
  
  static paginated(res, data, pagination) {
    return res.json({
      success: true,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit)
      }
    });
  }
}

module.exports = ApiResponse;
```

###  Checklist - API Standards

- [ ] Response utility created
- [ ] All APIs follow standard format
- [ ] Error handling middleware updated
- [ ] Validation middleware applied

### 2.4 Update app.js for API routes

```javascript
// server/app.js

// API routes (NEW)
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/products', require('./routes/api/products'));
app.use('/api/cart', require('./routes/api/cart'));
app.use('/api/orders', require('./routes/api/orders'));
app.use('/api/user', require('./routes/api/user'));
app.use('/api/wishlist', require('./routes/api/wishlist'));
app.use('/api/compare', require('./routes/api/compare'));
app.use('/api/admin', require('./routes/api/admin'));

// OLD web routes (keep for backward compatibility or remove)
// app.use('/', require('./routes/web/index'));

// Serve React app
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

###  Checklist - Server Config

- [ ] API routes mounted
- [ ] Static serving configured for React build
- [ ] Catch-all route for React Router
- [ ] CORS configured if needed

---

##  Phase 3: Build React Pages (7-10 ngày)

### 3.1 Core Pages (Day 1-3)

#### Home Page
```jsx
// client/src/pages/Home.jsx
import { useQuery } from 'react-query';
import apiClient from '../api/client';

function Home() {
  const { data: newProducts } = useQuery('newProducts', () =>
    apiClient.get('/products?sort=createdAt-desc&limit=8')
  );
  
  const { data: bestSellers } = useQuery('bestSellers', () =>
    apiClient.get('/products?sort=sold-desc&limit=8')
  );
  
  return (
    <div>
      <section className="hero">
        {/* Hero section */}
      </section>
      
      <section className="new-products">
        <h2>Sản phẩm mới</h2>
        <ProductGrid products={newProducts?.data} />
      </section>
      
      <section className="best-sellers">
        <h2>Bán chạy nhất</h2>
        <ProductGrid products={bestSellers?.data} />
      </section>
    </div>
  );
}
```

###  Checklist - Core Pages

- [ ] Home page
- [ ] Products listing page (with filters, sort, pagination)
- [ ] Product detail page
- [ ] Cart page
- [ ] Checkout page
- [ ] Order success page
- [ ] Order tracking page

### 3.2 User Pages (Day 4-5)

###  Checklist - User Pages

- [ ] Login page
- [ ] Register page
- [ ] User profile
- [ ] Order history
- [ ] Order detail
- [ ] Wishlist
- [ ] Change password
- [ ] Addresses management

### 3.3 Admin Pages (Day 6-8)

###  Checklist - Admin Pages

- [ ] Admin dashboard
- [ ] Products management (list, add, edit, delete)
- [ ] Orders management
- [ ] Users management
- [ ] Questions/reviews management

### 3.4 Static Pages (Day 9)

###  Checklist - Static Pages

- [ ] About page
- [ ] Contact page
- [ ] Shipping policy
- [ ] Return policy
- [ ] Warranty policy
- [ ] Privacy policy

### 3.5 Components Library (Throughout Phase 3)

###  Checklist - Reusable Components

- [ ] Button
- [ ] Input, Select, Checkbox
- [ ] Modal
- [ ] Alert/Toast
- [ ] Loading spinner
- [ ] ProductCard
- [ ] ProductGrid
- [ ] Pagination
- [ ] SearchBar
- [ ] FilterSidebar
- [ ] Header (migrated from `src/components/layout/Header.jsx`)
- [ ] Footer (migrated from `src/components/layout/Footer.jsx`)
- [ ] UserSidebar (migrated)

---

##  Phase 4: Integration & State Management (2-3 ngày)

### 4.1 Setup Zustand Stores

**Create `client/src/store/authStore.js`:**
```javascript
import create from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (user) => set({ user })
    }),
    {
      name: 'auth-storage'
    }
  )
);
```

**Create `client/src/store/cartStore.js`:**
```javascript
import create from 'zustand';

export const useCartStore = create((set) => ({
  items: [],
  total: 0,
  
  setCart: (cart) => set({ items: cart.items, total: cart.total }),
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
    total: state.total + item.price * item.quantity
  })),
  removeItem: (productId) => set((state) => ({
    items: state.items.filter(item => item.productId !== productId),
    total: calculateTotal(state.items.filter(item => item.productId !== productId))
  })),
  updateQuantity: (productId, quantity) => set((state) => ({
    items: state.items.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    ),
    total: calculateTotal(state.items)
  })),
  clearCart: () => set({ items: [], total: 0 })
}));
```

###  Checklist - State Management

- [ ] Auth store
- [ ] Cart store
- [ ] Wishlist store
- [ ] Compare store
- [ ] UI store (modals, toasts)

### 4.2 Setup React Query

**Create `client/src/api/queries.js`:**
```javascript
import { useQuery, useMutation, useQueryClient } from 'react-query';
import apiClient from './client';

// Products
export const useProducts = (filters) => {
  return useQuery(['products', filters], () =>
    apiClient.get('/products', { params: filters })
  );
};

export const useProduct = (slug) => {
  return useQuery(['product', slug], () =>
    apiClient.get(`/products/${slug}`)
  );
};

// Cart
export const useCart = () => {
  return useQuery('cart', () => apiClient.get('/cart'));
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation(
    (data) => apiClient.post('/cart/items', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cart');
      }
    }
  );
};

// ... more queries
```

###  Checklist - Data Fetching

- [ ] React Query configured
- [ ] Custom hooks for all APIs
- [ ] Cache invalidation setup
- [ ] Optimistic updates for cart

### 4.3 Form Handling with React Hook Form

**Example checkout form:**
```jsx
import { useForm } from 'react-hook-form';

function CheckoutForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = async (data) => {
    await apiClient.post('/orders', data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('name', { required: 'Name is required' })}
        placeholder="Full name"
      />
      {errors.name && <span>{errors.name.message}</span>}
      
      {/* More fields */}
      
      <button type="submit">Place Order</button>
    </form>
  );
}
```

###  Checklist - Forms

- [ ] React Hook Form setup
- [ ] Validation rules
- [ ] Error handling
- [ ] Form components (Login, Register, Checkout, Profile, etc.)

---

##  Phase 5: Testing & QA (3-4 ngày)

### 5.1 Backend API Tests

**Update existing tests to test API endpoints:**
```javascript
// tests/api/products.test.js
const request = require('supertest');
const app = require('../../server/app');

describe('GET /api/products', () => {
  it('should return products list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
  
  it('should filter by category', async () => {
    const res = await request(app).get('/api/products?category=laptop');
    expect(res.status).toBe(200);
    expect(res.body.data.every(p => p.category === 'laptop')).toBe(true);
  });
});
```

###  Checklist - API Tests

- [ ] All API endpoints have tests
- [ ] Test happy paths
- [ ] Test error cases (400, 401, 404, 500)
- [ ] Test pagination
- [ ] Test filters & sorting
- [ ] Test authentication middleware
- [ ] `npm test` passes 100%

### 5.2 Frontend Tests (Optional but recommended)

**Install testing libraries:**
```powershell
cd client
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

**Example component test:**
```jsx
// client/src/components/__tests__/ProductCard.test.jsx
import { render, screen } from '@testing-library/react';
import ProductCard from '../ProductCard';

describe('ProductCard', () => {
  it('renders product info', () => {
    const product = {
      name: 'Laptop Dell XPS 13',
      price: 25000000,
      image: '/images/laptop.jpg'
    };
    
    render(<ProductCard product={product} />);
    expect(screen.getByText('Laptop Dell XPS 13')).toBeInTheDocument();
  });
});
```

###  Checklist - Frontend Tests

- [ ] Key components tested
- [ ] User flows tested (add to cart, checkout)
- [ ] Form validation tested

### 5.3 Manual Testing Checklist

###  User Flows

- [ ] **Guest user:**
  - [ ] Browse products
  - [ ] Search products
  - [ ] Filter & sort
  - [ ] View product detail
  - [ ] Add to cart (guest cart)
  - [ ] View cart
  - [ ] Register
  
- [ ] **Authenticated user:**
  - [ ] Login
  - [ ] Browse products
  - [ ] Add to cart (persisted cart)
  - [ ] Apply coupon
  - [ ] Checkout
  - [ ] Complete order
  - [ ] View order history
  - [ ] View order detail
  - [ ] Track order
  - [ ] Add to wishlist
  - [ ] Compare products
  - [ ] Update profile
  - [ ] Change password
  - [ ] Manage addresses
  - [ ] Logout
  
- [ ] **Admin:**
  - [ ] Login as admin
  - [ ] View dashboard
  - [ ] Add product
  - [ ] Edit product
  - [ ] Delete product
  - [ ] View orders
  - [ ] Update order status
  - [ ] View users
  - [ ] Ban/unban users

###  Cross-browser Testing

- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari (if available)

###  Responsive Testing

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667, 414x896)

---

##  Phase 6: Deployment (2-3 ngày)

### 6.1 Build React App

```powershell
cd client
npm run build
```

This creates `client/dist/` folder with optimized production build.

###  Checklist - Build

- [ ] Build succeeds without errors
- [ ] Assets optimized (images, JS, CSS)
- [ ] Environment variables configured
- [ ] Build size acceptable (<2MB for main bundle)

### 6.2 Update Docker Configuration

**Update `Dockerfile`:**
```dockerfile
# Stage 1: Build React app
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Node.js server
FROM node:18-alpine
WORKDIR /app

# Copy server files
COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ ./
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 5000
CMD ["node", "app.js"]
```

**Update `docker-compose.yml`:**
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app
    networks:
      - app-network

  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=mongodb://mongo:27017/sourcecomputer
      - SESSION_SECRET=${SESSION_SECRET}
    volumes:
      - ./uploads:/app/uploads
    networks:
      - app-network
    depends_on:
      - mongo

  mongo:
    image: mongo:6.0
    volumes:
      - mongo-data:/data/db
    networks:
      - app-network

volumes:
  mongo-data:

networks:
  app-network:
```

**Update `nginx.conf` (if using load balancing):**
```nginx
upstream backend {
    server app:5000;
}

server {
    listen 80;
    
    # Serve React static files
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API routes
    location /api {
        proxy_pass http://backend;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # WebSocket
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

###  Checklist - Docker

- [ ] Dockerfile updated
- [ ] docker-compose.yml updated
- [ ] Multi-stage build working
- [ ] nginx config updated
- [ ] Build and test locally:
  ```powershell
  docker-compose build
  docker-compose up
  ```
- [ ] Access http://localhost and verify app works

### 6.3 Environment Variables

**Create `.env.production`:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongo:27017/sourcecomputer
SESSION_SECRET=your-production-secret-here
JWT_SECRET=your-jwt-secret-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

###  Checklist - Environment

- [ ] All env vars documented
- [ ] Production secrets set
- [ ] `.env.production` not committed to git
- [ ] Environment variables validated on startup

### 6.4 Pre-deployment Checklist

###  Final Checks

- [ ] All tests pass (`npm test` in both server and client)
- [ ] Build succeeds (`npm run build:client`)
- [ ] Docker build succeeds
- [ ] Database migrations run
- [ ] Seeders run (if needed)
- [ ] SSL certificate configured (if using HTTPS)
- [ ] Backup database
- [ ] Document rollback procedure
- [ ] Prepare monitoring/logging
- [ ] Notify team of deployment

### 6.5 Deployment Steps

1. **Backup current production:**
   ```powershell
   # Backup database
   docker exec mongo mongodump --out /backup
   
   # Tag current version
   git tag v1.0-ejs
   git push origin v1.0-ejs
   ```

2. **Deploy new version:**
   ```powershell
   # Pull latest code
   git pull origin feature/react-migration
   
   # Build and restart containers
   docker-compose down
   docker-compose build
   docker-compose up -d
   
   # Check logs
   docker-compose logs -f app
   ```

3. **Verify deployment:**
   - [ ] App accessible
   - [ ] Login works
   - [ ] Products load
   - [ ] Cart works
   - [ ] Checkout works
   - [ ] Admin panel works

4. **Monitor for issues:**
   - [ ] Check error logs
   - [ ] Monitor response times
   - [ ] Check database connections

### 6.6 Rollback Plan

If issues occur:

```powershell
# Stop current version
docker-compose down

# Checkout previous version
git checkout v1.0-ejs

# Restore database if needed
docker exec mongo mongorestore /backup

# Restart
docker-compose up -d
```

---

##  Migration Progress Tracking

### Overall Progress

| Phase | Tasks | Status | Completion |
|-------|-------|--------|------------|
| Phase 0: Preparation | 6 |  Pending | 0% |
| Phase 1: React Setup | 15 |  Pending | 0% |
| Phase 2: API Conversion | 51 |  Pending | 0% |
| Phase 3: React Pages | 25 |  Pending | 0% |
| Phase 4: Integration | 12 |  Pending | 0% |
| Phase 5: Testing | 30 |  Pending | 0% |
| Phase 6: Deployment | 20 |  Pending | 0% |

**Total:** 0/159 tasks (0%)

---

##  Success Criteria

Migration is considered successful when:

- [ ] All 51+ routes converted to API endpoints
- [ ] All pages rebuilt in React
- [ ] 100% test coverage maintained
- [ ] Zero production errors for 7 days
- [ ] Performance metrics acceptable:
  - [ ] Initial load < 3s
  - [ ] API response time < 500ms
  - [ ] SEO score > 80
- [ ] User feedback positive
- [ ] No data loss
- [ ] Rollback tested and documented

---

##  Risk Mitigation

### High Risk Areas

1. **Authentication flow change**
   - Risk: Users logged out, sessions broken
   - Mitigation: Keep session-based auth OR migrate gradually

2. **SEO impact**
   - Risk: Search rankings drop (SPA with client-side rendering)
   - Mitigation: Implement SSR with Next.js OR pre-render with react-snap

3. **Cart data migration**
   - Risk: Guest carts lost
   - Mitigation: Migrate localStorage cart on first visit

4. **Payment integration**
   - Risk: Payment failures during migration
   - Mitigation: Test thoroughly in staging, keep old flow as backup

### Medium Risk Areas

- Performance degradation (bundle size)
- Browser compatibility issues
- Mobile responsiveness issues
- Third-party integrations (Google OAuth, Email)

---

##  Support & Resources

### Documentation

- [ ] API documentation (OpenAPI/Swagger)
- [ ] React components documentation (Storybook)
- [ ] Deployment guide
- [ ] Troubleshooting guide

### Skills to use during migration

From `.agent/skills.manifest.json`:
- `react-modernization`  migration strategies
- `react-best-practices`  React patterns
- `api-design-principles`  REST API design
- `api-documentation-generator`  OpenAPI specs
- `nodejs-backend-patterns`  API controllers
- `testing-patterns`  test strategies
- `docker-expert`  Docker optimization

### Prompt template for each phase

```
"Strictly follow .agent/skills.manifest.json and only use folders under .agent/active-skills/ unless the user explicitly approves additional skills."
"If a task requires skills outside the manifest, list the missing skills and ask for explicit user approval before proceeding."

Task: [Phase name] - [specific task]
Skills: [list skills from manifest]
Phase: [current phase number]
Context: [current status]
Requirements:
1. [requirement 1]
2. [requirement 2]
Run npm test after changes
Report progress
```

---

##  Timeline Summary

| Week | Focus | Deliverables |
|------|-------|--------------|
| Week 1 | Prep + React Setup + API (Auth/User) | React app running, Auth APIs done |
| Week 2 | API (Products/Cart/Orders) | Core APIs complete, tests passing |
| Week 3 | React Pages (Core + User) | Main pages functional |
| Week 4 | React Pages (Admin) + Testing | All pages done, tests green |
| Week 5 | Integration + Deployment | Production deploy |

**Total: 4-5 weeks full-time** (or 8-10 weeks part-time)

---

##  Next Immediate Actions

1. Review this roadmap
2. Get team/stakeholder approval
3. Create Phase 0 backup branch
4. Run `npm test` and document current state
5. Start Phase 1: Install React dependencies

**Ready to start?** Copy the Phase 0 checklist and begin!

---

**Document Version:** 1.0  
**Created:** 2026-02-04  
**Author:** AI Agent (using react-migration skill)  
**Project:** Final_NodeJS - EJS to React Migration
