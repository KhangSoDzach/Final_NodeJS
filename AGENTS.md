# AGENTS.md

## Tech Stack
- **Backend:** Node.js + Express.js, MongoDB (Mongoose), EJS views, Passport.js auth
- **Frontend:** React SPA (`dist/`) coexisting with EJS routes; Vite build
- **Deploy:** Docker + Nginx load balancer (3 app instances), MongoDB; Render hosting

## Developer Commands

```bash
# Backend
npm start          # production (node app.js)
npm run dev        # development (nodemon)

# Database
npm run seed       # create admin + demo products + coupons

# Tests (Jest + mongodb-memory-server)
npm test           # run all tests
npm run test:watch # watch mode

# Frontend (React SPA)
npm run frontend:dev   # Vite dev server
npm run frontend:build # production build -> dist/

# Docker
npm run docker:dev     # docker-compose.dev.yml (local dev)
npm run docker:dev:logs
npm run docker:dev:down
npm run docker:prod    # docker-compose.yml (production, includes build)
npm run docker:prod:logs
npm run docker:prod:down
```

CI pipeline: `frontend:build` → `test` → deploy on push to `main`.

## Architecture

- **Entry point:** `app.js` (not `index.js`)
- **Routes:** `/routes/` — each file maps to a feature (auth.js, products.js, admin/, etc.)
- **Admin routes:** prefix `/admin`; admin controllers in `controllers/admin/`
- **Auth config:** `config/passport.js`; required middleware: `middleware/auth.js` + `middleware/bannedCheck.js`
- **Email:** `utils/emailService.js`, config in `config/email.js`
- **Uploads:** `middleware/upload.js`; files served via `/uploads` static route
- **SPA fallback:** If `dist/index.html` exists, Express serves it for non-EJS routes; edit `app.js:234-255` to adjust which paths are excluded

## MongoDB / Mongoose Rules
- Always use `.lean()` on read-only queries to save memory
- Check `if (!data)` after queries to avoid "property of null"
- Validate `req.body` / `req.params` via middleware or Schema validation before reaching controllers

## Code Conventions
- Controllers handle business logic; routes only call controllers
- For features affecting >3 files, produce a plan listing files and steps before implementing
- Coverage target for price/coupon calculation logic: 90%+

## Existing Agent Config (respect these)
This repo uses `.agent/` for skill manifest and agent rules. Do not add skills outside the manifest without explicit user approval. See `.cursorrules` for full coding standards.

## Project-Specific Notes
- `app.set('trust proxy', 1)` — required for Nginx/Render reverse proxy
- Session cookie: `sameSite: 'none'` + `secure: true` in production; `lax` locally
- Keep-alive pings every 14 min on Render production to prevent free tier spin-down
- Admin credentials: `admin@sourcecomputer.vn` / `admin123`
- Test DB: `sourcecomputer_test` (MongoDB in-memory)