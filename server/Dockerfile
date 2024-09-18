FROM node:18-alpine3.20 AS builder

WORKDIR /app

COPY package.json .

RUN npm install -g npm@latest

RUN npm install

COPY . .

RUN npm run build 
RUN npm run postbuild

CMD ["npm", "run", "start"]

