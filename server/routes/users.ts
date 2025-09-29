import { Router } from "@oak/oak";
import { getPrismaClient } from "../database.ts";

export const userRoutes = new Router();

// Get user by ID number (for checking if user exists)
userRoutes.get("/by-id-number/:idNumber", async (ctx) => {
  const prisma = getPrismaClient();
  const { idNumber } = ctx.params;

  const user = await prisma.user.findFirst({
    where: { idNumber }
  });

  if (!user) {
    ctx.response.status = 404;
    ctx.response.body = { error: "User not found" };
    return;
  }

  ctx.response.body = user;
});