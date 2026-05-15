// Vercel serverless entry point — exports the Express app instead of calling app.listen()
// Environment variables are injected by Vercel at runtime (no .env file needed in production)
import dotenv from "dotenv";
dotenv.config({
  path: `.env.${process.env.NODE_ENV ?? "development"}`,
});
import app from "../src/app";

export default app;
