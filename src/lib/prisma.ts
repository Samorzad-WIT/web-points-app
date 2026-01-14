import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import pg from "pg";

import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (connectionString == null || connectionString === "") {
  throw new Error("DATABASE_URL is not set in environment variables.");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma };
