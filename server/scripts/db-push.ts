#!/usr/bin/env -S deno run -A --env

// Push database schema changes
import { execSync } from "node:child_process";

try {
  console.log("Pushing database schema...");
  execSync("npx prisma db push", { 
    stdio: "inherit", 
    cwd: Deno.cwd() 
  });
  console.log("Database schema pushed successfully!");
} catch (error) {
  console.error("Failed to push database schema:", error);
  Deno.exit(1);
}