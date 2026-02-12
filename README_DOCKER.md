# 🐳 Docker Setup Guide - Source Computer

## Tổng Quan

Project hỗ trợ **2 chế độ Docker**:
1. **Production Mode** (`docker-compose.yml`) - 3 app instances + load balancer + shared volumes
2. **Development Mode** (`docker-compose.dev.yml`) - 1 app instance + hot-reload + bind mounts

## 🚀 Quick Start

### Lần Đầu Chạy (Initialize)

```bash
# 1. Tạo thư mục uploads và copy sample images (nếu có)
node init-uploads.js

# 2. Chạy Production mode
docker compose up -d

# HOẶC Development mode (khuyến nghị cho dev)
docker compose -f docker-compose.dev.yml up -d
```

### Truy Cập

- **Website**: http://localhost
- **Direct Backend** (dev mode): http://localhost:3000
- **MongoDB**: mongodb://localhost:27017/sourcecomputer

## 📁 Cấu Trúc Volumes

### Production Mode
- `mongo-data`: Database MongoDB
- `uploads-data`: **Shared volume** cho product images giữa 3 app instances và nginx

### Development Mode
- `mongo-data-dev`: Database MongoDB
- `./uploads`: Bind mount trực tiếp từ host (hot-reload)

## 🔧 Chi Tiết Setup

### 1. Production Mode (Scale-ready)

**Đặc điểm:**
- 3 app instances (app1, app2, app3) + Nginx load balancer
- Multi-stage build → image tối ưu
- Shared `uploads-data` volume → tất cả instances đọc/ghi cùng folder
- Health checks
- Production-ready

**Chạy:**
```bash
# Build và start tất cả services
docker compose up -d --build

# Xem logs
docker compose logs -f

# Stop
docker compose down

# Stop và XÓA volumes (cẩn thận - mất data!)
docker compose down -v
```

**Kiểm tra uploads volume:**
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect sourcecomputer_uploads-data

# Copy ảnh từ host vào volume
docker cp ./uploads/products/. $(docker ps -qf "name=app1"):/usr/src/app/uploads/products/
```

### 2. Development Mode (Hot-reload)

**Đặc điểm:**
- 1 app instance với nodemon
- Bind mount toàn bộ source code → thay đổi code = auto-reload
- Direct port 3000 exposed
- Không cần rebuild image khi sửa code

**Chạy:**
```bash
# Start dev mode
docker compose -f docker-compose.dev.yml up -d

# Xem logs realtime
docker compose -f docker-compose.dev.yml logs -f app1

