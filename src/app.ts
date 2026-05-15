import express from "express";
import cors from "cors";
import ethereumRoutes from "./routes/ethereum.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// API routes
app.use("/api/ethereum", ethereumRoutes);

// 404 handler
app.use((_req, res) =>
  res.status(404).json({ success: false, error: "Route not found" }),
);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
