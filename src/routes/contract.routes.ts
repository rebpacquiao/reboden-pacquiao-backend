import { Router } from "express";
import {
  fetchInfo,
  fetchOwnedTokens,
} from "../controllers/contract.controller";

const router = Router();

router.get("/info", fetchInfo);
router.get("/tokens/:address", fetchOwnedTokens);

export default router;
