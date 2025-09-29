import { PrismaClient } from "@prisma/client";
import { getLogger } from "@std/log";

const logger = getLogger("database");

let prisma: PrismaClient | null = null;

export function getDatabase(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { level: "query", emit: "event" },
        { level: "error", emit: "event" },
        { level: "warn", emit: "event" },
      ],
    });

    // Log database queries in development
    if (Deno.env.get("NODE_ENV") !== "production") {
      prisma.$on("query", (e) => {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Params: ${e.params}`);
        logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    prisma.$on("error", (e) => {
      logger.error(`Database error: ${e.message}`);
    });

    prisma.$on("warn", (e) => {
      logger.warn(`Database warning: ${e.message}`);
    });

    logger.info("Database connection established");
  }
  
  return prisma;
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    logger.info("Database connection closed");
  }
}