import { Request, Response, NextFunction } from "express";
import { ethereumService } from "../services/ethereum.service";

export const ethereumController = {
  async getAccountData(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await ethereumService.getAccountData(req.params.address);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getBalanceHistory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await ethereumService.getBalanceHistory(req.params.address);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
