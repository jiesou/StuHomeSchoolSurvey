# 测试系统重置总结

## 完成的任务

### 1. 删除所有 mock-data 相关逻辑
- ✅ 删除 `mock-data.ts` 文件（187 行代码）
- ✅ 从 `routes/surveys.ts` 中移除所有 `USE_MOCK_DATA` 检查和 mock 逻辑
- ✅ 从 `routes/submissions.ts` 中移除所有 `USE_MOCK_DATA` 检查和 mock 逻辑
- ✅ 从 `main.ts` 中移除 `USE_MOCK_DATA` 环境变量检查
- ✅ 修复 TypeScript 类型错误（error 参数类型）

### 2. 代码清理效果
**删除前：**
- `server/mock-data.ts`: 187 行
- `server/routes/surveys.ts`: 310 行（包含大量 if-else 分支）
- `server/routes/submissions.ts`: 119 行（包含大量 if-else 分支）

**删除后：**
- `server/mock-data.ts`: 已删除 ✓
- `server/routes/surveys.ts`: 226 行（-27%，代码更清晰）
- `server/routes/submissions.ts`: 93 行（-22%，代码更简洁）

**总计：减少了 265+ 行重复和历史代码**

### 3. 新增单元测试
使用 Oak testing utilities、`@std/testing/mock` 和 `@std/assert` 创建了完整的单元测试：

#### 测试方法
- 使用 `testing.createMockContext()` 创建 Oak 模拟上下文
- 使用 `stub()` 对 `prisma` 实例的方法进行存根（stubbing）
- 直接调用路由中间件并验证响应
- 测试实际的 Oak 路由处理逻辑，而不是测试 mock 本身

#### 测试文件
- `server/main_test.ts` - 工具函数测试（3 个测试）
- `server/routes/surveys_test.ts` - 问卷路由测试（7 个测试）
- `server/routes/submissions_test.ts` - 提交路由测试（6 个测试）

#### 测试覆盖
**问卷路由测试（surveys_test.ts）：**
- ✅ GET / - 获取问卷列表分页逻辑
- ✅ GET /:id - 获取单个问卷详情
- ✅ GET /:id - 问卷不存在时返回 404
- ✅ POST / - 创建问卷及问题
- ✅ POST / - 缺少必要字段时返回 400
- ✅ DELETE /:id - 删除问卷
- ✅ GET /:id/results - 获取问卷结果和提交列表

**提交路由测试（submissions_test.ts）：**
- ✅ POST / - 成功创建提交记录
- ✅ POST / - 为新用户创建账户
- ✅ POST / - 检测重复提交
- ✅ POST / - 问卷不存在时返回 404
- ✅ POST / - 缺少必要字段时返回 400
- ✅ POST / - 检测无效问题 ID

**工具函数测试（main_test.ts）：**
- ✅ parseAnswerValue - 解析星级评分
- ✅ parseAnswerValue - 解析文本输入
- ✅ QuestionType - 枚举值验证

#### 测试结果
```
running 3 tests from ./main_test.ts
parseAnswerValue - 应该正确解析星级评分 ... ok (0ms)
parseAnswerValue - 应该正确解析文本输入 ... ok (0ms)
QuestionType - 枚举值应该正确 ... ok (0ms)

running 6 tests from ./routes/submissions_test.ts
POST / - 应该成功创建提交记录 ... ok (5ms)
POST / - 应该为新用户创建账户 ... ok (0ms)
POST / - 应该检测到重复提交 ... ok (0ms)
POST / - 问卷不存在时应该返回404 ... ok (0ms)
POST / - 缺少必要字段时应该返回400 ... ok (0ms)
POST / - 应该检测无效的问题ID ... ok (0ms)

running 7 tests from ./routes/surveys_test.ts
GET / - 应该返回分页的问卷列表 ... ok (2ms)
GET /:id - 应该返回指定ID的问卷 ... ok (0ms)
GET /:id - 问卷不存在时应该返回404 ... ok (0ms)
POST / - 应该成功创建问卷 ... ok (2ms)
POST / - 缺少必要字段时应该返回400 ... ok (0ms)
DELETE /:id - 应该成功删除问卷 ... ok (0ms)
GET /:id/results - 应该返回问卷和提交列表 ... ok (0ms)

ok | 16 passed | 0 failed (343ms)
```

