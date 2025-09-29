#!/usr/bin/env -S deno run -A --env

// Generate Prisma client for Deno
import { execSync } from "node:child_process";

try {
  console.log("Generating Prisma client...");
  execSync("npx prisma generate", { 
    stdio: "inherit", 
    cwd: Deno.cwd() 
  });
  console.log("Prisma client generated successfully!");
} catch (error) {
  console.error("Failed to generate Prisma client:", error);
  Deno.exit(1);
}