# Stop
docker compose -f docker-compose.dev.yml down
```

## 📸 Quản Lý Hình Ảnh Product

### Cách 1: Copy Local Images vào Container/Volume

```bash
# Đối với Development mode (bind mount)
# Chỉ cần copy vào thư mục local
cp /path/to/images/*.jpg ./uploads/products/

# Đối với Production mode (volume)
# Copy vào container đang chạy
docker cp /path/to/images/. $(docker ps -qf "name=app1"):/usr/src/app/uploads/products/
```

### Cách 2: Seed Database với Sample Images

```bash
# Exec vào container
docker exec -it sourcecomputer-app1-1 sh

# Chạy seeders (inside container)
node seeders/admin-seeder.js
node seeders/demo-products-seeder.js
exit
```

### Cách 3: Upload qua Admin Panel

1. Truy cập: http://localhost/admin
2. Login với admin account
3. Upload images qua UI (tự động lưu vào shared volume)

## 🔍 Troubleshooting

### Lỗi: "Cannot find module"
```bash
# Rebuild image hoàn toàn
docker compose build --no-cache
docker compose up -d
```

### Lỗi: "ENOENT: no such file or directory, open './uploads/products/...'"
```bash
# Kiểm tra volume
docker volume inspect sourcecomputer_uploads-data

# Init uploads directory
node init-uploads.js

# Restart containers
docker compose restart
```

### Lỗi: Port 80 or 3000 đã được sử dụng
```bash
# Windows: Kiểm tra port
netstat -ano | findstr :80
netstat -ano | findstr :3000

# Dừng process hoặc đổi port trong docker-compose.yml
# nginx:
#   ports:
#     - "8080:80"  # Đổi từ 80 → 8080
```

### Images không hiển thị trên website

**Kiểm tra:**
```bash
# 1. Xác nhận path trong DB
docker exec -it sourcecomputer-mongo-1 mongosh
use sourcecomputer
db.products.findOne({}, {images: 1})
# Output nên là: images: ["1623456789000.jpg"]

# 2. Kiểm tra file tồn tại trong volume
docker exec -it sourcecomputer-app1-1 ls -la /usr/src/app/uploads/products/

# 3. Kiểm tra nginx có serve được không
curl http://localhost/uploads/products/<filename.jpg>
```

**Nguyên nhân thường gặp:**
- DB lưu path đầy đủ (VD: `/uploads/products/file.jpg`) thay vì chỉ filename
- Permission issues (run `docker exec app1 chown -R node:node /usr/src/app/uploads`)
- Volume chưa được mount đúng

## 🔄 Migrate từ Local sang Docker

### Bước 1: Backup Data
```bash
# Export MongoDB
mongodump --db sourcecomputer --out ./backup

# Copy uploads
cp -r ./uploads ./uploads-backup
```

### Bước 2: Start Docker
```bash
# Development mode (giữ nguyên code)
docker compose -f docker-compose.dev.yml up -d
```

### Bước 3: Import Data vào Docker
```bash
# Copy backup vào container
docker cp ./backup sourcecomputer-mongo-1:/tmp/backup

# Import vào MongoDB trong Docker
docker exec -it sourcecomputer-mongo-1 mongorestore /tmp/backup

# Copy uploads
docker cp ./uploads-backup/products/. $(docker ps -qf "name=app1"):/usr/src/app/uploads/products/
```

## 🌐 Deploy Production (Multi-Device)

### Trên Server/Device Mới

```bash
# 1. Clone repo
git clone <your-repo-url>
cd SourceComputer

# 2. Set environment variables
cp .env.example .env
# Edit .env với production values

# 3. Build và start
docker compose up -d --build

# 4. Seed initial data
docker exec sourcecomputer-app1-1 npm run seed

# 5. Verify
curl http://localhost
```

### Sync Images Across Devices

**Option A: Shared Network Volume (NFS, etc.)**
```yaml
# docker-compose.yml
volumes:
  uploads-data:
    driver: local
    driver_opts:
      type: nfs
      o: addr=<nfs-server>,rw
      device: ":/path/to/shared/uploads"
```

**Option B: Cloud Storage (S3, Azure Blob)**
- Sửa `middleware/upload.js` để dùng multer-s3
- Lưu URLs thay vì filenames

**Option C: Manual Sync**
```bash
# Từ device có data
docker cp $(docker ps -qf "name=app1"):/usr/src/app/uploads/products ./uploads-export

# Sang device mới
docker cp ./uploads-export/. $(docker ps -qf "name=app1"):/usr/src/app/uploads/products/
```

## 📦 Dockerfile Details

### Multi-stage Build
- **Stage 1 (builder)**: Cài tất cả deps + build frontend
- **Stage 2 (production)**: Chỉ copy production deps + compiled code → image nhẹ hơn

### .dockerignore
Đảm bảo file này bỏ qua:
```
node_modules
npm-debug.log
.env
.git
*.md
uploads/*     # Bỏ qua khi build, sẽ dùng volume
```

## 🔑 Best Practices

1. **Development**: Dùng `docker-compose.dev.yml` để code nhanh
2. **Production**: Dùng `docker-compose.yml` với 3 instances
3. **Volume Backup**: Định kỳ backup `uploads-data` volume
4. **Security**: 
   - Đổi `SESSION_SECRET` trong production
   - Không commit `.env` vào git
   - Rotate credentials nếu đã leak
5. **Monitoring**: Xem logs thường xuyên với `docker compose logs -f`

## 📞 Support

Gặp vấn đề? Kiểm tra logs:
```bash
# All services
docker compose logs

# Specific service
docker compose logs app1

# Follow logs
docker compose logs -f --tail=100
```

---
**Tạo bởi**: Docker setup script  
**Cập nhật**: 2026-02-12
