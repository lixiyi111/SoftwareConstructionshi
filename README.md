# StudyFlow 学习任务管理系统

> 软件构造课程实验项目  
> 四层 DDD 架构 · TypeScript · 领域不变量驱动重构

---

## 项目简介

StudyFlow 是一个面向学生个人的学习任务管理工具，核心场景是帮助学生规划、跟踪和管理自己的学习任务。

项目采用**四层 DDD 架构**（domain / application / infrastructure / interfaces），强调**领域层的自保护能力**——6 条业务不变量全部由 Task 实体自我校验，应用层只负责编排，不持有业务规则。

### 当前阶段

- ✅ 需求分析与领域建模
- ✅ 四层架构搭建与骨架生成
- ✅ 核心功能实现（创建/更新状态/排序/到期查询/进度统计）
- ✅ 领域不变量重构（INV-01 ~ INV-05 全部由 Task 实体自保护）
- ✅ 测试覆盖（60 条测试，全部通过）

---

## 技术栈

| 技术 | 用途 |
|------|------|
| **TypeScript** 5.5+ | 开发语言 |
| **Node.js** 20+ | 运行环境 |
| **Vitest** 1.6 | 单元测试框架 |
| **ESLint** | 代码规范检查 |
| **Prettier** | 代码格式化 |

---

## 项目架构

### 四层架构

```
┌──────────────────────────────────────────────────────────┐
│                    interfaces                             │
│              TaskController.ts                           │
│         用户交互 / 输入解析 / 输出展示                      │
│                         │                                 │
│                         ▼                                 │
├──────────────────────────────────────────────────────────┤
│                    application                            │
│         TaskService（接口）                                │
│         DefaultTaskService（实现）                         │
│         用例编排 / 参数解析 / 委托领域层                    │
│                         │                                 │
│                         ▼                                 │
├──────────────────────────────────────────────────────────┤
│                     domain                                │
│    Task（实体）  TaskStatus（枚举）  Priority（枚举）        │
│    ReminderPolicy（值对象）                                │
│         核心业务逻辑 / 不变量守卫 / 自保护实体               │
│                         │                                 │
│                         ▼                                 │
├──────────────────────────────────────────────────────────┤
│                  infrastructure                           │
│              TaskRepository（接口 + 内存实现）              │
│              数据持久化 / 仓储抽象                          │
└──────────────────────────────────────────────────────────┘
```

### 依赖规则

各层严格单向依赖，不允许反向依赖：

```
domain  ←  application  ←  interfaces
domain  ←  infrastructure
```

| 层次 | 职责 | 依赖方向 |
|------|------|---------|
| **domain** | 核心业务实体、枚举、值对象、不变量 | ❌ 不依赖任何层 |
| **application** | 编排业务用例，协调 domain 和 infrastructure | → 依赖 domain |
| **infrastructure** | 数据持久化的具体实现 | → 依赖 domain |
| **interfaces** | 处理用户输入输出 | → 依赖 application |

### 领域不变量

系统定义了 6 条必须始终遵守的业务规则，全部由 **Task 实体**自我守卫：

| 编号 | 规则 | 守卫位置 | 状态 |
|------|------|---------|------|
| INV-01 | 截止日期不能早于创建时间 | `Task` 构造函数 | ✅ |
| INV-02 | 高优先级任务必须设置截止日期 | `Task` 构造函数 | ✅ |
| INV-03 | 任务标题不能为空 | `Task` 构造函数 | ✅ |
| INV-04 | 状态转换必须遵循允许路径（PENDING → IN_PROGRESS → COMPLETED → PENDING） | `Task.updateStatus()` | ✅ |
| INV-05 | 提醒时间不能晚于截止日期 | `Task.setReminderPolicy()` | ✅ |
| INV-06 | 完成率始终在 0% ~ 100% 范围内 | 计算自然保证 | ✅ |

---

## 目录结构

```
studyflow/
│
├── src/                          # 源代码
│   ├── domain/                   # 领域层（核心业务逻辑）
│   │   ├── Task.ts                    任务实体（自保护，含 5 条不变量）
│   │   ├── TaskStatus.ts              状态枚举：PENDING / IN_PROGRESS / COMPLETED
│   │   ├── Priority.ts                优先级枚举：HIGH / MEDIUM / LOW
│   │   ├── ReminderPolicy.ts          提醒策略值对象
│   │   └── index.ts                   统一导出
│   │
│   ├── application/              # 应用层（用例编排）
│   │   ├── TaskService.ts              TaskService 接口定义
│   │   └── DefaultTaskService.ts       接口实现（5 个核心功能）
│   │
│   ├── infrastructure/           # 基础设施层（数据持久化）
│   │   └── TaskRepository.ts          仓储接口 + InMemoryTaskRepository 实现
│   │
│   ├── interfaces/               # 接口层（用户交互）
│   │   └── TaskController.ts          CLI 控制器
│   │
│   └── index.ts                  # 应用入口
│
├── test/                         # 测试
│   ├── domain/
│   │   └── TaskInvariant.test.ts      领域层不变量测试（TP033-TP051，19 条）
│   ├── application/
│   │   └── TaskService.test.ts        Service 层单元测试（TP001-TP032，32 条）
│   └── task.test.ts                   实体 + 集成测试（9 条）
│
├── docs/                         # 实验文档
│   ├── 需求文档.md                    需求分析（10 项功能需求）
│   ├── 领域建模.md                    领域对象与 UML 类图
│   ├── 接口契约说明.md                接口参数与返回类型
│   ├── 测试点清单.md                  全部测试点明细
│   ├── 代码异味分析报告.md            代码质量问题分析
│   ├── 重构方案设计.md                两种重构方案对比
│   ├── 不变量测试覆盖分析.md          测试覆盖缺口分析
│   ├── 补全测试记录.md                领域层测试补全过程
│   ├── 重构实施记录.md                四轮重构过程与结果
│   ├── 重构前后代码对比.md            关键代码差异比较
│   ├── 失败测试与修复记录.md          测试编写中的问题修复
│   └── 提示词记录表.md                AI 提示词使用记录
│
├── package.json
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
└── README.md
```

