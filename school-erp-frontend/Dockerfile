# Dockerfile for React Frontend
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .

# Pass VITE_API_BASE_URL explicitly during build
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Final image with Nginx to serve the build
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Replace default config with ours (fixing 404 errors)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
