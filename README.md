# StudyFlow 学习任务管理系统

软件构造课程实验项目。

一个面向学生个人使用的学习任务管理系统，支持创建任务、设置优先级、状态跟踪、提醒和统计。

## 技术栈

- **TypeScript** 5.5+
- **Node.js** 20+
- **Vitest** 单元测试
- **ESLint** 代码检查
- **Prettier** 代码格式化

## 项目结构

```
src/
├── domain/           # 领域层 —— 核心业务实体和规则
│   ├── Task.ts          任务实体
│   ├── TaskStatus.ts    任务状态枚举
│   ├── Priority.ts      优先级枚举
│   └── ReminderPolicy.ts  提醒策略值对象
├── application/      # 应用层 —— 用例编排
│   └── TaskService.ts   任务应用服务
├── infrastructure/   # 基础设施层 —— 数据持久化
│   └── TaskRepository.ts  仓储接口 + 内存实现
├── interfaces/       # 接口层 —— 用户交互
│   └── TaskController.ts  控制器
└── index.ts          # 应用入口

test/
└── task.test.ts      # 任务实体单元测试

docs/
├── 需求文档.md       # 需求分析
└── 领域建模.md       # 领域模型
```

### 分层说明

| 层 | 职责 | 依赖方向 |
|----|------|---------|
| domain | 业务实体、枚举、不变量 | 不依赖任何层 |
| application | 用例编排、业务场景调度 | 依赖 domain |
| infrastructure | 数据持久化实现 | 依赖 domain |
| interfaces | 用户输入输出处理 | 依赖 application |

## 安装

```bash
npm install
```

## 运行

```bash
# 开发模式（热重载）
npm run dev

# 构建
npm run build

# 运行
npm start
```

## 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch
```

## 代码检查

```bash
npm run lint
npm run format
```

## 模块职责

- **domain** — 定义 Task、Priority、TaskStatus、ReminderPolicy 等核心业务概念，封装业务规则（如状态转换约束）。
- **application** — 编排业务用例，协调 domain 和 infrastructure。不包含具体业务逻辑，只负责"叫谁干活"。
- **infrastructure** — 提供数据持久化能力，当前为 InMemoryRepository，后续可替换为文件或数据库实现。
- **interfaces** — 处理用户交互，接收输入、展示输出。不包含业务逻辑。
