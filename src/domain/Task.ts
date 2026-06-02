import { TaskStatus } from './TaskStatus';
import { Priority } from './Priority';
import { ReminderPolicy } from './ReminderPolicy';

/**
 * 任务 —— 核心实体
 * 代表一条具体的学习任务，包含状态、优先级、提醒等属性。
 */
export class Task {
  constructor(
    public readonly taskId: string,
    public userId: string,
    public title: string,
    public description: string,
    public priority: Priority,
    public status: TaskStatus,
    public readonly createdAt: Date,
    public deadline?: Date,
    public estimatedMinutes?: number,
    public reminderPolicy?: ReminderPolicy,
    public completedAt?: Date,
  ) {}

  /** 更新任务状态 */
  updateStatus(newStatus: TaskStatus): void {
    // TODO: 校验状态转换合法性（参考 INV-04）
    this.status = newStatus;
    if (newStatus === TaskStatus.Completed) {
      this.completedAt = new Date();
    }
  }

  /** 设置提醒策略 */
  setReminderPolicy(reminderTime: Date): void {
    // TODO: 校验提醒时间不晚于截止日期（参考 INV-05）
    this.reminderPolicy = new ReminderPolicy(reminderTime);
  }
}
