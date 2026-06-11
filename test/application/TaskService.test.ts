/**
 * TaskService 接口单元测试
 *
 * 基于 docs/测试点清单.md 中确认的 32 个测试点，
 * 覆盖 createTask / completeTask / updateTaskStatus
 * / listTasksByPriority / listDueTasks / getUserProgress 六个接口。
 *
 * 测试风格：Arrange → Act → Assert
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { DefaultTaskService } from '../../src/application/DefaultTaskService';
import { InMemoryTaskRepository } from '../../src/infrastructure/TaskRepository';
import { TaskStatus } from '../../src/domain/TaskStatus';
import { Priority } from '../../src/domain/Priority';
import type { CreateTaskCommand } from '../../src/application/TaskService';
import { Task } from '../../src/domain/Task';

// ============================================================
// 冻结系统时间，消除所有测试的时间依赖
// ============================================================
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01'));
});

afterAll(() => {
  vi.useRealTimers();
});

// ============================================================
// 测试辅助：每次创建新的仓储实例，隔离测试数据
// ============================================================
function createFixture() {
  const repo = new InMemoryTaskRepository();
  const service = new DefaultTaskService(repo);
  return { repo, service };
}

/** 便捷构建 CreateTaskCommand */
function cmd(overrides: Partial<CreateTaskCommand> & { title: string }): CreateTaskCommand {
  return { userId: 'user-test', priority: 'MEDIUM', description: '', ...overrides };
}

/** 创建一个 PENDING 任务并返回 */
function createPending(
  service: DefaultTaskService,
  overrides: Partial<CreateTaskCommand> = {},
): Task {
  return service.createTask(
    cmd({ userId: 'user-test', title: '默认测试任务', ...overrides }),
  );
}

/** 创建一个 IN_PROGRESS 任务并返回 */
function createInProgress(service: DefaultTaskService): Task {
  const task = createPending(service);
  service.updateTaskStatus(task.taskId, 'IN_PROGRESS');
  return task;
}

// ============================================================
// createTask — 7 个测试点
// ============================================================
describe('createTask', () => {
  // ── 正常路径 ─────────────────────────────────────────
  describe('正常路径', () => {
    it('TP001 传入合法参数应创建任务，状态为 PENDING，taskId 不为空', () => {
      // Arrange
      const { service } = createFixture();
      const input: CreateTaskCommand = {
        userId: 'u1',
        title: '学 TypeScript',
        priority: 'MEDIUM',
      };

      // Act
      const task = service.createTask(input);

      // Assert
      expect(task).toBeInstanceOf(Task);
      expect(task.taskId).toBeTruthy();
      expect(task.status).toBe(TaskStatus.Pending);
      expect(task.title).toBe('学 TypeScript');
      expect(task.userId).toBe('u1');
    });

    it('TP002 传入全部可选字段应正确设置 description 和 deadline', () => {
      // Arrange
      const { service } = createFixture();
      const input: CreateTaskCommand = {
        userId: 'u1',
        title: '完成实验',
        description: '第三章全部习题',
        priority: 'HIGH',
        dueDate: new Date('2026-06-15'),
      };

      // Act
      const task = service.createTask(input);

      // Assert
      expect(task.description).toBe('第三章全部习题');
      expect(task.deadline).toEqual(new Date('2026-06-15'));
    });
  });

  // ── 异常路径 ─────────────────────────────────────────
  describe('异常路径', () => {
    it('TP003 标题为空字符串时应抛出"任务标题不能为空"', () => {
      const { service } = createFixture();
      expect(() => service.createTask(cmd({ title: '' }))).toThrow('任务标题不能为空');
    });

    it('TP004 priority 传入非法值时应抛出"无效优先级"', () => {
      const { service } = createFixture();
      expect(() =>
        service.createTask(cmd({ title: 'test', priority: 'URGENT' })),
      ).toThrow(/无效优先级/);
    });
  });

  // ── 边界条件 ─────────────────────────────────────────
  describe('边界条件', () => {
    it('TP005 标题为纯空格时应抛出异常', () => {
      const { service } = createFixture();
      expect(() => service.createTask(cmd({ title: '   ' }))).toThrow('任务标题不能为空');
    });

    it('TP006 description 未传入时默认为空字符串', () => {
      const { service } = createFixture();
      const { description, ...rest } = cmd({ title: 'test' });
      const task = service.createTask(rest as CreateTaskCommand);
      expect(task.description).toBe('');
    });

    it('TP007 标题长度为 500 时应正常创建不截断', () => {
      const { service } = createFixture();
      const longTitle = 'x'.repeat(500);
      const task = service.createTask(cmd({ title: longTitle }));
      expect(task.title.length).toBe(500);
    });
  });
});

