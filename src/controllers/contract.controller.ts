import type { Request, Response, NextFunction } from "express";
import { getContractInfo, getOwnedTokens } from "../services/contract.service";
import { prisma } from "../lib/prisma";
import type {
  ApiResponse,
  ContractInfo,
  OwnedToken,
  MintRecord,
} from "../types";

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

export async function recordMint(
  req: Request,
  res: Response<ApiResponse<MintRecord>>,
  next: NextFunction,
): Promise<void> {
  try {
    const { tokenId, tokenURI, owner, txHash } = req.body as {
      tokenId: string;
      tokenURI: string;
      owner: string;
      txHash: string;
    };

    const record = await prisma.mintedNFT.upsert({
      where: { txHash },
      update: {},
      create: { tokenId, tokenURI, owner: owner.toLowerCase(), txHash },
    });

    res.json({
      success: true,
      data: {
        id: record.id,
        tokenId: record.tokenId,
        tokenURI: record.tokenURI,
        owner: record.owner,
        txHash: record.txHash,
        mintedAt: record.mintedAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMintHistory(
  _req: Request,
  res: Response<ApiResponse<MintRecord[]>>,
  next: NextFunction,
): Promise<void> {
  try {
    const records = await prisma.mintedNFT.findMany({
      orderBy: { mintedAt: "desc" },
      take: 50,
    });

    res.json({
      success: true,
      data: records.map((r) => ({
        id: r.id,
        tokenId: r.tokenId,
        tokenURI: r.tokenURI,
        owner: r.owner,
        txHash: r.txHash,
        mintedAt: r.mintedAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
}
