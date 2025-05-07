FROM node:20.12-alpine3.19

WORKDIR /usr/src/app

COPY package.json .

RUN npm install express mongoose redis axios multer

COPY . .

EXPOSE 4001

CMD ["node", "product-service.js"]