// ============================================================
// completeTask — 4 个测试点
// ============================================================
describe('completeTask', () => {
  // ── 正常路径 ─────────────────────────────────────────
  describe('正常路径', () => {
    it('TP008 IN_PROGRESS → COMPLETED，应记录 completedAt', () => {
      const { service } = createFixture();
      const task = createInProgress(service);

      const done = service.completeTask(task.taskId);

      expect(done.status).toBe(TaskStatus.Completed);
      expect(done.completedAt).toBeInstanceOf(Date);
    });
  });

  // ── 异常路径 ─────────────────────────────────────────
  describe('异常路径', () => {
    it('TP009 传入不存在的 taskId 时应抛出"任务不存在"', () => {
      const { service } = createFixture();
      expect(() => service.completeTask('not-exist')).toThrow(/任务不存在/);
    });
  });

  // ── 边界条件 ─────────────────────────────────────────
  describe('边界条件', () => {
    it('TP010 COMPLETED 状态下再次 completeTask 应拒绝', () => {
      const { service } = createFixture();
      const task = createInProgress(service);
      service.completeTask(task.taskId);

      expect(() => service.completeTask(task.taskId)).toThrow(/不允许的状态转换/);
    });

    it('TP011 PENDING 状态下直接 completeTask（跳过 IN_PROGRESS）应拒绝', () => {
      const { service } = createFixture();
      const task = createPending(service);

      expect(() => service.completeTask(task.taskId)).toThrow(/不允许的状态转换/);
    });
  });
});

// ============================================================
// updateTaskStatus — 6 个测试点
// ============================================================
describe('updateTaskStatus', () => {
  // ── 正常路径 ─────────────────────────────────────────
  describe('正常路径', () => {
    it('TP012 PENDING → IN_PROGRESS 状态更新成功', () => {
      const { service } = createFixture();
      const task = createPending(service);

      const updated = service.updateTaskStatus(task.taskId, 'IN_PROGRESS');

      expect(updated.status).toBe(TaskStatus.InProgress);
    });

    it('TP013 COMPLETED → PENDING（重置），completedAt 应清空', () => {
      const { service } = createFixture();
      const task = createInProgress(service);
      service.completeTask(task.taskId);

      const reset = service.updateTaskStatus(task.taskId, 'PENDING');

      expect(reset.status).toBe(TaskStatus.Pending);
      // 重置后 completedAt 应还原为 undefined
      expect(reset.completedAt).toBeUndefined();
    });
  });

  // ── 异常路径 ─────────────────────────────────────────
  describe('异常路径', () => {
    it('TP014 传入非法 status 字符串时应抛出"无效状态"', () => {
      const { service } = createFixture();
      const task = createPending(service);

      expect(() => service.updateTaskStatus(task.taskId, 'DONE')).toThrow(/无效状态/);
    });

    it('TP015 PENDING → COMPLETED（非法跳转）应抛出异常', () => {
      const { service } = createFixture();
      const task = createPending(service);

      expect(() => service.updateTaskStatus(task.taskId, 'COMPLETED')).toThrow(
        /不允许的状态转换/,
      );
    });

    it('TP016 COMPLETED → IN_PROGRESS（非法跳转）应抛出异常', () => {
      const { service } = createFixture();
      const task = createInProgress(service);
      service.completeTask(task.taskId);

      expect(() => service.updateTaskStatus(task.taskId, 'IN_PROGRESS')).toThrow(
        /不允许的状态转换/,
      );
    });
  });

  // ── 边界条件 ─────────────────────────────────────────
  describe('边界条件', () => {
    it('TP017 IN_PROGRESS → IN_PROGRESS 相同状态', () => {
      const { service } = createFixture();
      const task = createInProgress(service);

      // 当前实现未将 same-status 列入白名单，预期拒绝
      expect(() => service.updateTaskStatus(task.taskId, 'IN_PROGRESS')).toThrow(
        /不允许的状态转换/,
      );
    });
  });
});

