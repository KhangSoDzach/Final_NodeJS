FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p public/uploads/products

EXPOSE 3000

CMD ["npm", "start"]
