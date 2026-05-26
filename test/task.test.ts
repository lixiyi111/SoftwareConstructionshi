import { describe, it, expect } from 'vitest';
import { Task } from '../src/domain/Task';
import { TaskStatus } from '../src/domain/TaskStatus';
import { Priority } from '../src/domain/Priority';

describe('Task 实体', () => {
  it('创建任务时状态应为待开始', () => {
    const task = new Task(
      '1',
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
      '完成实验报告',
      '',
      Priority.High,
      TaskStatus.InProgress,
      new Date(),
    );
    task.updateStatus(TaskStatus.Completed);
    expect(task.status).toBe(TaskStatus.Completed);
    expect(task.completedAt).toBeInstanceOf(Date);
  });
});
