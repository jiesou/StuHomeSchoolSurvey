# 家校问卷系统 (Home-School Survey System)

一套完整的问卷系统，基于 Deno + TypeScript + Vue + Oak + Prisma + PostgreSQL 构建，专为学校与家长之间的沟通设计。

## 功能特性

### 核心功能
- 📊 **多种问卷类型**：支持星级评价（0-10星）和文本输入两种题型
- 🔗 **URL 分享**：每个问卷都有独立的 UUID 链接，便于分享
- 👥 **无需注册**：家长只需输入姓名和学号即可参与问卷
- 📱 **响应式设计**：支持手机、平板、电脑等各种设备
- 📈 **实时统计**：管理员可实时查看提交数据和统计结果
- 🔄 **分页显示**：支持大量数据的分页浏览

### 管理功能
- ✨ **问卷创建**：简单直观的问卷创建界面
- 📋 **问卷管理**：查看所有问卷列表和提交状态
- 📊 **结果分析**：详细的统计分析和数据可视化
- 🗓️ **学期管理**：按学年、学期、周次组织问卷

## 技术栈

### 后端
- **Deno 2.5.2**: 现代的 JavaScript/TypeScript 运行时
- **Oak**: 高性能的 HTTP 服务器框架
- **Prisma**: 类型安全的数据库 ORM
- **PostgreSQL**: 可靠的关系型数据库
- **Zod**: 运行时数据验证

### 前端
- **Vue 3**: 渐进式 JavaScript 框架
- **TypeScript**: 类型安全的 JavaScript
- **Vue Router**: 前端路由管理
- **Axios**: HTTP 客户端
- **Vite**: 快速的构建工具

## 快速开始

### 1. 环境要求
- Docker & Docker Compose
- Deno 2.5.2+
- Node.js 18+ (仅开发时需要)

### 2. 启动开发环境

```bash
# 克隆项目
git clone <repository-url>
cd StuHomeSchoolSurvey

# 启动数据库
docker-compose up postgres -d

# 启动后端服务
cd server
deno run -A --env main.ts

# 启动前端服务 (新终端窗口)
cd client
npm install
npm run dev
```

### 3. 使用 Docker 部署

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## API 接口

### 问卷管理
- `GET /api/surveys` - 获取问卷列表（支持分页）
- `POST /api/surveys` - 创建新问卷
- `GET /api/surveys/:id` - 获取问卷详情
- `GET /api/surveys/:id/results` - 获取问卷结果统计

### 问卷答题
- `POST /api/surveys/:id/submit` - 提交问卷答案
- `POST /api/surveys/:id/check` - 检查是否已提交

### 系统接口
- `GET /api/health` - 健康检查

## 数据库结构

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  id_number VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 问卷表
CREATE TABLE surveys (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  year INTEGER NOT NULL,
  semester INTEGER NOT NULL, -- 1=上学期, 2=下学期
  week INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 问题表
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  survey_id UUID REFERENCES surveys(id),
  description TEXT,
  config JSONB NOT NULL, -- 问题配置 (类型、选项等)
  order_index INTEGER NOT NULL
);

-- 提交记录表
CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  survey_id UUID REFERENCES surveys(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(survey_id, user_id) -- 每人每问卷只能提交一次
);

-- 答案表
CREATE TABLE answers (
  id UUID PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id),
  question_id UUID REFERENCES questions(id),
  value TEXT NOT NULL -- JSON 格式的答案内容
);
```

## 问题类型配置

### 星级评价问题
```json
{
  "type": "star",
  "maxRating": 5  // 最高评分，默认 5 星
}
```

### 文本输入问题
```json
{
  "type": "input",
  "multiline": true,     // 是否多行输入
  "maxLength": 500       // 最大字符数限制
}
```

## 开发指南

### 添加新的问题类型

1. 在 `server/types.ts` 中定义新的配置类型
2. 在 `server/validation.ts` 中添加验证规则
3. 在前端 `client/src/types.ts` 中同步类型定义
4. 在问卷创建和回答组件中添加 UI 支持

### 运行测试

```bash
# 后端测试
cd server
deno test --allow-all

# 前端测试
cd client
npm run test
```

### 数据库操作

```bash
# 生成 Prisma 客户端
cd server
deno run -A npm:prisma generate

# 创建迁移
deno run -A npm:prisma migrate dev --name init

# 重置数据库
deno run -A npm:prisma migrate reset
```

## 生产部署

### 环境变量配置

创建 `.env` 文件：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/survey_db"
PORT=8000
NODE_ENV=production
```

### 性能优化建议

1. **数据库优化**
   - 为经常查询的字段添加索引
   - 使用连接池管理数据库连接
   - 定期清理过期数据

2. **应用优化**
   - 启用 HTTP 缓存
   - 使用 CDN 加速静态资源
   - 实施请求限频

3. **监控与日志**
   - 配置应用性能监控
   - 设置错误告警
   - 定期备份数据库

## 许可证

[MIT License](LICENSE)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题，请通过 GitHub Issues 联系我们。