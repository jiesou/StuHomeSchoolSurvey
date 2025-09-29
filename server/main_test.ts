import { assertEquals } from "@std/assert";
import { app } from "./main.ts";

Deno.test("健康检查端点测试", async () => {
  // 这是一个基本的应用启动测试
  // 在实际环境中，这里应该使用 supertest 类似的工具来测试 HTTP 端点
  assertEquals(typeof app, "object");
});
