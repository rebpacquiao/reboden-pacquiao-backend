export interface GasPrice {
  slow: string;
  standard: string;
  fast: string;
  unit: "Gwei";
}

export interface EthereumAccountData {
  address: string;
  balance: string;
  balanceUnit: "ETH";
  gasPrice: GasPrice;
  blockNumber: number;
  fetchedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TokenBalance {
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string | null;
  balance: string;
}

export interface TokenBalancesData {
  address: string;
  tokens: TokenBalance[];
  count: number;
  fetchedAt: string;
}

export interface PortfolioData {
  address: string;
  ethBalance: string;
  ethUnit: "ETH";
  tokens: TokenBalance[];
  tokenCount: number;
  fetchedAt: string;
}

export interface OwnedToken {
  tokenId: string;
  tokenURI: string;
  owner: string;
}

export interface ContractInfo {
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
}

export interface ContractData {
  info: ContractInfo;
  ownedTokens: OwnedToken[];
  fetchedAt: string;
}

export interface MintRecord {
  id: string;
  tokenId: string;
  tokenURI: string;
  owner: string;
  txHash: string;
  mintedAt: string;
}
