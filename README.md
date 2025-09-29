# 家校互联问卷系统

一套基于 Deno + TypeScript + Vue + Oak + Prisma + PostgreSQL 的问卷调查系统。

## 功能特性

### 管理端功能
- 📊 **问卷管理**：创建、编辑、查看问卷列表
- 📈 **结果统计**：查看问卷提交统计和详细分析
- 🔗 **链接分享**：生成公开问卷链接供家长填写
- 📋 **分页显示**：支持大数据量的分页浏览

### 用户端功能  
- 📝 **简单填写**：仅需姓名和学号即可参与
- ⭐ **多种题型**：支持星级评价（0-5星）和文本输入
- 🚫 **防重复提交**：同一用户只能提交一次
- ✅ **即时反馈**：提交成功后显示确认页面

### 技术特点
- 🦕 **Deno 生态**：使用现代 JavaScript 运行时
- 🔒 **类型安全**：TypeScript 全覆盖
- 🎨 **美观界面**：基于 Ant Design Vue 组件库
- 📱 **响应式设计**：支持移动端访问
- 🗄️ **数据可靠**：PostgreSQL + Prisma ORM
- 🧪 **测试覆盖**：包含单元测试和集成测试

## 快速开始

### 环境要求
- Deno 2.5+
- Node.js 18+ (用于客户端)
- PostgreSQL 14+
- Docker (可选，用于数据库)

### 1. 启动数据库

```bash
# 使用 Docker Compose 启动 PostgreSQL
docker compose up -d
```

### 2. 后端设置

```bash
cd server

# 安装 Prisma 依赖
npm install

# 推送数据库模式
npx prisma db push

# 启动开发服务器
deno task dev
```

### 3. 前端设置

```bash
cd client

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 4. 访问应用

- **管理界面**: http://localhost:5173/admin/surveys
- **API 文档**: http://localhost:8000/health (健康检查)

## 项目结构

```
├── client/                 # Vue 前端应用
│   ├── src/
│   │   ├── views/         # 页面组件
│   │   ├── services/      # API 服务
│   │   ├── types.ts       # 类型定义
│   │   └── router/        # 路由配置
│   └── package.json
├── server/                 # Deno 后端应用
│   ├── routes/            # API 路由
│   ├── prisma/            # 数据库模式
│   ├── scripts/           # 工具脚本
│   ├── database.ts        # 数据库连接
│   ├── types.ts           # 共享类型
│   └── main.ts           # 服务器入口
├── docker-compose.yml     # 数据库服务
└── README.md
```

## API 接口

### 问卷接口
- `GET /api/surveys` - 获取问卷列表
- `POST /api/surveys` - 创建新问卷
- `GET /api/surveys/:id` - 获取问卷详情
- `POST /api/surveys/:id/submit` - 提交问卷回答
- `GET /api/surveys/:id/results` - 获取问卷结果

### 用户接口
- `GET /api/users/by-id-number/:idNumber` - 通过学号查询用户

## 数据模型

### 核心实体
- **Survey** - 问卷（包含学年、学期、周次等属性）
- **Question** - 问题（支持星级和文本两种类型）
- **User** - 用户（姓名和学号）
- **Submission** - 提交记录（确保唯一性约束）
- **Answer** - 答案（关联问题和提交）

## 测试

```bash
# 运行后端测试
cd server
deno test -A --env

# 运行前端测试
cd client
npm run test
```

## 部署

### 生产环境变量

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
PORT=8000
```

### 构建

```bash
# 构建前端
cd client
npm run build

# 编译后端
cd server
deno task build
```

## 开发说明

### 添加新问题类型

1. 在 `types.ts` 中扩展 `QuestionConfig` 类型
2. 在前端 `UserSurveyForm.vue` 中添加渲染逻辑
3. 在 `AdminCreateSurvey.vue` 中添加配置选项
4. 更新结果统计页面的展示逻辑

### 数据库迁移

```bash
cd server
npx prisma db push  # 开发环境
npx prisma migrate dev  # 生产环境
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！