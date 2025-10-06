# 管理员鉴权机制说明

本项目实现了基于密钥的简单鉴权机制，用于保护管理员功能。

## 配置

### 1. 设置密钥

在项目的各个 `.env` 文件中设置 `ADMIN_SECRET`：

**根目录 `.env`：**
```env
ADMIN_SECRET=your_admin_secret_here
```

**server/.env：**
```env
ADMIN_SECRET=your_admin_secret_here
```

**client/.env：**
```env
VITE_ADMIN_SECRET=your_admin_secret_here
```

### 2. Docker Compose

在 `docker-compose.yml` 中已经配置了环境变量传递：

```yaml
environment:
  ADMIN_SECRET: ${ADMIN_SECRET:-your_admin_secret_here}
```

可以在根目录的 `.env` 文件中设置，或者通过环境变量传递。

## 使用方式

### 前端访问

1. **访问管理端**：使用 URL `/admin-{ADMIN_SECRET}` 访问管理界面
   - 例如：`http://localhost:8000/admin-mysecret123`
   
2. **自动保存**：访问后，密钥会自动保存到 `sessionStorage` 中

3. **导航**：在管理界面中的所有导航会自动使用保存的密钥

### 后端 API

1. **保护的路由**：所有管理员 API 都在 `/api/admin` 路径下
   - 例如：`/api/admin/surveys`（获取问卷列表）
   - 例如：`/api/admin/surveys/:id`（获取、更新、删除问卷）

2. **公开路由**：用户填写问卷的 API 保持公开
   - `/api/surveys/:id`（获取单个问卷详情）
   - `/api/submissions`（提交问卷答案）

3. **鉴权方式**：通过 HTTP 请求头传递
   ```
   Authorization: your_admin_secret_here
   ```

## 架构说明

### 服务端

1. **中间件**：`server/middleware/auth.ts`
   - `needAdminAuthorization()` 函数验证请求头中的 Authorization 值
   - 与环境变量 `ADMIN_SECRET` 比对

2. **路由分离**：
   - `/api/admin/*` - 需要鉴权的管理员路由
   - `/api/*` - 公开访问的路由

### 客户端

1. **动态路由**：
   - `/admin-{secret}` - 管理端入口，会记录 secret 到 sessionStorage
   - `/` - 重定向到带 secret 的管理端

2. **API 封装**：
   - `apiService.adminRequest()` - 自动从 sessionStorage 读取密钥并附加到请求头
   - 管理员操作（创建、更新、删除、查看结果）都使用此方法

## 安全建议

1. **更改默认密钥**：在生产环境中务必修改默认的 `your_admin_secret_here`
2. **使用强密钥**：建议使用长度 ≥ 16 的随机字符串
3. **HTTPS**：生产环境必须使用 HTTPS，防止密钥在传输中被窃取
4. **定期更换**：定期更换 ADMIN_SECRET
5. **环境变量**：不要将真实的密钥提交到代码仓库

## 测试

运行测试验证鉴权功能：

```bash
# 单元测试
cd server
deno test -A middleware/auth_test.ts

# 所有测试
deno test -A
```

## 示例

### 使用 curl 测试

```bash
# 未授权访问 - 应返回 401
curl -X GET http://localhost:8000/api/admin/surveys

# 正确授权 - 应返回问卷列表
curl -X GET http://localhost:8000/api/admin/surveys \
  -H "Authorization: your_admin_secret_here"
```

### 在代码中使用

前端代码会自动处理鉴权，只需调用 `apiService` 的方法：

```typescript
// 获取问卷列表 - 自动附加 Authorization 头
const surveys = await apiService.getSurveys()

// 创建问卷 - 自动附加 Authorization 头
const newSurvey = await apiService.createSurvey(data)
```
