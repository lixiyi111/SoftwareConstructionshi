import { TaskStatus } from './TaskStatus';
import { Priority } from './Priority';
import { ReminderPolicy } from './ReminderPolicy';

/**
 * 任务 —— 核心实体
 * 代表一条具体的学习任务，包含状态、优先级、提醒、学习时长等属性。
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
    public actualMinutes: number = 0,
  ) {
    // INV-01: 截止日期不能早于创建时间
    if (this.deadline && this.deadline < this.createdAt) {
      throw new Error('截止日期不能早于创建时间');
    }
    // INV-02: 高优先级任务必须设置截止日期
    if (this.priority === Priority.High && !this.deadline) {
      throw new Error('高优先级任务必须设置截止日期');
    }
    // INV-03: 标题不能为空
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('任务标题不能为空');
    }
  }

  /** 更新任务状态 */
  updateStatus(newStatus: TaskStatus): void {
    // INV-04: 状态转换必须遵循允许路径
    const allowed: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.Pending]: [TaskStatus.InProgress],
      [TaskStatus.InProgress]: [TaskStatus.Completed],
      [TaskStatus.Completed]: [TaskStatus.Pending],
    };
    if (!allowed[this.status]?.includes(newStatus)) {
      throw new Error(`不允许的状态转换: ${this.status} → ${newStatus}`);
    }
    this.status = newStatus;
    if (newStatus === TaskStatus.Completed) {
      this.completedAt = new Date();
    } else {
      this.completedAt = undefined;
    }
  }

  /** 设置提醒策略 */
  setReminderPolicy(reminderTime: Date): void {
    // INV-05: 提醒时间不能晚于截止日期
    if (this.deadline && reminderTime > this.deadline) {
      throw new Error('提醒时间不能晚于截止日期');
    }
    this.reminderPolicy = new ReminderPolicy(reminderTime);
  }

  /** 累计学习时长 */
  addStudyTime(minutes: number): void {
    // INV-06: 学习时长必须为正数
    if (minutes <= 0) {
      throw new Error('学习时长必须为正数');
    }
    this.actualMinutes += minutes;
  }
}