// ============================================================
// listTasksByPriority — 5 个测试点
// ============================================================
describe('listTasksByPriority', () => {
  const USER = 'sort-user';

  function createThreeTasks(service: DefaultTaskService): void {
    service.createTask(cmd({ userId: USER, title: '低', priority: 'LOW' }));
    service.createTask(cmd({ userId: USER, title: '高', priority: 'HIGH', dueDate: new Date('2026-07-01') }));
    service.createTask(cmd({ userId: USER, title: '中', priority: 'MEDIUM' }));
  }

  // ── 正常路径 ─────────────────────────────────────────
  describe('正常路径', () => {
    it('TP018 返回按 HIGH → MEDIUM → LOW 排序的数组', () => {
      const { service } = createFixture();
      createThreeTasks(service);

      const result = service.listTasksByPriority(USER);

      expect(result[0].priority).toBe(Priority.High);
      expect(result[1].priority).toBe(Priority.Medium);
      expect(result[2].priority).toBe(Priority.Low);
    });

    it('TP019 同一优先级按入库顺序排列', () => {
      const { service } = createFixture();
      service.createTask(cmd({ userId: USER, title: 'A', priority: 'HIGH', dueDate: new Date('2026-07-10') }));
      service.createTask(cmd({ userId: USER, title: 'B', priority: 'HIGH', dueDate: new Date('2026-07-10') }));
      service.createTask(cmd({ userId: USER, title: 'C', priority: 'HIGH', dueDate: new Date('2026-07-10') }));

      const result = service.listTasksByPriority(USER);

      expect(result[0].title).toBe('A');
      expect(result[1].title).toBe('B');
      expect(result[2].title).toBe('C');
    });
  });

  // ── 边界条件 ─────────────────────────────────────────
  describe('边界条件', () => {
    it('TP020 用户无任何任务时返回空数组', () => {
      const { service } = createFixture();
      expect(service.listTasksByPriority('empty-user')).toEqual([]);
    });

    it('TP021 传入空字符串 userId 返回空数组', () => {
      const { service } = createFixture();
      createThreeTasks(service);
      expect(service.listTasksByPriority('')).toEqual([]);
    });

    it('TP022 同一优先级的多个任务排序稳定', () => {
      const { service } = createFixture();
      service.createTask(cmd({ userId: USER, title: '首', priority: 'LOW' }));
      service.createTask(cmd({ userId: USER, title: '次', priority: 'LOW' }));
      service.createTask(cmd({ userId: USER, title: '末', priority: 'LOW' }));

      const result = service.listTasksByPriority(USER);

      expect(result[0].title).toBe('首');
      expect(result[1].title).toBe('次');
      expect(result[2].title).toBe('末');
    });
  });
});

