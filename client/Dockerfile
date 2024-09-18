# Stage 1: Build the react application for production
# Use the official Node.js image as a base
FROM node:18-alpine3.20 AS builder

RUN npm install -g npm@latest

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json .

# Install dependencies
RUN npm install

# Copy the frontend source code to the container
COPY . .

RUN npm run build

# Stage 2: run nginx reverse-proxy for server and serving client
FROM nginxinc/nginx-unprivileged:latest AS production

COPY --from=builder /app/build /usr/share/nginx/html

# Command to run the application
CMD ["nginx", "-g", "daemon off;"]