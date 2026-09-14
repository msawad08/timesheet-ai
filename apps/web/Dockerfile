FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/web ./apps/web
RUN npm ci
RUN npm run build --workspace=apps/web

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=apps/web"]
