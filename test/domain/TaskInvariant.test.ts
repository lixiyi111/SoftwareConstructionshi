/**
 * Task 领域不变量测试
 *
 * 直接测试 Task 实体的不变量（INV-01 ~ INV-05），
 * 不经过 Service 层，验证领域层自身能否保护自身完整性。
 *
 * 当前阶段"只写测试、不实现逻辑"，因此部分测试预期失败。
 * 这些失败测试精确标识了领域层当前缺失的校验行为。
 */

import { describe, it, expect } from 'vitest';
import { Task } from '../../src/domain/Task';
import { TaskStatus } from '../../src/domain/TaskStatus';
import { Priority } from '../../src/domain/Priority';

// ==============================================================
// 测试辅助
// ==============================================================

const BASE_TIME = new Date('2026-06-07T10:00:00');

/** 创建一个最低有效 Task，可通过 overrides 自定义关键字段 */
function createBaseTask(overrides?: {
  title?: string;
  priority?: Priority;
  deadline?: Date;
  status?: TaskStatus;
  completedAt?: Date;
}): Task {
  return new Task(
    'test-id',
    'user-test',
    overrides?.title ?? '默认任务',
    '',
    overrides?.priority ?? Priority.Medium,
    overrides?.status ?? TaskStatus.Pending,
    BASE_TIME,
    overrides?.deadline,
    undefined, // estimatedMinutes
    undefined, // reminderPolicy
    overrides?.completedAt,
  );
}

// ==============================================================
// INV-01 截止日期不能早于创建时间
// ==============================================================
describe('INV-01 截止日期不能早于创建时间', () => {
  it(
    'TP033 截止日期早于创建时间时应拒绝创建',
    () => {
      const pastDeadline = new Date('2026-06-05');
      // INV-01: deadline >= createdAt
      // 当前 Task 构造函数无校验，此测试预期失败。
      // 重构后应 throw。
      expect(() => createBaseTask({ deadline: pastDeadline })).toThrow();
    },
  );

  it(
    'TP034 截止日期等于创建时间时应允许创建',
    () => {
      const sameDeadline = new Date(BASE_TIME);
      expect(() => createBaseTask({ deadline: sameDeadline })).not.toThrow();
    },
  );

  it(
    'TP035 截止日期晚于创建时间时应允许创建',
    () => {
      const futureDeadline = new Date('2026-06-10');
      expect(() => createBaseTask({ deadline: futureDeadline })).not.toThrow();
    },
  );
});

// ==============================================================
// INV-02 高优先级任务必须设置截止日期
// ==============================================================
describe('INV-02 高优先级任务必须设置截止日期', () => {
  it(
    'TP036 优先级 HIGH 且无截止日期时应拒绝创建',
    () => {
      // INV-02: HIGH 必须有 deadline
      // 当前 Task 构造函数无校验，此测试预期失败。
      // 重构后应 throw。
      expect(() => createBaseTask({ priority: Priority.High, deadline: undefined })).toThrow();
    },
  );

  it(
    'TP037 优先级 HIGH 且有截止日期时应允许创建',
    () => {
      expect(() =>
        createBaseTask({ priority: Priority.High, deadline: new Date('2026-06-10') }),
      ).not.toThrow();
    },
  );

  it(
    'TP038 优先级 MEDIUM 且无截止日期时应允许创建',
    () => {
      expect(() => createBaseTask({ priority: Priority.Medium, deadline: undefined })).not.toThrow();
    },
  );
});

// ==============================================================
// INV-03 任务标题不能为空（领域层直接测试）
// ==============================================================
describe('INV-03 任务标题不能为空', () => {
  it(
    'TP039 标题为空字符串时应拒绝创建',
    () => {
      // INV-03: 标题不能为空
      // 当前 Task 构造函数无校验
      // （现有 TP003 通过 Service 层验证，此测试直接验证 Task 实体）
      expect(() => createBaseTask({ title: '' })).toThrow();
    },
  );

  it(
    'TP040 标题为纯空格时应拒绝创建',
    () => {
      expect(() => createBaseTask({ title: '   ' })).toThrow();
    },
  );

  it(
    'TP041 标题为合法字符串时应允许创建',
    () => {
      expect(() => createBaseTask({ title: '学习 TypeScript' })).not.toThrow();
    },
  );
});

