FROM node:20.12-alpine3.19

WORKDIR /usr/src/app

COPY package.json .

RUN npm install express mongoose bcryptjs jsonwebtoken passport passport-local passport-google-oauth20 redis axios

COPY . .

EXPOSE 4000

CMD ["node", "auth-service.js"]