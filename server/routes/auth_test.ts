// 认证路由单元测试 - 使用 Test Steps
import { assertEquals, assertExists } from "@std/assert";
import { stub } from "@std/testing/mock";
import { testing } from "@oak/oak";
import { authRouter } from "./auth.ts";
import { prisma } from "../db.ts";
import { UserRole } from "../types.ts";
import { hashPassword } from "../auth.ts";

// 登录测试组
Deno.test("Authentication - 认证路由测试", async (t) => {
  await t.step("POST /login - 应该成功登录管理员", async () => {
    const passwordHash = await hashPassword("admin123");
    const mockAdmin = {
      id: 1,
      name: "ADMIN",
      id_number: "ADMIN",
      role: UserRole.ADMIN,
      password: passwordHash
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

  await t.step("POST /login - 错误密码应该返回401", async () => {
    const passwordHash = await hashPassword("admin123");
    const mockAdmin = {
      id: 1,
      name: "ADMIN",
      id_number: "ADMIN",
      role: UserRole.ADMIN,
      password: passwordHash
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

  await t.step("POST /login - 不存在的用户应该返回401", async () => {
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

  await t.step("POST /register - 应该成功注册管理员", async () => {
    const passwordHash = await hashPassword("password123");
    const mockNewAdmin = {
      id: 2,
      name: "NewAdmin",
      id_number: "NEWADMIN",
      role: UserRole.ADMIN,
      password: passwordHash
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
});
