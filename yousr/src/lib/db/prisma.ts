import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const CLIENT_REV = 2;
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaRev?: number };

function createClient() {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  });
  return new PrismaClient({ adapter });
}

if (process.env.NODE_ENV !== "production" && globalForPrisma.prismaRev !== CLIENT_REV) {
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaRev = CLIENT_REV;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
