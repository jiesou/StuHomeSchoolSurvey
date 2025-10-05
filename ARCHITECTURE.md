# 架构说明

## 类型系统设计

### 为什么 types.ts 与 Prisma 类型分离？

项目中的 `types.ts` 文件定义了 API 契约类型，与 Prisma 生成的数据库类型是有意分离的。这不是冗余，而是遵循最佳实践：

#### 1. 客户端兼容性
- `client/src/types.ts` 在浏览器环境中运行，无法导入 Prisma 类型（Node.js 专用）
- 需要轻量级的类型定义，不依赖数据库层

#### 2. API 稳定性
- API 契约类型应该稳定，不随数据库 schema 变化而变化
- 允许数据库重构而不破坏 API 兼容性

#### 3. 清晰的层次边界
- **数据库层**: 使用 Prisma 类型 (server 内部)
- **API 层**: 使用 types.ts 定义的类型 (client-server 接口)
- 类型转换明确标识了层次边界

### 当前实现

```typescript
// Server 端数据库操作
const result = await prisma.survey.findUnique(...) // Prisma 类型
const survey = result as unknown as Survey         // API 类型
ctx.response.body = survey                          // 返回 API 契约
```

这种方式：
- ✅ 明确区分数据库实现和 API 契约
- ✅ 客户端可以安全使用类型
- ✅ 易于维护和重构

## 数据验证策略

### 多层验证
1. **数据库层**: VARCHAR 长度限制，UNIQUE 约束
2. **后端层**: 业务逻辑验证，返回可读错误
3. **前端层**: 基本 UI 验证（可选，不强制所有限制）

### 原则
- 后端验证是必须的（安全边界）
- 数据库约束是最后防线
- 前端验证提升用户体验

## 问卷更新策略

### 问题
更新问卷时删除旧问题会级联删除所有答案，导致历史数据丢失。

### 解决方案
禁止编辑已有提交记录的问卷：
- 检查提交数量
- 如果 > 0，返回错误提示建议创建新问卷
- 保护历史数据完整性

这种方式简单、安全、易理解。
