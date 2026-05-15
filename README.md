# Crypto Backend API

A **Node.js + Express + TypeScript** REST API that returns real-time Ethereum blockchain data for a given wallet address. Built as part of the **Tier 2: Backend Development** challenge.

---

## Requirements Coverage

| Requirement                                           | Status | Implementation                                             |
| ----------------------------------------------------- | ------ | ---------------------------------------------------------- |
| REST API endpoint accepting an Ethereum address       | ✅     | `GET /api/ethereum/account/:address`                       |
| Current gas price                                     | ✅     | Alchemy `eth_gasPrice` JSON-RPC                            |
| Current block number                                  | ✅     | Alchemy `eth_blockNumber` JSON-RPC                         |
| Balance of the given address                          | ✅     | Alchemy `eth_getBalance` JSON-RPC                          |
| Return data in JSON format                            | ✅     | Structured `ApiResponse<T>` wrapper                        |
| Properly structured for future extensibility          | ✅     | Layered architecture (routes → controller → service → lib) |
| **Bonus:** Redis caching for gas price & block number | ✅     | `ioredis` — 15s TTL for gas, 12s TTL for block number      |
| **Bonus:** MongoDB database to store account balances | ✅     | MongoDB Atlas via Prisma ORM                               |

---

## Tech Stack

| Layer          | Technology                                           |
| -------------- | ---------------------------------------------------- |
| Runtime        | Node.js 20                                           |
| Framework      | Express 4                                            |
| Language       | TypeScript 5                                         |
| Blockchain API | Alchemy JSON-RPC (Ethereum Mainnet)                  |
| Database       | MongoDB Atlas via Prisma 5                           |
| Caching        | Redis via ioredis (graceful fallback if unavailable) |
| Validation     | Zod                                                  |
| Deployment     | Vercel (serverless)                                  |

---

## Project Structure

```
be/
├── api/
│   └── index.ts              # Vercel serverless entry point
├── prisma/
│   └── schema.prisma         # MongoDB schema (AccountBalance model)
├── src/
│   ├── app.ts                # Express app setup, middleware, routes
│   ├── server.ts             # Local dev server (app.listen)
│   ├── controllers/
│   │   └── ethereum.controller.ts   # Request/response handlers
│   ├── lib/
│   │   ├── prisma.ts         # PrismaClient singleton (Vercel-safe globalThis pattern)
│   │   └── redis.ts          # ioredis client with lazyConnect + silent fallback
│   ├── middleware/
│   │   ├── errorHandler.ts   # Global Express error handler
│   │   └── validate.ts       # Zod middleware for Ethereum address format
│   ├── routes/
│   │   └── ethereum.routes.ts       # Route definitions
│   ├── services/
│   │   ├── ethereum.service.ts      # Core business logic + Alchemy RPC calls
│   │   └── cache.service.ts         # Redis get/set with TTL constants
│   └── types/
│       └── index.ts          # Shared TypeScript interfaces
├── .env.development          # Local environment variables (git-ignored)
├── .env.example              # Template — copy to .env.development
├── vercel.json               # Vercel routing config
└── tsconfig.json
```

---

## API Endpoints

### Health Check

```
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-05-15T10:00:00.000Z"
}
```

---

### Get Account Data

```
GET /api/ethereum/account/:address
```

Returns the current gas price, block number, and ETH balance for the given Ethereum address. Gas price and block number are cached in Redis to reduce Alchemy API calls.

**Parameters:**

| Name      | Type     | Description                                         |
| --------- | -------- | --------------------------------------------------- |
| `address` | `string` | A valid Ethereum address (`0x` + 40 hex characters) |

**Example Request:**

```
GET /api/ethereum/account/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "balance": "1234.567890",
    "balanceUnit": "ETH",
    "gasPrice": {
      "slow": "12.50",
      "standard": "12.50",
      "fast": "12.50",
      "unit": "Gwei"
    },
    "blockNumber": 21900000,
    "fetchedAt": "2026-05-15T10:00:00.000Z"
  }
}
```

> Each successful call automatically saves a balance snapshot to MongoDB Atlas (non-blocking — does not affect API response time).

---

### Get Balance History

```
GET /api/ethereum/account/:address/history
```

Returns the last 20 balance snapshots stored in MongoDB for the given address.

**Example Request:**

```
GET /api/ethereum/account/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045/history
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "664a1f...",
      "balance": "1234.567890",
      "blockNumber": 21900000,
      "fetchedAt": "2026-05-15T10:00:00.000Z"
    }
  ]
}
```

---

### Error Response Format

All errors follow the same structure:

```json
{
  "success": false,
  "error": "Invalid Ethereum address"
}
```

| HTTP Status | Cause                                        |
| ----------- | -------------------------------------------- |
| `400`       | Invalid Ethereum address format              |
| `404`       | Route not found                              |
| `500`       | Alchemy API failure or internal server error |

---

## Caching Strategy

| Data         | Cache Key      | TTL        | Reason                                     |
| ------------ | -------------- | ---------- | ------------------------------------------ |
| Gas price    | `gas_price`    | 15 seconds | Changes frequently with network congestion |
| Block number | `block_number` | 12 seconds | ~Ethereum average block time               |
| Balance      | _(not cached)_ | —          | Per-address; always fetched fresh          |

Redis is **optional** — if unavailable, the API falls back gracefully with no caching (all requests hit Alchemy directly).

---

## Database Schema

```prisma
model AccountBalance {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  address     String
  balance     String
  blockNumber Int
  fetchedAt   DateTime @default(now())

  @@index([address])
}
```

---

## Environment Variables

Copy `.env.example` to `.env.development` and fill in your values:

```env
PORT=4000
ALCHEMY_URL=https://eth-mainnet.g.alchemy.com/v2/
ALCHEMY_API_KEY=your_alchemy_api_key_here
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/crypto?retryWrites=true&w=majority
REDIS_URL=redis://localhost:6379
```

| Variable          | Required | Description                                        |
| ----------------- | -------- | -------------------------------------------------- |
| `ALCHEMY_URL`     | Yes      | Alchemy base URL                                   |
| `ALCHEMY_API_KEY` | Yes      | Alchemy project API key                            |
| `MONGODB_URI`     | Yes      | MongoDB Atlas connection string                    |
| `REDIS_URL`       | No       | Redis connection URL (caching disabled if omitted) |
| `PORT`            | No       | Server port (default: `4000`)                      |

---

## Local Development

```bash
# Install dependencies
yarn install

# Generate Prisma client
yarn db:generate

# Push schema to MongoDB Atlas
yarn db:push

# Start dev server (loads .env.development)
yarn dev
```

Server starts at `http://localhost:4000`

---

## Deployment (Vercel)

The app is deployed as a **Vercel Serverless Function** via `api/index.ts`.

1. Push to GitHub — Vercel auto-deploys on every push to `main`
2. Set the environment variables in **Vercel Dashboard → Settings → Environment Variables**:
   - `ALCHEMY_URL`
   - `ALCHEMY_API_KEY`
   - `MONGODB_URI`
   - `REDIS_URL` _(optional)_

Prisma client is auto-generated during Vercel's build step via the `postinstall` script.

---

## Live API

**Base URL:** `https://crypto.rctravelrentals.com`

| Endpoint                                     | Description     |
| -------------------------------------------- | --------------- |
| `GET /health`                                | Health check    |
| `GET /api/ethereum/account/:address`         | Account data    |
| `GET /api/ethereum/account/:address/history` | Balance history |
