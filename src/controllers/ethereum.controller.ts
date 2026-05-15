import { Request, Response, NextFunction } from "express";
import { ethereumService } from "../services/ethereum.service";
import { tokenService } from "../services/token.service";

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

  async getTokenBalances(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await tokenService.getTokenBalances(req.params.address);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getPortfolio(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const account = await ethereumService.getAccountData(req.params.address);
      const data = await tokenService.getPortfolio(
        req.params.address,
        account.balance,
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
