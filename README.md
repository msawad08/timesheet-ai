# Timesheet AI

An AI-assisted, multi-tenant timesheet platform designed for intuitive time tracking, intelligent project matching, and granular access control.

---

## Features

- **AI-Powered Natural Language Logging**: Convert everyday work descriptions into structured timesheet entries via streaming LLMs.
- **Semantic Project Matching**: Intelligently map logged activities to the right projects using vector embeddings with `pgvector`.
- **Multi-Tenant Architecture**: Robust data isolation supporting both cloud SaaS and self-hosted deployments.
- **Granular Access Control (ABAC)**: Dynamic, role- and attribute-based permissions powered by CASL and accelerated with Redis caching.
- **High-Performance Streaming Worker**: Dedicated Fastify service handling Server-Sent Events (SSE) for conversational AI interactions.
- **Modern Web Dashboard**: Intuitive timesheet grid and real-time AI assistant built with Next.js and Tailwind CSS.

---

## Repository Structure

The project is structured as an npm workspaces monorepo:

```text
timesheet-ai/
├── apps/
│   ├── api-gateway/       # NestJS REST API: Authentication, tenant & project management
│   ├── ai-worker/         # Fastify service: SSE streaming & conversational AI parsing
│   └── web/               # Next.js web application: Timesheet grid & AI chat interface
├── libs/
│   ├── core-prisma/       # Shared Prisma schema, migrations, and database client
│   ├── security-casl/     # Dynamic CASL ABAC permission rules & ability builder
│   └── shared-dto/        # Shared Data Transfer Objects and validation schemas
└── docker-compose.yml     # Local services: PostgreSQL (pgvector), Redis, and Ollama
```

---

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Lucide Icons
- **Backend API Gateway**: NestJS, Passport JWT, Redis
- **AI Streaming Worker**: Fastify, Server-Sent Events (SSE), Ollama (`qwen2.5:7b`, `nomic-embed-text`)
- **Database & Cache**: PostgreSQL with `pgvector`, Prisma ORM, Redis
- **Security**: CASL (ABAC), bcrypt, JWT

---

## Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v20+)
- [npm](https://www.npmjs.com/) (v10+)
- [Docker & Docker Compose](https://www.docker.com/)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/mohammedsawad-keianza/timesheet-ai.git
cd timesheet-ai
npm install
```

### 2. Start Infrastructure Services

Launch PostgreSQL (with `pgvector`), Redis, and Ollama:

```bash
docker compose up -d
```

> **Note**: The Ollama container automatically pulls the required models (`qwen2.5:7b` and `nomic-embed-text`) on initial startup.

### 3. Configure Environment Variables

Create environment configuration files for the applications as needed:

#### API Gateway (`apps/api-gateway/.env`)
```env
PORT=3001
DATABASE_URL=postgresql://timesheet_admin:SecretPassword123@localhost:5432/timesheet_db?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-key
ENV_MODE=SAAS
```

#### AI Worker (`apps/ai-worker/.env`)
```env
PORT=3002
DATABASE_URL=postgresql://timesheet_admin:SecretPassword123@localhost:5432/timesheet_db?schema=public
GATEWAY_SESSION_URL=http://localhost:3001/api/auth/validate-session
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_EMBED_MODEL=nomic-embed-text
```

#### Web Client (`apps/web/.env.local`)
```env
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AI_WORKER_URL=http://localhost:3002
```

### 🏃 Running the Application Locally

When you are ready to test live against a database and Ollama:

```bash
# 1. Start database, cache, and local AI containers
docker compose up -d

# 2. Run initial database migration and seed default data
npm run db:migrate
npm run db:seed

# 3. Start all services concurrently
npm run dev
```

- **Web Client**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **Fastify AI Worker**: http://localhost:3002

#### Individual Service Commands

You can also run services individually:

```bash
# Start API Gateway (NestJS) -> http://localhost:3001
npm run dev:gateway

# Start AI Worker (Fastify) -> http://localhost:3002
npm run dev:worker

# Start Web Client (Next.js) -> http://localhost:3000
npm run dev:web
```

---

## Scripts Reference

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts all services (Gateway, Worker, Web) concurrently |
| `npm run build` | Builds all shared libraries and applications |
| `npm run db:generate` | Generates the Prisma client from schema |
| `npm run db:migrate` | Runs database migrations |
| `npm run db:seed` | Seeds database with tenant, roles, and initial projects |
| `npm run dev:gateway` | Starts the API Gateway in development/watch mode |
| `npm run dev:worker` | Starts the AI Worker in development/watch mode |
| `npm run dev:web` | Starts the Next.js frontend in development mode |
| `npm run build:gateway` | Builds the API Gateway for production |
| `npm run build:worker` | Builds the AI Worker for production |
| `npm run build:web` | Builds the Next.js frontend for production |
| `npm run test:casl` | Runs unit tests for CASL authorization logic |

---

## License

This project is licensed under the [MIT License](LICENSE).
