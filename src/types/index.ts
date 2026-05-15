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
