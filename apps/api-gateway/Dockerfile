FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/api-gateway ./apps/api-gateway
COPY libs/core-prisma ./libs/core-prisma
COPY libs/shared-dto ./libs/shared-dto
COPY libs/security-casl ./libs/security-casl
RUN npm ci
RUN npm run build --workspace=apps/api-gateway

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3001
CMD ["npm", "run", "start", "--workspace=apps/api-gateway"]
