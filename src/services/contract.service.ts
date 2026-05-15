import { ethers } from "ethers";
import { cacheService } from "./cache.service";
import type { ContractInfo, OwnedToken } from "../types";
import ABI from "../abi/CryptoWalletNFT.json";

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS ?? "";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY ?? "";
const SEPOLIA_RPC = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const CACHE_TTL = 30;

function provider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(SEPOLIA_RPC);
}

function contract(p: ethers.Provider): ethers.Contract {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI as string[], p);
}

function isDeployed(): boolean {
  return (
    !!CONTRACT_ADDRESS &&
    CONTRACT_ADDRESS !== ZERO_ADDRESS &&
    CONTRACT_ADDRESS.startsWith("0x")
  );
}

export async function getContractInfo(): Promise<ContractInfo> {
  if (!isDeployed()) {
    return {
      address: CONTRACT_ADDRESS || ZERO_ADDRESS,
      name: "CryptoWalletNFT",
      symbol: "CWNFT",
      totalSupply: "0",
    };
  }

  const cached = await cacheService.get<ContractInfo>("contract:info");
  if (cached) return cached;

  const p = provider();
  const c = contract(p);

  const [name, symbol, totalSupply] = await Promise.all([
    c.name() as Promise<string>,
    c.symbol() as Promise<string>,
    c.totalSupply() as Promise<bigint>,
  ]);

  const info: ContractInfo = {
    address: CONTRACT_ADDRESS,
    name,
    symbol,
    totalSupply: totalSupply.toString(),
  };

  await cacheService.set("contract:info", info, CACHE_TTL);
  return info;
}

export async function getOwnedTokens(address: string): Promise<OwnedToken[]> {
  if (!isDeployed()) return [];

  const cacheKey = `contract:tokens:${address.toLowerCase()}`;
  const cached = await cacheService.get<OwnedToken[]>(cacheKey);
  if (cached) return cached;

  const p = provider();
  const c = contract(p);

  const balance = (await c.balanceOf(address)) as bigint;
  const count = Number(balance);

  const tokens: OwnedToken[] = [];
  for (let i = 0; i < count; i++) {
    const tokenId = (await c.tokenOfOwnerByIndex(address, i)) as bigint;
    const uri = (await c.tokenURI(tokenId)) as string;
    tokens.push({ tokenId: tokenId.toString(), tokenURI: uri, owner: address });
  }

  await cacheService.set(cacheKey, tokens, CACHE_TTL);
  return tokens;
}
