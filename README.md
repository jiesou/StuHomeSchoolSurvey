# 家校互联问卷系统

这是一套基于 Deno + Oak + Prisma + Vue3 + Ant Design 搭建的问卷系统，用于学校和家长之间的问卷调研。

## 功能特色

### 📋 核心功能
- **问卷管理**: 校方可以创建、查看和管理问卷
- **多问卷支持**: 同时支持多个问卷并存，每个问卷有独立的结果页面
- **分页展示**: 问卷列表和结果页面都支持分页，适合大量数据
- **实时统计**: 可查看问卷收集数量和详细结果
- **免注册答题**: 家长只需输入姓名和学号即可参与

### 🎯 问卷特性
- **学期管理**: 支持学年、学期（上/下学期）、周次等时间属性
- **多种题型**: 支持星级评分（0-5星）和文本输入题型
- **一人一票**: 同一用户只能对同一问卷提交一次答案
- **链接分享**: 问卷可通过 URL 直接分享，包含问卷ID

## 技术架构

### 后端技术栈
- **运行时**: Deno
- **Web框架**: Oak
- **数据库ORM**: Prisma
- **数据库**: PostgreSQL
- **语言**: TypeScript

### 前端技术栈
- **框架**: Vue 3 + Composition API
- **UI库**: Ant Design Vue
- **路由**: Vue Router
- **构建工具**: Vite
- **语言**: TypeScript

## 数据库设计

```sql
-- 用户表
User {
  id: number (PK)
  name: string
  id_number: string  // 学号
  role: number       // 1=学生, 10=老师
}

-- 问卷表  
Survey {
  id: number (PK)
  title: string
  description?: string
  year: string       // 学年，如 "2023-2024"
  semester: number   // 1=上学期, 2=下学期
  week: number       // 周次
  created_at: DateTime
}

-- 问题表
Question {
  id: number (PK)
  survey_id: number (FK)
  description?: string
  config: JSONB      // 问题配置，包含类型和参数
}

-- 答案表
Answer {
  id: number (PK)
  question_id: number (FK)
  submission_id: number (FK)
  value: string      // 统一存储为字符串
}

-- 提交记录表
Submission {
  id: number (PK)
  survey_id: number (FK)
  user_id: number (FK)
  created_at: DateTime
  
  UNIQUE(survey_id, user_id)  // 确保一人一票
}
```

## 快速开始

### ⚡ 快速启动（开发模式）

**重要：需要同时启动后端和前端服务器！**

```bash
# 1. 启动后端服务器（在第一个终端）
cd server
deno task db:generate  # 首次运行需要
deno task dev

# 2. 启动前端服务器（在第二个终端）
cd client
npm install  # 首次运行需要
npm run dev
```

然后访问：http://localhost:5173

### 环境要求
- Deno 1.40+
- Node.js 18+
- PostgreSQL 13+（可选，默认使用模拟数据）

### 完整安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd StuHomeSchoolSurvey
```

2. **设置数据库**
```bash
# 启动 PostgreSQL（或使用 Docker）
# 创建数据库
createdb survey_system

# 配置环境变量
cp server/.env.example server/.env
# 编辑 server/.env 文件，设置正确的数据库连接字符串
```

3. **初始化后端**
```bash
cd server

# 安装依赖
npm install --save-dev prisma

# 生成 Prisma 客户端
deno task db:generate

# 推送数据库结构
deno task db:push

# 启动后端服务
deno task dev
```

4. **初始化前端**
```bash
cd client

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

5. **访问应用**
- 前端管理界面: http://localhost:5173/admin
- API服务: http://localhost:8000
- 答题界面: http://localhost:5173/survey/:id

## API 接口

### 问卷管理
- `GET /api/surveys?page=1&limit=10` - 获取问卷列表（分页）
- `POST /api/surveys` - 创建新问卷
- `GET /api/surveys/:id` - 获取问卷详情
- `GET /api/surveys/:id/results?page=1&limit=20` - 获取问卷结果（分页）

### 答卷提交
- `POST /api/submissions` - 提交问卷答案

### 系统
- `GET /health` - 健康检查

## 使用指南

### 管理员操作

1. **创建问卷**
   - 访问 `/admin/create`
   - 填写问卷基本信息（标题、学年、学期、周次等）
   - 添加问题（支持星级评分和文本输入）
   - 设置问题是否必填

2. **查看问卷列表**
   - 访问 `/admin`
   - 查看所有问卷，支持分页浏览
   - 复制问卷链接进行分享

3. **查看问卷结果**
   - 在问卷列表中点击"查看结果"
   - 查看详细的提交记录和统计数据
   - 支持分页浏览结果

### 用户答题

1. **访问问卷**
   - 通过问卷链接 `/survey/:id` 访问
   - 无需预先注册

2. **填写信息**
   - 输入姓名和学号
   - 回答问卷问题

3. **提交答案**
   - 检查必填项
   - 提交后不可重复提交同一问卷

## 开发指南

### 项目结构
```
StuHomeSchoolSurvey/
├── server/              # 后端代码
│   ├── routes/         # API 路由
│   ├── prisma/         # 数据库相关
│   ├── types.ts        # 类型定义
│   ├── db.ts           # 数据库服务
│   └── main.ts         # 入口文件
├── client/              # 前端代码
│   ├── src/
│   │   ├── views/      # 页面组件
│   │   ├── api/        # API 服务
│   │   ├── router/     # 路由配置
│   │   └── types.ts    # 共享类型
│   └── package.json
└── README.md
```

### 代码风格
- 保持代码简洁，避免过度设计
- 使用 TypeScript 确保类型安全
- 前后端共享类型定义
- 注释使用中文

### 测试
```bash
# 后端测试
cd server
deno test --allow-all

# 前端构建测试
cd client
npm run build
```

## 生产部署

1. **构建前端**
```bash
cd client
npm run build
```

2. **编译后端**
```bash
cd server
deno task build
```

3. **配置环境变量**
- 设置生产数据库连接
- 配置 CORS 等安全设置

4. **部署数据库**
```bash
npx prisma migrate deploy
```

## 许可证

[MIT License](LICENSE)

## 贡献指南

欢迎提交 Issues 和 Pull Requests 来改进这个项目。

---

**注意**: 这个项目设计用于真实的生产环境，支持数千人同时访问。在部署到生产环境前，请确保进行充分的测试和性能优化。