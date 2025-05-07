FROM node:20.12-alpine3.19

WORKDIR /usr/src/app

COPY package.json .
COPY service-registry.js .

RUN npm install express morgan cors

EXPOSE 4100

CMD ["node", "service-registry.js"]