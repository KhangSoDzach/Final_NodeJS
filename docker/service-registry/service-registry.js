const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4100;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Lưu trữ danh sách các services
let services = {};

// Endpoint để đăng ký service
app.post('/register', (req, res) => {
  const { name, version, host, port, healthCheck } = req.body;
  
  if (!name || !version || !host || !port) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const key = `${name}:${version}`;
  
  if (!services[key]) {
    services[key] = [];
  }
  
  const newService = {
    name,
    version,
    host,
    port,
    healthCheck: healthCheck || `http://${host}:${port}/health`,
    timestamp: Date.now(),
    id: `${name}-${version}-${host}-${port}`
  };
  
  // Kiểm tra xem service đã tồn tại chưa
  const existingIndex = services[key].findIndex(s => s.id === newService.id);
  if (existingIndex >= 0) {
    services[key][existingIndex] = newService;
    console.log(`Updated service: ${name} v${version} at ${host}:${port}`);
  } else {
    services[key].push(newService);
    console.log(`Registered service: ${name} v${version} at ${host}:${port}`);
  }
  
  res.status(200).json(newService);
});

// Endpoint để hủy đăng ký service
app.delete('/register/:id', (req, res) => {
  const { id } = req.params;
  let removed = false;
  
  Object.keys(services).forEach(key => {
    services[key] = services[key].filter(service => {
      if (service.id === id) {
        removed = true;
        console.log(`Unregistered service: ${service.name} v${service.version}`);
        return false;
      }
      return true;
    });
    
    // Xóa key nếu không còn service nào
    if (services[key].length === 0) {
      delete services[key];
    }
  });
  
  if (removed) {
    res.status(200).json({ message: 'Service unregistered successfully' });
  } else {
    res.status(404).json({ error: 'Service not found' });
  }
});

// Endpoint để lấy danh sách tất cả services
app.get('/services', (req, res) => {
  res.status(200).json(services);
});

// Endpoint để lấy danh sách services theo tên
app.get('/services/:name', (req, res) => {
  const { name } = req.params;
  const { version } = req.query;
  
  const key = version ? `${name}:${version}` : null;
  
  if (key && services[key]) {
    res.status(200).json(services[key]);
  } else if (!version) {
    // Tìm tất cả versions của service
    const result = [];
    Object.keys(services).forEach(k => {
      if (k.startsWith(`${name}:`)) {
        result.push(...services[k]);
      }
    });
    
    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: `No services found with name ${name}` });
    }
  } else {
    res.status(404).json({ error: `No services found with name ${name} and version ${version}` });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Định kỳ kiểm tra sức khỏe của các services
const healthCheckInterval = 30000; // 30 seconds
setInterval(() => {
  console.log('Running health checks...');
  // Trong môi trường thực tế, nên gọi health check của từng service
  
  // Xóa các service quá hạn (2 phút không có cập nhật)
  const now = Date.now();
  Object.keys(services).forEach(key => {
    services[key] = services[key].filter(service => {
      const isExpired = now - service.timestamp > 120000;
      if (isExpired) {
        console.log(`Service expired: ${service.name} v${service.version}`);
      }
      return !isExpired;
    });
    
    if (services[key].length === 0) {
      delete services[key];
    }
  });
}, healthCheckInterval);

// Start server
app.listen(PORT, () => {
  console.log(`Service Registry running on port ${PORT}`);
});