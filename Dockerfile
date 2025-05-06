FROM node:20.12-alpine3.19

# Tạo thư mục làm việc
WORKDIR /usr/src/app

# Cài đặt nodemon cho hot reloading
RUN npm install -g nodemon

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Sao chép mã nguồn
COPY . .

# Mở cổng
EXPOSE 3000

# Khởi động ứng dụng với seed data
CMD ["sh", "-c", "npm run seed && nodemon --legacy-watch --ignore node_modules/ --watch . --ext js,ejs,css app.js"]