---

## 模块说明

### domain（领域层）

系统的核心层，不依赖任何外部代码。包含：

- **Task** — 任务实体，拥有唯一标识，封装状态变更和提醒设置等业务行为。**构造函数和执行方法自带 5 条不变量守卫**，非法数据在进入实体时即被拒绝。
- **TaskStatus** — 状态枚举：`PENDING`（待开始）/ `IN_PROGRESS`（进行中）/ `COMPLETED`（已完成）
- **Priority** — 优先级枚举：`HIGH` / `MEDIUM` / `LOW`
- **ReminderPolicy** — 提醒策略值对象，依附于 Task 存在

这一层只关心"业务规则是什么"，不关心数据怎么存、用户怎么操作。

### application（应用层）

编排业务用例的"导演层"。`DefaultTaskService` 实现了 5 个核心功能：

| 功能 | 接口 | 说明 |
|------|------|------|
| 创建任务 | `createTask(input)` | 解析参数 → 委托 Task 构造 → 持久化 |
| 完成任务 | `completeTask(taskId)` | 查任务 → 委托 Task.updateStatus → 持久化 |
| 更新状态 | `updateTaskStatus(taskId, status)` | 查任务 → 委托 Task.updateStatus → 持久化 |
| 排序查询 | `listTasksByPriority(userId)` | 按 HIGH → MEDIUM → LOW 排序 |
| 到期查询 | `listDueTasks(date)` | 返回 deadline ≤ 指定日期的任务 |
| 进度统计 | `getUserProgress(userId)` | 统计 total 和 completed |

Service 层**不包含**业务校验逻辑——所有不变量校验在 Task 实体内部完成。

### infrastructure（基础设施层）

存放具体的技术实现。当前提供：

- **TaskRepository 接口** — 定义持久化契约
- **InMemoryTaskRepository** — 基于 Map 的内存实现，适合开发和测试

后续切换为文件存储或数据库只需新增一个实现类。

### interfaces（接口层）

- **TaskController** — CLI 控制器，接收用户输入、调用 application 层、返回结果

---

## 安装

```bash
# 安装依赖
npm install
```

## 运行

```bash
# 开发模式（ts-node + 热重载）
npm run dev

# 编译构建
npm run build

# 运行编译后的产物
npm start
```

## 测试

```bash
# 运行所有测试（60 条）
npm test

# 监听模式
npm run test:watch

# 带详细名称输出
npx vitest run --reporter verbose

# 只跑领域层不变量测试
npx vitest run test/domain/TaskInvariant.test.ts

# 清除缓存后运行（首次或遇到 "No test suite found" 时）
Remove-Item -Recurse -Force node_modules/.cache; npx vitest run
```

### 测试结构

| 文件 | 范围 | 条数 |
|------|------|------|
| `test/domain/TaskInvariant.test.ts` | Task 实体 5 条不变量直接验证 | 19 |
| `test/application/TaskService.test.ts` | Service 接口 6 个方法单元测试 | 32 |
| `test/task.test.ts` | 实体基础行为 + 核心功能集成测试 | 9 |
| **合计** | | **60** |

## 代码检查

```bash
# ESLint 检查
npm run lint

# Prettier 格式化
npm run format
```

---

## 实验文档

完整实验文档见 `docs/` 目录：

- [需求文档](docs/需求文档.md) — 用户故事、功能需求、非功能需求、验收标准
- [领域建模](docs/领域建模.md) — 领域对象、UML 类图、实体/值对象分类、不变量
- [接口契约说明](docs/接口契约说明.md) — 接口参数与返回类型
- [测试点清单](docs/测试点清单.md) — 全部测试点明细
- [代码异味分析报告](docs/代码异味分析报告.md) — 代码质量问题分析
- [重构方案设计](docs/重构方案设计.md) — 两种重构方案对比
- [不变量测试覆盖分析](docs/不变量测试覆盖分析.md) — 测试覆盖缺口分析
- [补全测试记录](docs/补全测试记录.md) — 领域层测试补全过程
- [重构实施记录](docs/重构实施记录.md) — 四轮重构过程与结果
- [重构前后代码对比](docs/重构前后代码对比.md) — 关键代码差异比较
- [失败测试与修复记录](docs/失败测试与修复记录.md) — 测试编写中的问题修复
- [提示词记录表](docs/提示词记录表.md) — AI 提示词使用记录
