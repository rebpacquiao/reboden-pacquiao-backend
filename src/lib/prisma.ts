import { PrismaClient } from "@prisma/client";

// ---------------------------------------------------------------------------
// PrismaClient singleton — prevents multiple instances in dev (hot-reload)
// and in Vercel serverless functions. The globalThis pattern is the
// recommended Prisma approach for serverless / Vercel deployments.
// See: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
// ---------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

