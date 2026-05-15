import { cacheService } from "./cache.service";
import { prisma } from "../lib/prisma";
import type { EthereumAccountData, GasPrice } from "../types";

const ALCHEMY_URL =
  process.env.ALCHEMY_URL ?? "https://eth-mainnet.g.alchemy.com/v2/";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY ?? "";

// ---------------------------------------------------------------------------
// Low-level JSON-RPC helper
// ---------------------------------------------------------------------------

interface JsonRpcResponse<T = unknown> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

async function rpc<T>(method: string, params: unknown[] = []): Promise<T> {
  const url = `${ALCHEMY_URL}${ALCHEMY_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", method, params }),
  });
  if (!res.ok) throw new Error(`Alchemy network error: ${res.status}`);

  const json = (await res.json()) as JsonRpcResponse<T>;
  if (json.error)
    throw new Error(`RPC error ${json.error.code}: ${json.error.message}`);
  if (json.result === undefined)
    throw new Error(`Empty result for method: ${method}`);
  return json.result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert Wei (hex) to ETH string, e.g. "1.234567" */
function weiHexToEth(hex: string): string {
  const wei = BigInt(hex);
  const eth = Number(wei) / 1e18;
  return eth.toFixed(6);
}

/** Convert Gwei (hex) to Gwei number string */
function hexToGwei(hex: string): string {
  return (Number(BigInt(hex)) / 1e9).toFixed(2);
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

async function getGasPrice(): Promise<GasPrice> {
  const cached = await cacheService.get<GasPrice>("gas_price");
  if (cached) return cached;

  // eth_gasPrice returns current gas price in Wei (hex)
  const weiHex = await rpc<string>("eth_gasPrice");
  const gweiValue = hexToGwei(weiHex);

  const gas: GasPrice = {
    slow: gweiValue,
    standard: gweiValue,
    fast: gweiValue,
    unit: "Gwei",
  };

  await cacheService.set("gas_price", gas, cacheService.TTL.GAS_PRICE);
  return gas;
}

async function getBlockNumber(): Promise<number> {
  const cached = await cacheService.get<number>("block_number");
  if (cached) return cached;

  const hex = await rpc<string>("eth_blockNumber");
  const block = parseInt(hex, 16);

  await cacheService.set("block_number", block, cacheService.TTL.BLOCK_NUMBER);
  return block;
}

async function getBalance(address: string): Promise<string> {
  const weiHex = await rpc<string>("eth_getBalance", [address, "latest"]);
  return weiHexToEth(weiHex);
}

// ---------------------------------------------------------------------------
// Exported service object
// ---------------------------------------------------------------------------

export const ethereumService = {
  async getAccountData(address: string): Promise<EthereumAccountData> {
    const [gasPrice, blockNumber, balance] = await Promise.all([
      getGasPrice(),
      getBlockNumber(),
      getBalance(address),
    ]);

    // Persist balance snapshot to MongoDB — non-blocking, failure does not affect response
    prisma.accountBalance
      .create({
        data: { address: address.toLowerCase(), balance, blockNumber },
      })
      .catch((err: Error) =>
        console.warn("[DB] Failed to persist balance:", err.message),
      );

    return {
      address,
      balance,
      balanceUnit: "ETH",
      gasPrice,
      blockNumber,
      fetchedAt: new Date().toISOString(),
    };
  },

  async getBalanceHistory(address: string) {
    return prisma.accountBalance.findMany({
      where: { address: address.toLowerCase() },
      orderBy: { fetchedAt: "desc" },
      take: 20,
      select: { id: true, balance: true, blockNumber: true, fetchedAt: true },
    });
  },
};