// ============================================================
// listDueTasks — 5 个测试点
// ============================================================
describe('listDueTasks', () => {
  const USER = 'due-user';

  /** 创建三个不同截止日期的任务 */
  function createMixedTasks(service: DefaultTaskService): void {
    service.createTask(cmd({ userId: USER, title: '已到期7月8', priority: 'HIGH', dueDate: new Date('2026-07-08') }));
    service.createTask(cmd({ userId: USER, title: '当日7月10', priority: 'MEDIUM', dueDate: new Date('2026-07-10') }));
    service.createTask(cmd({ userId: USER, title: '未来7月15', priority: 'LOW', dueDate: new Date('2026-07-15') }));
  }

  // ── 正常路径 ─────────────────────────────────────────
  describe('正常路径', () => {
    it('TP023 返回 deadline <= 指定日期的任务（含当日）', () => {
      const { service } = createFixture();
      createMixedTasks(service);

      const due = service.listDueTasks(new Date('2026-07-10'));

      expect(due).toHaveLength(2);
      expect(due.map((t) => t.title)).toEqual(
        expect.arrayContaining(['已到期7月8', '当日7月10']),
      );
    });
  });

  // ── 边界条件 ─────────────────────────────────────────
  describe('边界条件', () => {
    it('TP024 无到期任务时返回空数组', () => {
      const { service } = createFixture();
      service.createTask(cmd({ userId: USER, title: '未来任务', priority: 'LOW', dueDate: new Date('2026-12-31') }));

      expect(service.listDueTasks(new Date('2026-06-01'))).toEqual([]);
    });

    it('TP025 未设置 deadline 的任务不包含在结果中', () => {
      const { service } = createFixture();
      service.createTask(cmd({ userId: USER, title: '无截止日', priority: 'LOW' }));

      const result = service.listDueTasks(new Date('2099-12-31'));

      expect(result).toEqual([]);
    });

    it('TP026 截止日期等于指定日期当天的任务应被包含', () => {
      const { service } = createFixture();
      const today = new Date('2026-07-10');
      service.createTask(cmd({ userId: USER, title: '刚好今天', priority: 'HIGH', dueDate: today }));

      const result = service.listDueTasks(today);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('刚好今天');
    });

    it('TP027 多条任务同一天到期应全部返回', () => {
      const { service } = createFixture();
      service.createTask(cmd({ userId: USER, title: '到期A', priority: 'HIGH', dueDate: new Date('2026-07-10') }));
      service.createTask(cmd({ userId: USER, title: '到期B', priority: 'MEDIUM', dueDate: new Date('2026-07-10') }));
      service.createTask(cmd({ userId: USER, title: '到期C', priority: 'LOW', dueDate: new Date('2026-07-10') }));

      const result = service.listDueTasks(new Date('2026-07-10'));

      expect(result).toHaveLength(3);
    });
  });
});

