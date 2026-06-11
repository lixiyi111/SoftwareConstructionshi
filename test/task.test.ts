import { describe, it, expect, beforeEach } from 'vitest';
import { Task } from '../src/domain/Task';
import { TaskStatus } from '../src/domain/TaskStatus';
import { Priority } from '../src/domain/Priority';
import { DefaultTaskService } from '../src/application/DefaultTaskService';
import { InMemoryTaskRepository } from '../src/infrastructure/TaskRepository';
import type { CreateTaskCommand } from '../src/application/TaskService';

// ==============================================================
// Task 实体基础测试
// ==============================================================
describe('Task 实体', () => {
  it('创建任务时状态应为待开始', () => {
    const task = new Task(
      '1',
      'user-001',
      '测试任务',
      '',
      Priority.Medium,
      TaskStatus.Pending,
      new Date(),
    );
    expect(task.status).toBe(TaskStatus.Pending);
  });

  it('完成任务后应记录完成时间', () => {
    const task = new Task(
      '2',
      'user-001',
      '完成实验报告',
      '',
      Priority.Medium,
      TaskStatus.InProgress,
      new Date(),
    );
    task.updateStatus(TaskStatus.Completed);
    expect(task.status).toBe(TaskStatus.Completed);
    expect(task.completedAt).toBeInstanceOf(Date);
  });
});

// ==============================================================
// DefaultTaskService — 5 个核心功能集成测试
// ==============================================================
describe('DefaultTaskService — 5 个核心功能', () => {
  const repo = new InMemoryTaskRepository();
  const service = new DefaultTaskService(repo);
  const USER = 'student-test';

  beforeEach(() => {
    // 清空内存数据
    const all = repo.findAll();
    for (const t of all) repo.delete(t.taskId);
  });

  // ── &创建任务 ────────────────────────────────────────
  describe('&创建任务', () => {
    it('应创建任务并返回 Pendig 状态', () => {
      const cmd: CreateTaskCommand = { userId: USER, title: '测试任务', priority: 'MEDIUM' };
      const task = service.createTask(cmd);
      expect(task.title).toBe('测试任务');
      expect(task.status).toBe(TaskStatus.Pending);
      expect(task.userId).toBe(USER);
      expect(task.taskId).toBeTruthy();
    });

    it('标题为空时应抛出异常', () => {
      const cmd: CreateTaskCommand = { userId: USER, title: '   ', priority: 'LOW' };
      expect(() => service.createTask(cmd)).toThrow('任务标题不能为空');
    });
  });

  // ── &更新任务状态 ────────────────────────────────────
  describe('&更新任务状态', () => {
    it('应完成任务并将状态置为 Completed', () => {
      const cmd: CreateTaskCommand = { userId: USER, title: '可完成的任务', priority: 'MEDIUM' };
      const t = service.createTask(cmd);
      service.updateTaskStatus(t.taskId, 'IN_PROGRESS');  // PENDING → IN_PROGRESS
      const done = service.completeTask(t.taskId);          // IN_PROGRESS → COMPLETED
      expect(done.status).toBe(TaskStatus.Completed);
      expect(done.completedAt).toBeInstanceOf(Date);
    });

    it('应拒绝非法状态转换（PENDING → COMPLETED）', () => {
      const cmd: CreateTaskCommand = { userId: USER, title: '测试跳转', priority: 'LOW' };
      const t = service.createTask(cmd);
      expect(() => service.updateTaskStatus(t.taskId, 'COMPLETED')).toThrow('不允许的状态转换');
    });
  });

  // ── &按优先级排序 ────────────────────────────────────
  describe('&按优先级排序', () => {
    it('应按 高→中→低 顺序返回任务', () => {
      const u = 'sort-user';
      service.createTask({ userId: u, title: '低优先级', priority: 'LOW' });
      service.createTask({ userId: u, title: '高优先级', priority: 'HIGH', dueDate: new Date('2026-06-10') });
      service.createTask({ userId: u, title: '中优先级', priority: 'MEDIUM' });
      const sorted = service.listTasksByPriority(u);
      expect(sorted[0].priority).toBe(Priority.High);
      expect(sorted[1].priority).toBe(Priority.Medium);
      expect(sorted[2].priority).toBe(Priority.Low);
    });
  });

  // ── &查询到期任务 ────────────────────────────────────
  describe('&查询到期任务', () => {
    it('应返回截止日期在指定日期之前的任务', () => {
      const u = 'due-user';
      service.createTask({ userId: u, title: '已到期', priority: 'HIGH', dueDate: new Date('2026-06-08') });
      service.createTask({ userId: u, title: '未到期', priority: 'LOW', dueDate: new Date('2026-07-01') });
      const due = service.listDueTasks(new Date('2026-06-10'));
      expect(due.some((t) => t.title === '已到期')).toBe(true);
      expect(due.some((t) => t.title === '未到期')).toBe(false);
    });
  });

  // ── &按用户统计任务完成情况 ────────────────────────────
  describe('&按用户统计任务完成情况', () => {
    it('应正确统计总任务数和已完成数', () => {
      const u = 'stats-user';
      const t1 = service.createTask({ userId: u, title: '作业 A', priority: 'MEDIUM' });
      service.createTask({ userId: u, title: '作业 B', priority: 'MEDIUM' });
      const t3 = service.createTask({ userId: u, title: '作业 C', priority: 'LOW' });
      service.updateTaskStatus(t1.taskId, 'IN_PROGRESS');
      service.completeTask(t1.taskId);  // COMPLETED
      service.updateTaskStatus(t3.taskId, 'IN_PROGRESS');
      service.completeTask(t3.taskId);  // COMPLETED
      const stats = service.getUserProgress(u);
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(2);
    });
  });
});
