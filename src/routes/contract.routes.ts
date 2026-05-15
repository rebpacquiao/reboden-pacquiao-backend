import { Router } from "express";
import {
  fetchInfo,
  fetchOwnedTokens,
  recordMint,
  getMintHistory,
} from "../controllers/contract.controller";

const router = Router();

router.get("/info", fetchInfo);
router.get("/tokens/:address", fetchOwnedTokens);
router.post("/record", recordMint);
router.get("/history", getMintHistory);

export default router;
