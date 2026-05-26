import { Task } from '../domain/Task';

/**
 * 应用服务 —— 任务用例编排
 * 负责协调领域对象完成具体的业务场景。
 */
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
  ) {}

  /** 创建新任务 */
  createTask(title: string, priority: Priority, deadline?: Date): Task {
    // TODO: 实现任务创建逻辑
    throw new Error('Not implemented');
  }

  /** 完成任务 */
  completeTask(taskId: string): Task {
    // TODO: 实现状态变更逻辑
    throw new Error('Not implemented');
  }

  /** 获取所有任务 */
  getAllTasks(): Task[] {
    return this.taskRepository.findAll();
  }
}

// 避免循环依赖的类型导入
import { TaskRepository } from '../infrastructure/TaskRepository';
import { Priority } from '../domain/Priority';
