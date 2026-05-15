import { cacheService } from "./cache.service";
import type { TokenBalance, TokenBalancesData, PortfolioData } from "../types";

const ALCHEMY_URL =
  process.env.ALCHEMY_URL ?? "https://eth-mainnet.g.alchemy.com/v2/";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY ?? "";
const MAX_TOKENS = 30;

interface JsonRpcResponse<T = unknown> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

interface TokenBalancesResult {
  address: string;
  tokenBalances: Array<{ contractAddress: string; tokenBalance: string }>;
}

interface TokenMetadataResult {
  decimals: number | null;
  logo: string | null;
  name: string | null;
  symbol: string | null;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(`${ALCHEMY_URL}${ALCHEMY_API_KEY}`, {
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

function hexToDecimal(hex: string, decimals: number): string {
  if (!hex || hex === "0x0" || BigInt(hex) === 0n) return "0";
  const raw = BigInt(hex);
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = raw / divisor;
  const frac = raw % divisor;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 6).replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

async function resolveTokens(address: string): Promise<TokenBalance[]> {
  const result = await rpc<TokenBalancesResult>("alchemy_getTokenBalances", [
    address,
    "erc20",
  ]);

  const nonZero = result.tokenBalances
    .filter((t) => t.tokenBalance && BigInt(t.tokenBalance) > 0n)
    .slice(0, MAX_TOKENS);

  const metadata = await Promise.all(
    nonZero.map((t) =>
      rpc<TokenMetadataResult>("alchemy_getTokenMetadata", [
        t.contractAddress,
      ]).catch(() => null),
    ),
  );

  return nonZero
    .map((t, i): TokenBalance | null => {
      const meta = metadata[i];
      if (!meta) return null;
      const decimals = meta.decimals ?? 18;
      return {
        contractAddress: t.contractAddress,
        name: meta.name ?? "Unknown",
        symbol: meta.symbol ?? "???",
        decimals,
        logo: meta.logo ?? null,
        balance: hexToDecimal(t.tokenBalance, decimals),
      };
    })
    .filter((t): t is TokenBalance => t !== null);
}

export const tokenService = {
  async getTokenBalances(address: string): Promise<TokenBalancesData> {
    const key = `tokens:${address.toLowerCase()}`;
    const cached = await cacheService.get<TokenBalancesData>(key);
    if (cached) return cached;

    const tokens = await resolveTokens(address);
    const data: TokenBalancesData = {
      address,
      tokens,
      count: tokens.length,
      fetchedAt: new Date().toISOString(),
    };

    await cacheService.set(key, data, 60);
    return data;
  },

  async getPortfolio(
    address: string,
    ethBalance: string,
  ): Promise<PortfolioData> {
    const key = `portfolio:${address.toLowerCase()}`;
    const cached = await cacheService.get<PortfolioData>(key);
    if (cached) return cached;

    const tokens = await resolveTokens(address);
    const data: PortfolioData = {
      address,
      ethBalance,
      ethUnit: "ETH",
      tokens,
      tokenCount: tokens.length,
      fetchedAt: new Date().toISOString(),
    };

    await cacheService.set(key, data, 60);
    return data;
  },
};