### 4. 测试最佳实践
✅ 使用 Oak testing utilities (`testing.createMockContext()`) 测试实际路由  
✅ 使用 Deno 标准库：`@std/testing/mock` 和 `@std/assert`  
✅ 使用 stub 对真实的 `prisma` 实例进行存根，而不是创建假的 mock 对象  
✅ 测试实际的 Oak 路由处理逻辑和业务代码  
✅ 使用 `using` 关键字自动恢复 stub（disposable pattern）  
✅ 测试覆盖正常流程和边界情况（重复提交、无效 ID、404 等）  
✅ 不修改业务代码，只通过 stub 隔离数据库依赖

### 5. 代码改进
**之前的问题：**
- 代码重复：每个路由都有 `if (USE_MOCK_DATA)` 的分支
- 混乱的逻辑：mock 数据和实际业务逻辑混在一起
- 难以维护：修改业务逻辑需要同时修改 mock 和实际逻辑两套代码
- 测试问题：测试的是 mock 本身而不是实际业务逻辑
- 类型错误：error 参数没有正确的类型注解

**改进后：**
- 干净简洁：只有实际的业务逻辑
- 易于理解：代码路径清晰，没有不必要的分支
- 正确的测试方法：使用 Oak testing utilities 测试实际的路由处理器
- 正确的 stub 使用：对真实的 prisma 实例进行 stub，而不是创建假对象
- 类型安全：修复了所有 TypeScript 类型错误

### 6. 测试示例

**正确的测试方法：**
```typescript
import { testing } from "@oak/oak";
import { stub } from "@std/testing/mock";
import { prisma } from "../db.ts";
import { surveyRouter } from "./surveys.ts";

Deno.test("GET / - 应该返回分页的问卷列表", async () => {
  // 对真实的 prisma 实例进行 stub（使用 as any 处理 Prisma 类型）
  using findManyStub = stub(
    prisma.survey,
    "findMany",
    () => Promise.resolve(mockSurveys) as any
  );
  
  using countStub = stub(
    prisma.survey,
    "count",
    () => Promise.resolve(10) as any
  );
  
  // 创建 Oak 模拟上下文
  const ctx = testing.createMockContext({
    path: "/?page=1&limit=10",
    method: "GET",
  });
  
  // 调用实际的路由中间件，使用 createMockNext()
  const middleware = surveyRouter.routes();
  const next = testing.createMockNext();
  await middleware(ctx, next);
  
  // 验证响应
  assertEquals(ctx.response.status, 200);
  const body = ctx.response.body as any;
  assertEquals(body.surveys.length, 2);
});

// POST 请求示例
Deno.test("POST / - 应该成功创建问卷", async () => {
  const requestBody = {
    title: "新问卷",
    description: "新描述",
    year: "2024-2025",
    semester: 1,
    week: 1,
    questions: [...]
  };

  const ctx = testing.createMockContext({
    path: "/",
    method: "POST",
    headers: [["content-type", "application/json"]],
    body: ReadableStream.from([new TextEncoder().encode(JSON.stringify(requestBody))]),
  });

  const middleware = surveyRouter.routes();
  const next = testing.createMockNext();
  await middleware(ctx, next);

  assertEquals(ctx.response.status, 201);
});
```

## 运行测试

```bash
cd server
# 需要先生成 Prisma Client
npx prisma generate
# 运行测试（不需要 --no-check）
deno test --allow-all
```

## 注意事项

1. **数据库依赖**：实际运行服务器需要配置数据库和生成 Prisma Client
2. **测试隔离**：测试使用 `db_mock.ts` 完全隔离数据库，不需要实际数据库连接
3. **前端测试**：本次重置只涉及后端服务器测试，前端 Vue 测试未变动

## 下一步建议

1. 配置 CI/CD 自动运行测试
2. 考虑增加集成测试（使用测试数据库）
3. 为更多边界情况添加测试（如网络错误、数据库超时等）
