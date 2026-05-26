# StudyFlow 学习任务管理系统

> 软件构造课程实验项目  
> 实现一个面向学生个人使用的学习任务管理系统

## 项目简介

StudyFlow 是一个面向学生个人的学习任务管理工具，核心场景是帮助学生规划和管理自己的学习任务。

当前阶段已完成：
- ✅ 需求分析与领域建模
- ✅ 项目骨架搭建与分层架构设计

后续迭代将逐步实现完整的业务功能。

## 技术栈

| 技术 | 用途 |
|------|------|
| **TypeScript** 5.5+ | 开发语言 |
| **Node.js** 20+ | 运行环境 |
| **Vitest** | 单元测试框架 |
| **ESLint** | 代码规范检查 |
| **Prettier** | 代码格式化 |

## 项目架构

### 四层架构

```
┌─────────────────────────────────────────────────────┐
│                   interfaces                        │
│              TaskController.ts                      │
│              用户交互 / 输入输出                       │
│                         │                            │
│                         ▼                            │
│─────────────────────────────────────────────────────│
│                   application                       │
│              TaskService.ts                          │
│              用例编排 / 业务场景调度                   │
│                         │                            │
│                         ▼                            │
│─────────────────────────────────────────────────────│
│                    domain                            │
│    Task.ts  TaskStatus.ts  Priority.ts               │
│    ReminderPolicy.ts                                 │
│    核心业务实体 / 枚举 / 规则 / 不变量                 │
│                         │                            │
│─────────────────────────────────────────────────────│
│                 infrastructure                       │
│              TaskRepository.ts                       │
│              数据持久化实现                            │
└─────────────────────────────────────────────────────┘
```

### 依赖规则

各层严格单向依赖，**不允许反向依赖**：

| 层次 | 职责 | 依赖方向 |
|------|------|---------|
| **domain** | 核心业务实体、枚举、值对象、不变量 | ❌ 不依赖任何层 |
| **application** | 编排业务用例，协调 domain 和 infrastructure | → 依赖 domain |
| **infrastructure** | 数据持久化的具体实现 | → 依赖 domain |
| **interfaces** | 处理用户输入输出 | → 依赖 application |

```
domain  ←  application  ←  interfaces
domain  ←  infrastructure
```

## 目录结构

```
studyflow/
│
├── src/                        # 源代码
│   ├── domain/                 # 领域层
│   │   ├── Task.ts                 任务实体
│   │   ├── TaskStatus.ts           状态枚举
│   │   ├── Priority.ts             优先级枚举
│   │   ├── ReminderPolicy.ts       提醒策略值对象
│   │   └── index.ts                统一导出
│   │
│   ├── application/            # 应用层
│   │   └── TaskService.ts          任务应用服务
│   │
│   ├── infrastructure/         # 基础设施层
│   │   └── TaskRepository.ts       仓储接口 + 内存实现
│   │
│   ├── interfaces/             # 接口层
│   │   └── TaskController.ts       控制器
│   │
│   └── index.ts                    应用入口
│
├── test/                       # 单元测试
│   └── task.test.ts                任务实体测试
│
├── docs/                       # 文档
│   ├── 需求文档.md                 需求分析
│   └── 领域建模.md                 领域模型 + 类图
│
├── package.json
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
└── README.md
```

## 模块说明

### domain（领域层）

系统的核心层，不依赖任何外部代码。包含：

- **Task** — 任务实体，拥有唯一标识，封装状态变更和提醒设置等业务行为
- **TaskStatus** — 状态枚举：待开始 / 进行中 / 已完成
- **Priority** — 优先级枚举：高 / 中 / 低
- **ReminderPolicy** — 提醒策略值对象，依附于 Task 存在

这一层只关心"业务规则是什么"，不关心数据怎么存、用户怎么操作。

### application（应用层）

编排业务用例的"导演层"。TaskService 负责将领域对象组合起来完成具体的业务场景，比如"创建任务"这个用例涉及：参数校验 → 构造 Task 对象 → 调用仓储保存。

这一层**不包含**具体的业务逻辑，只是协调各层工作。

### infrastructure（基础设施层）

存放具体的技术实现。当前提供：

- **TaskRepository 接口** — 定义持久化契约
- **InMemoryTaskRepository** — 基于 Map 的内存实现，适合开发和测试

后续如果需要切换为文件存储或数据库，只需新增一个实现类即可，domain 和 application 层完全不需要改动。

### interfaces（接口层）

与用户打交道的边界。当前为简单的 CLI 控制器，接收用户输入、调用 application 层、返回结果给用户。

这一层同样**不包含**业务逻辑，只做输入解析和输出展示。

## 安装

```bash
# 克隆项目后进入目录，安装依赖
npm install
```

## 运行

```bash
# 开发模式（热重载，代码修改后自动重启）
npm run dev

# 编译构建
npm run build

# 运行编译后的产物
npm start
```

## 测试

```bash
# 运行所有测试（单次）
npm test

# 监听模式（文件变化自动重新运行）
npm run test:watch
```

## 代码检查

```bash
# ESLint 检查
npm run lint

# Prettier 格式化
npm run format
```

## 需求与领域模型

详细的需求分析和领域模型文档见 `docs/` 目录：

- [docs/需求文档.md](docs/需求文档.md) — 用户故事、功能需求、非功能需求、验收标准
- [docs/领域建模.md](docs/领域建模.md) — 领域对象、UML 类图、实体/值对象分类、不变量