// ============================================================
// getUserProgress — 5 个测试点
// ============================================================
describe('getUserProgress', () => {
  const USER = 'stats-user';
  const OTHER = 'other-user';

  /** 创建 5 个任务：3 COMPLETED + 1 IN_PROGRESS + 1 PENDING */
  function createMixedProgress(service: DefaultTaskService): void {
    const t1 = service.createTask(cmd({ userId: USER, title: '作业A', priority: 'HIGH', dueDate: new Date('2026-07-10') }));
    const t2 = service.createTask(cmd({ userId: USER, title: '作业B', priority: 'MEDIUM' }));
    const t3 = service.createTask(cmd({ userId: USER, title: '作业C', priority: 'LOW' }));
    service.createTask(cmd({ userId: USER, title: '作业D', priority: 'HIGH', dueDate: new Date('2026-07-10') }));
    service.createTask(cmd({ userId: USER, title: '作业E', priority: 'MEDIUM' }));
    // 完成 3 个
    for (const t of [t1, t2, t3]) {
      service.updateTaskStatus(t.taskId, 'IN_PROGRESS');
      service.completeTask(t.taskId);
    }
  }

  // ── 正常路径 ─────────────────────────────────────────
  describe('正常路径', () => {
    it('TP028 返回正确的 total 和 completed', () => {
      const { service } = createFixture();
      createMixedProgress(service);

      const stats = service.getUserProgress(USER);

      expect(stats.total).toBe(5);
      expect(stats.completed).toBe(3);
    });
  });

  // ── 边界条件 ─────────────────────────────────────────
  describe('边界条件', () => {
    it('TP029 用户无任务时返回 { total: 0, completed: 0 }', () => {
      const { service } = createFixture();
      expect(service.getUserProgress('no-task-user')).toEqual({ total: 0, completed: 0 });
    });

    it('TP030 所有任务均为 COMPLETED', () => {
      const { service } = createFixture();
      const t1 = service.createTask(cmd({ userId: USER, title: '完成1', priority: 'HIGH', dueDate: new Date('2026-07-10') }));
      const t2 = service.createTask(cmd({ userId: USER, title: '完成2', priority: 'LOW' }));
      for (const t of [t1, t2]) {
        service.updateTaskStatus(t.taskId, 'IN_PROGRESS');
        service.completeTask(t.taskId);
      }

      const stats = service.getUserProgress(USER);

      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(2);
    });

    it('TP031 有任务但无一个 COMPLETED', () => {
      const { service } = createFixture();
      service.createTask(cmd({ userId: USER, title: '未开始1', priority: 'MEDIUM' }));
      service.createTask(cmd({ userId: USER, title: '未开始2', priority: 'MEDIUM' }));
      service.createTask(cmd({ userId: USER, title: '未开始3', priority: 'LOW' }));

      const stats = service.getUserProgress(USER);

      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(0);
    });

    it('TP032 其他用户的任务不计入当前用户统计', () => {
      const { service } = createFixture();
      // 当前用户 1 个
      service.createTask(cmd({ userId: USER, title: '我的任务', priority: 'MEDIUM' }));
      // 其他用户 3 个
      service.createTask(cmd({ userId: OTHER, title: '别人的1', priority: 'MEDIUM' }));
      service.createTask(cmd({ userId: OTHER, title: '别人的2', priority: 'MEDIUM' }));
      service.createTask(cmd({ userId: OTHER, title: '别人的3', priority: 'LOW' }));

      const stats = service.getUserProgress(USER);

      expect(stats.total).toBe(1);
    });
  });
});

// ============================================================
// recordStudyTime — 5 个测试点
// ============================================================
describe('recordStudyTime', () => {
  // ── 正常路径 ─────────────────────────────────────────
  describe('正常路径', () => {
    it('TP033 正常记录学习时长应累加到 actualMinutes', () => {
      const { service } = createFixture();
      const task = createPending(service);

      const updated = service.recordStudyTime(task.taskId, 30);

      expect(updated.actualMinutes).toBe(30);
    });

    it('TP034 多次记录学习时长应正确累加', () => {
      const { service } = createFixture();
      const task = createPending(service);

      service.recordStudyTime(task.taskId, 30);
      service.recordStudyTime(task.taskId, 20);
      const updated = service.recordStudyTime(task.taskId, 15);

      expect(updated.actualMinutes).toBe(65);
    });
  });

  // ── 异常路径 ─────────────────────────────────────────
  describe('异常路径', () => {
    it('TP035 minutes 为 0 时应抛出异常', () => {
      const { service } = createFixture();
      const task = createPending(service);

      expect(() => service.recordStudyTime(task.taskId, 0)).toThrow('学习时长必须为正数');
      // actualMinutes 应保持不变（对象引用未变，addStudyTime 未被调用）
      expect(task.actualMinutes).toBe(0);
    });

    it('TP036 minutes 为负数时应抛出异常', () => {
      const { service } = createFixture();
      const task = createPending(service);

      expect(() => service.recordStudyTime(task.taskId, -10)).toThrow('学习时长必须为正数');
      expect(task.actualMinutes).toBe(0);
    });

    it('TP037 不存在的 taskId 应抛出"任务不存在"', () => {
      const { service } = createFixture();

      expect(() => service.recordStudyTime('not-exist', 30)).toThrow(/任务不存在/);
    });
  });
});

