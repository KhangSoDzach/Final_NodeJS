FROM node:20.12-alpine3.19

WORKDIR /usr/src/app

# Cài đặt dependencies
COPY package.json .
RUN npm install 

# Sao chép mã nguồn
COPY . .

# Mở cổng
EXPOSE 3000

# Khởi động ứng dụng
CMD ["node", "app.js"]