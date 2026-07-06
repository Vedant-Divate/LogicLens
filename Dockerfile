# Stage 1: Build the Vite React App
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Vite builds to the /dist folder, copy it to Nginx's public folder
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port 80 for web traffic
EXPOSE 80
# Start Nginx
CMD ["nginx", "-g", "daemon off;"]