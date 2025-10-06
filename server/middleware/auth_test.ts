// 鉴权中间件单元测试
import { assertEquals } from "@std/assert";
import { testing } from "@oak/oak";
import { needAdminAuthorization } from "./auth.ts";

// 测试无 ADMIN_SECRET 环境变量
Deno.test("needAdminAuthorization - 无 ADMIN_SECRET 环境变量时应返回 500", async () => {
  const originalSecret = Deno.env.get("ADMIN_SECRET");
  Deno.env.delete("ADMIN_SECRET");

  const ctx = testing.createMockContext({
    path: "/",
    method: "GET",
  });
  const next = testing.createMockNext();

  await needAdminAuthorization(ctx, next);

  assertEquals(ctx.response.status, 500);
  const body = ctx.response.body as any;
  assertEquals(body.error, "服务器配置错误");

  // 恢复环境变量
  if (originalSecret) {
    Deno.env.set("ADMIN_SECRET", originalSecret);
  }
});

// 测试无 Authorization 头
Deno.test("needAdminAuthorization - 无 Authorization 头时应返回 401", async () => {
  Deno.env.set("ADMIN_SECRET", "test-secret");

  const ctx = testing.createMockContext({
    path: "/",
    method: "GET",
  });
  const next = testing.createMockNext();

  await needAdminAuthorization(ctx, next);

  assertEquals(ctx.response.status, 401);
  const body = ctx.response.body as any;
  assertEquals(body.error, "未授权访问");
});

// 测试错误的 Authorization 头
Deno.test("needAdminAuthorization - 错误的 Authorization 头时应返回 401", async () => {
  Deno.env.set("ADMIN_SECRET", "test-secret");

  const ctx = testing.createMockContext({
    path: "/",
    method: "GET",
    headers: [["Authorization", "wrong-secret"]],
  });
  const next = testing.createMockNext();

  await needAdminAuthorization(ctx, next);

  assertEquals(ctx.response.status, 401);
  const body = ctx.response.body as any;
  assertEquals(body.error, "未授权访问");
});

// 测试正确的 Authorization 头
Deno.test("needAdminAuthorization - 正确的 Authorization 头应继续处理", async () => {
  Deno.env.set("ADMIN_SECRET", "test-secret");

  const ctx = testing.createMockContext({
    path: "/",
    method: "GET",
    headers: [["Authorization", "test-secret"]],
  });

  let nextCalled = false;
  const next = async () => {
    nextCalled = true;
  };

  await needAdminAuthorization(ctx, next);

  assertEquals(nextCalled, true);
  // 鉴权通过后不应设置错误状态
  assertEquals(ctx.response.status !== 401 && ctx.response.status !== 500, true);
});
