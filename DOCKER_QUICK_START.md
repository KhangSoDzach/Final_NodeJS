# 🚀 Docker Quick Reference

## Chạy Nhanh

```bash
# Lần đầu
npm run docker:init        # Tạo uploads directory
npm run docker:dev         # Start development mode

# Xem logs
npm run docker:dev:logs

# Dừng
npm run docker:dev:down
```

## Chế Độ Khác Nhau

| Chế độ | Command | Đặc điểm |
|--------|---------|----------|
| **Development** | `npm run docker:dev` | Hot-reload, 1 instance, port 3000 exposed |
| **Production** | `npm run docker:prod` | 3 instances + load balancer, optimized |
| **Local** | `npm run dev` | Không dùng Docker, chạy trực tiếp |

## URL Truy Cập

- **Website**: http://localhost
- **Backend Direct** (dev): http://localhost:3000  
- **MongoDB**: mongodb://localhost:27017

## Commands Thường Dùng

```bash
# Init uploads folder
npm run docker:init

# Development
npm run docker:dev          # Start
npm run docker:dev:logs     # View logs
npm run docker:dev:down     # Stop

# Production
npm run docker:prod         # Build & start
npm run docker:prod:logs    # View logs
npm run docker:prod:down    # Stop

# Clean up (XÓA TẤT CẢ volumes!)
npm run docker:clean
```

## Seed Database

```bash
# Trong container
docker exec -it sourcecomputer-app1-1 npm run seed

# Hoặc exec vào container
docker exec -it sourcecomputer-app1-1 sh
npm run seed
exit
```

## Copy Images

```bash
# Vào volume (production)
docker cp ./my-images/. $(docker ps -qf "name=app1"):/usr/src/app/uploads/products/

# Bind mount (development) - chỉ cần copy vào folder
cp ./my-images/* ./uploads/products/
```

## Troubleshooting

### Port conflict
```bash
# Kiểm tra port đang dùng
netstat -ano | findstr :80
netstat -ano | findstr :3000

# Đổi port trong docker-compose
# nginx: ports: ["8080:80"]
```

### Images không hiển thị
```bash
# Kiểm tra trong container
docker exec sourcecomputer-app1-1 ls -la /usr/src/app/uploads/products/

# Test nginx
curl http://localhost/uploads/products/test.jpg
```

### Rebuild từ đầu
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

## Files Quan Trọng

- `Dockerfile` - Production multi-stage build
- `Dockerfile.dev` - Development với nodemon
- `docker-compose.yml` - Production (3 instances)
- `docker-compose.dev.yml` - Development (1 instance)
- `init-uploads.js` - Script tạo uploads folder
- `README_DOCKER.md` - Hướng dẫn đầy đủ

## Tips

✅ Development: Dùng `docker:dev` - code thay đổi tự reload  
✅ Production: Dùng `docker:prod` - scale sẵn 3 instances  
✅ Images: Luôn check `uploads/products/` có file không  
✅ Logs: `npm run docker:dev:logs` để debug  

📖 Chi tiết: Xem [README_DOCKER.md](README_DOCKER.md)
