# ---- Build stage: produce static assets ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_API_URL is baked in at build time — set it in Railway's build vars
# to your backend URL, e.g. https://crm-api.magizhchi.software
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Run stage: tiny static server that respects $PORT ----
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
# SPA fallback so client-side routes (/company, /member) work on refresh
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
