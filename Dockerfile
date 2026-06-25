# ─── Stage 1 : Build React ───────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# ─── Stage 2 : Serve avec Nginx ──────────────────────────────────────────────
FROM nginx:alpine

# Copie le build
COPY --from=builder /app/dist /usr/share/nginx/html

# Config Nginx pour SPA React (React Router compatible)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
