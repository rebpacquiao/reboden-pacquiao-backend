# CryptoWallet Backend API

A **Node.js + Express + TypeScript** REST API that powers the CryptoWallet Dashboard. It exposes real-time Ethereum blockchain data for any wallet address, persists balance history to MongoDB Atlas, caches frequently-requested data in Redis, and deploys the **CryptoWalletNFT** ERC-721 smart contract to the Sepolia testnet.

Built as part of the **Tier 2: Backend Development** challenge.

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

## Smart Contract (Sepolia Testnet)

The `CryptoWalletNFT` ERC-721 contract is deployed to Sepolia at:

```
0x81E023EE4aB728BA0782A0aD8290258021Ad0A71
```

Built with **OpenZeppelin v5** (ERC721 + ERC721Enumerable + ERC721URIStorage) and compiled with **Hardhat 2.22.0** (Solidity 0.8.28, evmVersion: cancun — required for OZ v5's `mcopy` opcode).

### Deploy the contract yourself

```bash
# Compile
npx hardhat compile

# Deploy to Sepolia (requires DEPLOYER_PRIVATE_KEY + Alchemy Sepolia URL in .env.development)
npx hardhat run scripts/deploy.ts --network sepolia
```

---

## Docker Setup

This service is part of a multi-container stack defined at the **workspace root** (`../docker-compose.yml`). Redis is containerised; MongoDB stays on Atlas (external cloud).

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Workspace root `.env` file filled in (see `.env.example`)

### Run with Docker Compose

```bash
# From the workspace root (d:\onlineTest)
docker compose up --build

# Or detached
docker compose up --build -d
```

### Run only the backend container

```bash
# From d:\onlineTest\be
docker build -t crypto-backend .
docker run -p 4000:4000 --env-file .env.development crypto-backend
```

---

## Key Architectural Decisions

| Decision                                                       | Rationale                                                                                            |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Layered architecture** (routes → controller → service → lib) | Separates concerns; each layer is independently testable                                             |
| **Redis optional / graceful fallback**                         | API stays functional even without Redis; avoids hard dependency on cache availability                |
| **MongoDB Atlas (not containerised)**                          | Atlas manages backups, scaling, and connectivity; no ops overhead for a dev/demo project             |
| **Prisma over raw Mongoose**                                   | Type-safe schema, auto-generated client, built-in migration support                                  |
| **Vercel serverless adapter**                                  | Zero-config deployment; `api/index.ts` wraps the Express app for serverless execution                |
| **Hardhat v2 (not v3)**                                        | Hardhat v3 requires ESM-only config; the existing TypeScript + CommonJS toolchain is incompatible    |
| **evmVersion: "cancun"**                                       | OpenZeppelin v5 uses the `mcopy` opcode (EIP-5656), which is only available from the Cancun hardfork |

---

## Known Issues / Limitations

- **No authentication** — the API is public; any caller can query any Ethereum address.
- **Single Alchemy key** — all requests share one API key; heavy load may hit rate limits.
- **No pagination** on `/history` — returns a hard-capped 20 records; large wallets are not fully supported.
- **Deployer key in env** — `DEPLOYER_PRIVATE_KEY` is used only for Hardhat scripts. It should never be set in production deployments.
- **Sepolia testnet** — the NFT contract runs on Sepolia (test ETH only, no real value).

---

## Live API

**Base URL:** `https://crypto.rctravelrentals.com`

| Endpoint                                     | Description     |
| -------------------------------------------- | --------------- |
| `GET /health`                                | Health check    |
| `GET /api/ethereum/account/:address`         | Account data    |
| `GET /api/ethereum/account/:address/history` | Balance history |
