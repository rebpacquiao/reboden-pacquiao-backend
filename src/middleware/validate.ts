import { Request, Response, NextFunction } from "express";
import { z } from "zod";

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format");

export function validateAddress(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const result = addressSchema.safeParse(req.params.address);
  if (!result.success) {
    res
      .status(400)
      .json({ success: false, error: result.error.errors[0].message });
    return;
  }
  next();
}
