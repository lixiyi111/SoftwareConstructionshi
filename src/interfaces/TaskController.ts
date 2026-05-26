import { TaskService } from '../application/TaskService';

/**
 * 任务控制器 —— 接口层
 * 负责接收用户输入并调用应用服务。
 * 当前为 CLI 方式，后续可扩展为 Web 或其他界面。
 */
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  /** 处理创建任务请求 */
  handleCreateTask(title: string, priority: string, deadline?: string): void {
    // TODO: 解析输入参数，调用 taskService.createTask()
    console.log('[Controller] 创建任务:', title);
  }

  /** 处理列表查询请求 */
  handleListTasks(): void {
    const tasks = this.taskService.getAllTasks();
    console.log('[Controller] 当前任务数:', tasks.length);
  }

  /** 处理完成任务请求 */
  handleCompleteTask(taskId: string): void {
    // TODO: 调用 taskService.completeTask()
    console.log('[Controller] 完成任务:', taskId);
  }
}