// ==============================================================
// INV-04 状态转换必须遵循允许路径（领域层直接测试）
// ==============================================================
describe('INV-04 状态转换必须遵循允许路径', () => {
  // ── 合法路径 ───────────────────────────────────────────
  describe('合法路径', () => {
    it('TP042 PENDING → IN_PROGRESS 应允许', () => {
      const task = createBaseTask();
      task.updateStatus(TaskStatus.InProgress);
      expect(task.status).toBe(TaskStatus.InProgress);
    });

    it('TP043 IN_PROGRESS → COMPLETED 应允许并记录完成时间', () => {
      const task = createBaseTask({ status: TaskStatus.InProgress });
      task.updateStatus(TaskStatus.Completed);
      expect(task.status).toBe(TaskStatus.Completed);
      expect(task.completedAt).toBeInstanceOf(Date);
    });

    it('TP044 COMPLETED → PENDING 应允许并清空完成时间', () => {
      const task = createBaseTask({
        status: TaskStatus.Completed,
        completedAt: new Date('2026-06-07T12:00:00'),
      });
      task.updateStatus(TaskStatus.Pending);
      expect(task.status).toBe(TaskStatus.Pending);
      expect(task.completedAt).toBeUndefined();
    });
  });

  // ── 非法路径 ───────────────────────────────────────────
  describe('非法路径', () => {
    it(
      'TP045 PENDING → COMPLETED 应拒绝（跳过 IN_PROGRESS）',
      () => {
        const task = createBaseTask();
        // INV-04: 不允许跳转
        // 当前 Task.updateStatus 无校验，此测试预期失败。
        // 重构后应 throw。
        expect(() => task.updateStatus(TaskStatus.Completed)).toThrow();
      },
    );

    it(
      'TP046 IN_PROGRESS → PENDING 应拒绝（不允许回退）',
      () => {
        const task = createBaseTask({ status: TaskStatus.InProgress });
        // 当前 Task.updateStatus 无校验，此测试预期失败。
        expect(() => task.updateStatus(TaskStatus.Pending)).toThrow();
      },
    );

    it(
      'TP047 COMPLETED → IN_PROGRESS 应拒绝（不允许非法跳转）',
      () => {
        const task = createBaseTask({
          status: TaskStatus.Completed,
          completedAt: new Date('2026-06-07T12:00:00'),
        });
        // 当前 Task.updateStatus 无校验，此测试预期失败。
        expect(() => task.updateStatus(TaskStatus.InProgress)).toThrow();
      },
    );
  });
});

// ==============================================================
// INV-05 提醒时间不能晚于任务截止日期
// ==============================================================
describe('INV-05 提醒时间不能晚于任务截止日期', () => {
  it(
    'TP048 提醒时间晚于截止日期时应拒绝设置',
    () => {
      const task = createBaseTask({ deadline: new Date('2026-06-10') });
      const lateReminder = new Date('2026-06-11');
      // INV-05: reminderTime <= deadline
      // 当前 Task.setReminderPolicy 仅留 TODO，无校验，此测试预期失败。
      expect(() => task.setReminderPolicy(lateReminder)).toThrow();
    },
  );

  it('TP049 提醒时间等于截止日期时应允许设置', () => {
    const deadline = new Date('2026-06-10');
    const task = createBaseTask({ deadline });
    expect(() => task.setReminderPolicy(new Date(deadline))).not.toThrow();
  });

  it('TP050 提醒时间早于截止日期时应允许设置', () => {
    const task = createBaseTask({ deadline: new Date('2026-06-10') });
    expect(() => task.setReminderPolicy(new Date('2026-06-08'))).not.toThrow();
  });

  it('TP051 未设截止日期时设置提醒应允许', () => {
    const task = createBaseTask({ deadline: undefined });
    expect(() => task.setReminderPolicy(new Date('2099-12-31'))).not.toThrow();
  });
});

// ==============================================================
// INV-06 学习时长必须为正数
// ==============================================================
describe('INV-06 学习时长必须为正数', () => {
  it('TP052 创建任务后 actualMinutes 默认为 0', () => {
    const task = createBaseTask();
    expect(task.actualMinutes).toBe(0);
  });

  it('TP053 传入正数时应正确累计学习时长', () => {
    const task = createBaseTask();
    task.addStudyTime(30);
    expect(task.actualMinutes).toBe(30);
  });

  it('TP054 多次调用 addStudyTime 应累加', () => {
    const task = createBaseTask();
    task.addStudyTime(30);
    task.addStudyTime(20);
    task.addStudyTime(15);
    expect(task.actualMinutes).toBe(65);
  });

  it('TP055 传入 0 时应拒绝（学习时长必须为正数）', () => {
    const task = createBaseTask();
    expect(() => task.addStudyTime(0)).toThrow('学习时长必须为正数');
    // actualMinutes 应保持不变
    expect(task.actualMinutes).toBe(0);
  });

  it('TP056 传入负数时应拒绝（学习时长必须为正数）', () => {
    const task = createBaseTask();
    expect(() => task.addStudyTime(-10)).toThrow('学习时长必须为正数');
    expect(task.actualMinutes).toBe(0);
  });
});
