import { Router } from "express";
import { ethereumController } from "../controllers/ethereum.controller";
import { validateAddress } from "../middleware/validate";

const router = Router();

// GET /api/ethereum/account/:address
// Returns gas price, block number, and ETH balance for the given address
router.get(
  "/account/:address",
  validateAddress,
  ethereumController.getAccountData,
);

// GET /api/ethereum/account/:address/history
// Returns the last 20 stored balance snapshots from MongoDB
router.get(
  "/account/:address/history",
  validateAddress,
  ethereumController.getBalanceHistory,
);

export default router;
