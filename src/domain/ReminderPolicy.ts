/**
 * 提醒策略 —— 值对象
 * 描述任务的提醒规则，依附于 Task 存在。
 */
export class ReminderPolicy {
  constructor(
    public readonly reminderTime: Date,
    public readonly isEnabled: boolean = true,
    public reminded: boolean = false,
  ) {}

  /** 判断当前时间是否到达提醒时刻 */
  shouldRemind(now: Date): boolean {
    return this.isEnabled && !this.reminded && now >= this.reminderTime;
  }

  /** 标记已提醒 */
  markReminded(): void {
    this.reminded = true;
  }
}