// ============================================================
// getStudyStatistics — 6 个测试点
// ============================================================
describe('getStudyStatistics', () => {
  const USER = 'stat-user';
  const OTHER = 'other-user';

  // ── 边界条件 ─────────────────────────────────────────
  describe('边界条件', () => {
    it('TP038 无任务用户返回全 0', () => {
      const { service } = createFixture();

      const stats = service.getStudyStatistics('no-task-user');

      expect(stats).toEqual({
        totalMinutes: 0,
        completedTaskMinutes: 0,
        averageMinutesPerTask: 0,
      });
    });

    it('TP042 学习时长为 0 的任务应正确统计', () => {
      const { service } = createFixture();
      // 创建任务但未记录学习时长（actualMinutes = 0）
      service.createTask(cmd({ userId: USER, title: '零时长任务', priority: 'MEDIUM' }));

      const stats = service.getStudyStatistics(USER);

      expect(stats.totalMinutes).toBe(0);
      expect(stats.completedTaskMinutes).toBe(0);
      expect(stats.averageMinutesPerTask).toBe(0);
    });
  });

  // ── 正常路径 ─────────────────────────────────────────
  describe('正常路径', () => {
    it('TP039 单任务统计正确', () => {
      const { service } = createFixture();
      const task = service.createTask(cmd({ userId: USER, title: '单任务', priority: 'MEDIUM' }));
      service.recordStudyTime(task.taskId, 45);

      const stats = service.getStudyStatistics(USER);

      expect(stats.totalMinutes).toBe(45);
      expect(stats.completedTaskMinutes).toBe(0); // 未完成
      expect(stats.averageMinutesPerTask).toBe(45);
    });

    it('TP040 多任务累计统计正确', () => {
      const { service } = createFixture();
      const t1 = service.createTask(cmd({ userId: USER, title: '任务1', priority: 'LOW' }));
      const t2 = service.createTask(cmd({ userId: USER, title: '任务2', priority: 'MEDIUM' }));
      const t3 = service.createTask(cmd({ userId: USER, title: '任务3', priority: 'LOW' }));
      service.recordStudyTime(t1.taskId, 30);
      service.recordStudyTime(t2.taskId, 60);
      service.recordStudyTime(t3.taskId, 90);

      const stats = service.getStudyStatistics(USER);

      expect(stats.totalMinutes).toBe(180);          // 30 + 60 + 90
      expect(stats.averageMinutesPerTask).toBe(60);   // 180 / 3
    });

    it('TP041 已完成/未完成任务混合统计', () => {
      const { service } = createFixture();
      const completed = service.createTask(cmd({ userId: USER, title: '已完成', priority: 'MEDIUM' }));
      const pending = service.createTask(cmd({ userId: USER, title: '未完成', priority: 'LOW' }));

      // 两个任务都记录学习时长
      service.recordStudyTime(completed.taskId, 60);
      service.recordStudyTime(pending.taskId, 30);
      // 完成其中一个
      service.updateTaskStatus(completed.taskId, 'IN_PROGRESS');
      service.completeTask(completed.taskId);

      const stats = service.getStudyStatistics(USER);

      expect(stats.totalMinutes).toBe(90);                // 60 + 30
      expect(stats.completedTaskMinutes).toBe(60);         // 只算已完成的
      expect(stats.averageMinutesPerTask).toBe(45);        // 90 / 2
    });

    it('TP043 不同用户学习时长互不干扰', () => {
      const { service } = createFixture();
      const myTask = service.createTask(cmd({ userId: USER, title: '我的', priority: 'MEDIUM' }));
      const otherTask = service.createTask(cmd({ userId: OTHER, title: '别人的', priority: 'MEDIUM' }));
      service.recordStudyTime(myTask.taskId, 100);
      service.recordStudyTime(otherTask.taskId, 999);

      const stats = service.getStudyStatistics(USER);

      expect(stats.totalMinutes).toBe(100);
      expect(stats.averageMinutesPerTask).toBe(100);
    });
  });
});
