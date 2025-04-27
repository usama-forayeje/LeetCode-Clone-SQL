import { PrismaClient } from "../src/generated/prisma/index.js";

const globalFormPrisma = globalThis;

export const db = globalFormPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalFormPrisma.prisma = db;
