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

# Tạo thư mục uploads nếu chưa tồn tại
RUN mkdir -p uploads/products

# Sao chép hình ảnh từ thư mục public/image vào uploads/products
RUN if [ -d "public/image/products" ]; then cp -r public/image/products/* uploads/products/; fi
RUN if [ -d "public/image/laptops" ]; then cp -r public/image/laptops/* uploads/products/; fi
RUN if [ -d "public/image/components" ]; then cp -r public/image/components/* uploads/products/; fi
RUN if [ -d "public/image/accessories" ]; then cp -r public/image/accessories/* uploads/products/; fi

# Mở cổng
EXPOSE 3000

# Khởi động ứng dụng
CMD ["node", "app.js"]
