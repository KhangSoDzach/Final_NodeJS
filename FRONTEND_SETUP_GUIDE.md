# React Frontend Migration - Setup Instructions

## Step 1: Create Directory Structure

Run this command in your terminal (Windows PowerShell or CMD):

```bash
mkdir frontend\src\api frontend\src\components frontend\src\pages frontend\src\hooks frontend\src\context frontend\src\utils frontend\src\styles
```

Or run the Node.js setup script:
```bash
node setup-frontend.js
```

## Step 2: Create Configuration Files

After directories are created, create these files manually or run:

```bash
npm run setup:frontend:files
```

## Files to Create:

### 1. frontend/index.html
### 2. frontend/src/main.jsx  
### 3. frontend/src/App.jsx
### 4. frontend/src/api/client.js
### 5. frontend/src/styles/index.css
### 6. frontend/src/styles/App.css
### 7. frontend/.env.example
### 8. vite.config.js (root)

## Step 3: Update package.json

Add these scripts:
```json
"frontend:dev": "vite",
"frontend:build": "vite build",
"frontend:preview": "vite preview"
```

## Step 4: Configure CORS in app.js

Add CORS configuration before routes.

## Step 5: Install and Run

```bash
npm install
npm run frontend:dev
```

Frontend will run on http://localhost:5173
Backend API on http://localhost:3000
