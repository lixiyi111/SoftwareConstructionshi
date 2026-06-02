import { InMemoryTaskRepository } from './infrastructure/TaskRepository';
import { DefaultTaskService } from './application/DefaultTaskService';
import { TaskController } from './interfaces/TaskController';

/**
 * 应用入口
 *
 * 演示 5 个核心功能的完整调用流程（&创建任务 / &更新任务状态
 * / &按优先级排序 / &查询到期任务 / &按用户统计任务完成情况）。
 */

const repository = new InMemoryTaskRepository();
const taskService = new DefaultTaskService(repository);
const ctrl = new TaskController(taskService);

const USER_ID = 'student-001';

// ── &创建任务 ────────────────────────────────────────────
ctrl.handleCreateTask({ userId: USER_ID, title: '完成软件构造实验报告', priority: 'HIGH' });
ctrl.handleCreateTask({ userId: USER_ID, title: '复习期末数学', priority: 'MEDIUM', dueDate: new Date('2026-06-15') });
ctrl.handleCreateTask({ userId: USER_ID, title: '背英语单词', priority: 'LOW' });
ctrl.handleCreateTask({ userId: USER_ID, title: '阅读《重构》第一章', priority: 'MEDIUM', dueDate: new Date('2026-06-10') });

// ── &更新任务状态 ──────────────────────────────────────────
ctrl.handleCompleteTask('...');         // 需要替换为真实 ID
ctrl.handleUpdateStatus('...', 'IN_PROGRESS');

// ── &按优先级排序 ──────────────────────────────────────────
ctrl.handleListByPriority(USER_ID);

// ── &查询到期任务 ──────────────────────────────────────────
ctrl.handleListDueTasks(new Date('2026-06-10'));

// ── &按用户统计任务完成情况 ───────────────────────────────────
ctrl.handleShowProgress(USER_ID);

console.log('\n🚀 StudyFlow 学习任务管理系统 v0.1.0 — 5 个核心功能已就绪');
