# -------- Build stage --------
FROM node:22-alpine AS builder
WORKDIR /app

# Install deps (better cache)
COPY package*.json ./
RUN npm ci

# Build
COPY . .
# If you use environments, keep --configuration production
RUN npm run build -- --configuration production

# Normalize output into /app/out (handles both plain and /browser outputs)
# Change PROJECT_NAME below if your dist folder name differs.
ARG PROJECT_NAME=landing-designPro
RUN mkdir -p /app/out && \
    if [ -d "/app/dist/${PROJECT_NAME}/browser" ]; then \
      cp -r /app/dist/${PROJECT_NAME}/browser/* /app/out/; \
    else \
      cp -r /app/dist/${PROJECT_NAME}/* /app/out/; \
    fi && \
    ls -la /app/out

# -------- Runtime stage --------
FROM nginx:alpine
# SPA routing + optional API proxy rules (see nginx.conf below)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ship built app
COPY --from=builder /app/out/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
