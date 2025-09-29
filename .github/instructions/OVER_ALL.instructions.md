---
applyTo: '**'
---

这是一套问卷系统，用 Deno+TypeScript+Vue+Oak+Prisma+PostgreSQL 搭建

# 总体要求

- 此项目会真正应用到数千人同时访问的生产环境中，你需要写单元测试。
- 涉及到的时间，都要用数据库 datetime 类类型存储。但注意学年、学期、周次等信息应当是问卷的参数，不应当作时间来考虑，因为它们取决于人为的安排。
- 不要 Overengineering！不要 Overengineering！不要 Overengineering！保持代码实现简短简单。不必要的代码，有默认值的代码不要写。如果可能，减少代码的更改。
- 坚持使用 Deno，避免 NPM。

### 关于数据结构

问卷（type Survey）的属性包含学年、学期（1/2 对应上学期下学期）、周。这些属性是因安排而变动的，是属于属性
而真正的发起时间，那就是 datetime/timestamp 类型了。

数据库包含
User 表
Survey 表
Question 表
Answer 表
Submission 表

### 日志

关键动作通过 deno @std/log 输出

### 测试

- 单元测试主要用 Deno 本身的测试框架，Mocking 假数据
- Vue 侧需要用 Vitest
- 数据库集成测试，在关键路径测试即可。用独立 test db，在 Docker Compose 中应当配置
