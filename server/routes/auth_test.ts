// 认证路由单元测试
import { assertEquals, assertExists } from "@std/assert";
import { stub } from "@std/testing/mock";
import { testing } from "@oak/oak";
import { authRouter } from "./auth.ts";
import { prisma } from "../db.ts";
import { UserRole } from "../types.ts";

// 测试登录
Deno.test("POST /login - 应该成功登录管理员", async () => {
  const mockAdmin = {
    id: 1,
    name: "ADMIN",
    id_number: "ADMIN",
    role: UserRole.ADMIN,
    password: "a2ccac6bc029eadbc8caeaff5d6dc232fc2f396265d6dc0778034f7a2ca827ef" // admin123的哈希
  };

  using findUniqueStub = stub(
    prisma.user,
    "findUnique",
    () => Promise.resolve(mockAdmin) as any
  );

  const requestBody = {
    id_number: "ADMIN",
    password: "admin123"
  };

  const ctx = testing.createMockContext({
    path: "/login",
    method: "POST",
    headers: [["content-type", "application/json"]],
    body: ReadableStream.from([new TextEncoder().encode(JSON.stringify(requestBody))]),
  });

  const middleware = authRouter.routes();
  const next = testing.createMockNext();
  await middleware(ctx, next);

  assertEquals(ctx.response.status, 200);
  const body = ctx.response.body as any;
  assertExists(body.token);
  assertEquals(body.user.id, 1);
  assertEquals(body.user.role, UserRole.ADMIN);
});

// 测试错误密码
Deno.test("POST /login - 错误密码应该返回401", async () => {
  const mockAdmin = {
    id: 1,
    name: "ADMIN",
    id_number: "ADMIN",
    role: UserRole.ADMIN,
    password: "a2ccac6bc029eadbc8caeaff5d6dc232fc2f396265d6dc0778034f7a2ca827ef" // admin123的哈希
  };

  using findUniqueStub = stub(
    prisma.user,
    "findUnique",
    () => Promise.resolve(mockAdmin) as any
  );

  const requestBody = {
    id_number: "ADMIN",
    password: "wrongpassword"
  };

  const ctx = testing.createMockContext({
    path: "/login",
    method: "POST",
    headers: [["content-type", "application/json"]],
    body: ReadableStream.from([new TextEncoder().encode(JSON.stringify(requestBody))]),
  });

  const middleware = authRouter.routes();
  const next = testing.createMockNext();
  await middleware(ctx, next);

  assertEquals(ctx.response.status, 401);
  const body = ctx.response.body as any;
  assertEquals(body.error, "用户名或密码错误");
});

// 测试不存在的用户
Deno.test("POST /login - 不存在的用户应该返回401", async () => {
  using findUniqueStub = stub(
    prisma.user,
    "findUnique",
    () => Promise.resolve(null) as any
  );

  const requestBody = {
    id_number: "NOTEXIST",
    password: "password"
  };

  const ctx = testing.createMockContext({
    path: "/login",
    method: "POST",
    headers: [["content-type", "application/json"]],
    body: ReadableStream.from([new TextEncoder().encode(JSON.stringify(requestBody))]),
  });

  const middleware = authRouter.routes();
  const next = testing.createMockNext();
  await middleware(ctx, next);

  assertEquals(ctx.response.status, 401);
  const body = ctx.response.body as any;
  assertEquals(body.error, "用户名或密码错误");
});

// 测试注册
Deno.test("POST /register - 应该成功注册管理员", async () => {
  const mockNewAdmin = {
    id: 2,
    name: "NewAdmin",
    id_number: "NEWADMIN",
    role: UserRole.ADMIN,
    password: "somehash"
  };

  using findUniqueStub = stub(
    prisma.user,
    "findUnique",
    () => Promise.resolve(null) as any
  );

  using createStub = stub(
    prisma.user,
    "create",
    () => Promise.resolve(mockNewAdmin) as any
  );

  const requestBody = {
    name: "NewAdmin",
    id_number: "NEWADMIN",
    password: "password123"
  };

  const ctx = testing.createMockContext({
    path: "/register",
    method: "POST",
    headers: [["content-type", "application/json"]],
    body: ReadableStream.from([new TextEncoder().encode(JSON.stringify(requestBody))]),
  });

  const middleware = authRouter.routes();
  const next = testing.createMockNext();
  await middleware(ctx, next);

  assertEquals(ctx.response.status, 201);
  const body = ctx.response.body as any;
  assertExists(body.token);
  assertEquals(body.user.id, 2);
  assertEquals(body.user.role, UserRole.ADMIN);
});
