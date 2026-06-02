import { TaskService, CreateTaskCommand } from '../application/TaskService';

/**
 * 任务控制器 —— 接口层
 * 包装 TaskService 的 5 个核心功能，提供 CLI 调用入口。
 */
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  /** &创建任务 */
  handleCreateTask(input: CreateTaskCommand): void {
    const task = this.taskService.createTask(input);
    console.log(`[OK] 任务已创建，ID: ${task.taskId}`);
  }

  /** &更新任务状态 — 标记完成 */
  handleCompleteTask(taskId: string): void {
    const task = this.taskService.completeTask(taskId);
    console.log(`[OK] 任务已完成: ${task.title}`);
  }

  /** &更新任务状态 — 任意状态 */
  handleUpdateStatus(taskId: string, status: string): void {
    const task = this.taskService.updateTaskStatus(taskId, status);
    console.log(`[OK] 状态已更新: ${task.title} → ${task.status}`);
  }

  /** &按优先级排序 */
  handleListByPriority(userId: string): void {
    const tasks = this.taskService.listTasksByPriority(userId);
    if (tasks.length === 0) {
      console.log('[INFO] 暂无任务');
      return;
    }
    console.log('=== 按优先级排序的任务列表 ===');
    for (const t of tasks) {
      console.log(`  [${t.priority}] ${t.title}（${t.status}）`);
    }
  }

  /** &查询到期任务 */
  handleListDueTasks(date: Date): void {
    const tasks = this.taskService.listDueTasks(date);
    if (tasks.length === 0) {
      console.log('[INFO] 没有到期任务');
      return;
    }
    console.log(`=== ${date.toLocaleDateString()} 前到期 ===`);
    for (const t of tasks) {
      console.log(`  ${t.title}（截止: ${t.deadline?.toLocaleDateString()}）`);
    }
  }

  /** &按用户统计任务完成情况 */
  handleShowProgress(userId: string): void {
    const { total, completed } = this.taskService.getUserProgress(userId);
    const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';
    console.log(`用户 ${userId} 的学习进度`);
    console.log(`  总任务: ${total}`);
    console.log(`  已完成: ${completed}`);
    console.log(`  完成率: ${rate}%`);
  }
}
