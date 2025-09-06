# -------- Build stage --------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# Use the *actual* Angular output folder name from the logs:
ARG PROJECT_NAME=sakai-ng

# Normalize output into /app/out (handles both plain and /browser outputs)
RUN mkdir -p /app/out && \
    if [ -d "/app/dist/${PROJECT_NAME}/browser" ]; then \
      cp -r /app/dist/${PROJECT_NAME}/browser/* /app/out/; \
    else \
      cp -r /app/dist/${PROJECT_NAME}/* /app/out/; \
    fi && \
    ls -la /app/out

# -------- Runtime --------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/out/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
