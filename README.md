## Webhook Delivery System

### Features
-Event ingestion
-Multiple endpoints
-Async queue processing
-Background workers
-Delivery tracking
-Retry logic
-HMAC webhook signatures
-Timeout protection
-Dead letter queue
-Manual retry API
-Dashboard APIs


### Architecture
```mermaid
flowchart TD

Client[Client / External App]

API[Express API Server]

DB[(PostgreSQL<br>events<br>endpoints<br>deliveries)]

Queue[(Redis Queue<br>BullMQ)]

Worker[Webhook Worker]

Endpoint1[Webhook Endpoint A]
Endpoint2[Webhook Endpoint B]
Endpoint3[Webhook Endpoint C]

DLQ[(Dead Letter Queue)]

Dashboard[Dashboard API]

Client -->|POST /events| API

API -->|Store Event| DB
API -->|Fetch Endpoints| DB
API -->|Create Deliveries| DB
API -->|Push Jobs| Queue

Queue --> Worker

Worker -->|Fetch Delivery| DB
Worker -->|Fetch Event| DB
Worker -->|Fetch Endpoint| DB

Worker -->|Send Webhook<br>HMAC Signature<br>Timeout| Endpoint1
Worker -->|Send Webhook| Endpoint2
Worker -->|Send Webhook| Endpoint3

Worker -->|Success| DB
Worker -->|Failure Retry| Queue

Worker -->|Retries Exhausted| DLQ

Dashboard -->|GET /events| API
Dashboard -->|GET /deliveries| API
Dashboard -->|POST /deliveries/:id/retry| API
```

### Installation & Setup

1. Clone the repository

```bash
git clone https://github.com/akghosh111/webhook-delivery-system
cd webhook-system
```

2. Install Dependencies
```bash
npm install
```

3. Start Infrastructure (Postgres + Redis)

This project uses Postgres & Redis on Docker locally.
```bash
docker compose up -d
```
This will start:

PostgreSQL (database)
Redis (queue)
RedisInsight (optional UI for Redis)

Verify containers are running:
```bash
docker ps
```
4. Configure Environment Variables

Create a .env file in the project root directory

```
PORT=3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/webhook_db

REDIS_HOST=localhost
REDIS_PORT=6379
```

5. Run Database Migrations

Using Drizzle ORM for this project

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

6. Add a Test Webhook Endpoint

Insert a webhook endpoint into the database.

Example using psql:
```sql
INSERT INTO endpoints (url, secret)
VALUES ('https://webhook.site/your-id', 'secret123');
```

You can generate a test webhook URL using Webhook.site.

7. Start the API Server

```bash
npm run dev
```
8. Start the worker

```bash
npx tsx src/worker.ts
```

