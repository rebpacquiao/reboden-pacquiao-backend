import type { Request, Response, NextFunction } from "express";
import { getContractInfo, getOwnedTokens } from "../services/contract.service";
import type { ApiResponse, ContractInfo, OwnedToken } from "../types";

export async function fetchInfo(
  _req: Request,
  res: Response<ApiResponse<ContractInfo>>,
  next: NextFunction,
): Promise<void> {
  try {
    const info = await getContractInfo();
    res.json({ success: true, data: info });
  } catch (err) {
    next(err);
  }
}

export async function fetchOwnedTokens(
  req: Request<{ address: string }>,
  res: Response<ApiResponse<OwnedToken[]>>,
  next: NextFunction,
): Promise<void> {
  try {
    const { address } = req.params;
    const tokens = await getOwnedTokens(address);
    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
}
