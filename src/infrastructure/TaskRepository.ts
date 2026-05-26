import { Task } from '../domain/Task';

/**
 * 任务仓储接口
 * 定义任务持久化的契约，具体实现可替换。
 */
export interface TaskRepository {
  save(task: Task): void;
  findById(taskId: string): Task | undefined;
  findAll(): Task[];
  delete(taskId: string): void;
}

/**
 * 内存任务仓储 —— 基础设施层实现
 * 数据存储在内存中，适合开发和测试阶段使用。
 */
export class InMemoryTaskRepository implements TaskRepository {
  private tasks: Map<string, Task> = new Map();

  save(task: Task): void {
    this.tasks.set(task.taskId, task);
  }

  findById(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  findAll(): Task[] {
    return Array.from(this.tasks.values());
  }

  delete(taskId: string): void {
    this.tasks.delete(taskId);
  }
}
