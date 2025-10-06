// 集成测试 - 测试管理员 API 鉴权
import { assertEquals } from "@std/assert";
import { Application } from "@oak/oak";

// 注意：这个测试需要设置 ADMIN_SECRET 环境变量
Deno.test({
  name: "Admin API - 未授权访问应该返回 401",
  async fn() {
    Deno.env.set("ADMIN_SECRET", "test-integration-secret");
    
    const response = await fetch("http://localhost:8000/api/admin/surveys", {
      method: "GET",
    });
    
    assertEquals(response.status, 401);
    const data = await response.json();
    assertEquals(data.error, "未授权访问");
  },
  ignore: true, // 需要运行中的服务器
});

Deno.test({
  name: "Admin API - 使用正确的密钥应该可以访问",
  async fn() {
    Deno.env.set("ADMIN_SECRET", "test-integration-secret");
    
    const response = await fetch("http://localhost:8000/api/admin/surveys", {
      method: "GET",
      headers: {
        "Authorization": "test-integration-secret",
      },
    });
    
    // 应该返回 200 或其他非 401 状态
    assertEquals(response.status !== 401, true);
  },
  ignore: true, // 需要运行中的服务器
});

Deno.test({
  name: "Public API - 访问公开端点应该不需要授权",
  async fn() {
    const response = await fetch("http://localhost:8000/api/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    
    // 虽然会因为缺少数据返回错误，但不应该是 401
    assertEquals(response.status !== 401, true);
  },
  ignore: true, // 需要运行中的服务器
});
