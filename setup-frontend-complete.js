const fs = require('fs');
const path = require('path');

// Define directory structure
const dirs = [
  'frontend',
  'frontend/src',
  'frontend/src/api',
  'frontend/src/components',
  'frontend/src/pages',
  'frontend/src/hooks',
  'frontend/src/context',
  'frontend/src/utils',
  'frontend/src/styles'
];

// Define files to create
const files = {
  'frontend/index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Source Computer - E-commerce</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,

  'frontend/src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,

  'frontend/src/App.jsx': `import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './styles/App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  )
}

// Temporary Home component
function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-4">
        Source Computer E-commerce
      </h1>
      <p className="text-center text-gray-600">
        React frontend is running! Backend API available at http://localhost:3000
      </p>
    </div>
  )
}

export default App`,

  'frontend/src/api/client.js': `import axios from 'axios'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = \`Bearer \${token}\`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login
          console.error('Unauthorized access')
          break
        case 403:
          // Forbidden
          console.error('Access forbidden')
          break
        case 404:
          // Not found
          console.error('Resource not found')
          break
        case 500:
          // Server error
          console.error('Server error')
          break
        default:
          console.error('API error:', error.response.data)
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server')
    } else {
      // Something else happened
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export default apiClient`,

  'frontend/src/styles/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  width: 100%;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
}`,

  'frontend/src/styles/App.css': `/* App specific styles */`,

  'frontend/.env.example': `# API Configuration
VITE_API_URL=http://localhost:3000

# Application Configuration
VITE_APP_NAME=Source Computer
VITE_APP_VERSION=1.0.0

# Optional: Add other environment variables as needed
# VITE_GOOGLE_ANALYTICS_ID=
# VITE_SENTRY_DSN=`
};

// Create directories
console.log('Creating directories...');
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created: ${dir}`);
  } else {
    console.log(`✓ Exists: ${dir}`);
  }
});

// Create files
console.log('\nCreating files...');
Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(__dirname, filePath);
  fs.writeFileSync(fullPath, content);
  console.log(`✓ Created: ${filePath}`);
});

console.log('\n✓ Frontend structure created successfully!');
console.log('\nNext steps:');
console.log('1. Update package.json with frontend scripts');
console.log('2. Configure CORS in app.js');  
console.log('3. Run: npm run frontend:dev');
