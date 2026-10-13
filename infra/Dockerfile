# syntax=docker/dockerfile:1

# Стадия сборки: статический сайт Astro, данные из CMS берутся во время сборки.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Передаются при сборке (docker build --build-arg / Dokploy build args).
# В финальный образ не попадают: финальная стадия их не использует.
ARG BACKEND_API
ARG BACKEND_KEY

RUN npm run build

# Финальная стадия: только статика под nginx.
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
