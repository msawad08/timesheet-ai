FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/ai-worker ./apps/ai-worker
COPY libs/core-prisma ./libs/core-prisma
RUN npm ci
RUN npm run build --workspace=apps/ai-worker

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3002
CMD ["npm", "run", "start", "--workspace=apps/ai-worker"]
