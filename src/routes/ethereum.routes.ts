import { Router } from "express";
import { ethereumController } from "../controllers/ethereum.controller";
import { validateAddress } from "../middleware/validate";

const router = Router();

router.get(
  "/account/:address",
  validateAddress,
  ethereumController.getAccountData,
);
router.get(
  "/account/:address/history",
  validateAddress,
  ethereumController.getBalanceHistory,
);
router.get(
  "/account/:address/tokens",
  validateAddress,
  ethereumController.getTokenBalances,
);
router.get(
  "/account/:address/portfolio",
  validateAddress,
  ethereumController.getPortfolio,
);

export default router;
