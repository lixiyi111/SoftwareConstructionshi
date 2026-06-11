import { randomUUID } from 'crypto';
import { Task } from '../domain/Task';
import { Priority } from '../domain/Priority';
import { TaskStatus } from '../domain/TaskStatus';
import { TaskRepository } from '../infrastructure/TaskRepository';
import { CreateTaskCommand, TaskService } from './TaskService';

/** 优先级转数字，用于排序（值越小优先级越高） */
const priorityWeight: Record<string, number> = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

/**
 * 默认任务服务 —— 应用层实现
 * 实现 TaskService 接口中定义的 5 个功能。
 */
export class DefaultTaskService implements TaskService {
  constructor(private readonly repository: TaskRepository) {}

  // ========== &创建任务 ==========

  createTask(input: CreateTaskCommand): Task {
    const priority = this.parsePriority(input.priority);

    const task = new Task(
      randomUUID(),
      input.userId,
      (input.title ?? '').trim(),
      input.description ?? '',
      priority,
      TaskStatus.Pending,
      new Date(),
      input.dueDate,
    );

    this.repository.save(task);
    return task;
  }

  // ========== &更新任务状态 ==========

  completeTask(taskId: string): Task {
    return this.updateTaskStatus(taskId, 'COMPLETED');
  }

  updateTaskStatus(taskId: string, status: string): Task {
    const task = this.repository.findById(taskId);
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`);
    }

    const newStatus = this.parseStatus(status);

    task.updateStatus(newStatus);
    this.repository.save(task);
    return task;
  }

  // ========== &按优先级排序 ==========

  listTasksByPriority(userId: string): Task[] {
    const all = this.repository.findAll();
    const p = (t: Task) => priorityWeight[t.priority] ?? 99;
    return all.filter((t) => t.userId === userId).sort((a, b) => p(a) - p(b));
  }

  // ========== &查询到期任务 ==========

  listDueTasks(date: Date): Task[] {
    const all = this.repository.findAll();
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return all.filter((t) => t.deadline && t.deadline <= endOfDay);
  }

  // ========== &按用户统计任务完成情况==========

  getUserProgress(userId: string): { total: number; completed: number } {
    const all = this.repository.findAll();
    const userTasks = all.filter((t) => t.userId === userId);
    return {
      total: userTasks.length,
      completed: userTasks.filter((t) => t.status === TaskStatus.Completed).length,
    };
  }

  // ========== &记录学习时长 ==========

  recordStudyTime(taskId: string, minutes: number): Task {
    const task = this.repository.findById(taskId);
    if (!task) {
      throw new Error(`任务不存在: ${taskId}`);
    }
    if (minutes <= 0) {
      throw new Error('学习时长必须为正数');
    }
    task.addStudyTime(minutes);
    this.repository.save(task);
    return task;
  }

  // ========== &学习时长统计 ==========

  getStudyStatistics(userId: string): {
    totalMinutes: number;
    completedTaskMinutes: number;
    averageMinutesPerTask: number;
  } {
    const userTasks = this.repository
      .findAll()
      .filter((t) => t.userId === userId);

    if (userTasks.length === 0) {
      return { totalMinutes: 0, completedTaskMinutes: 0, averageMinutesPerTask: 0 };
    }

    const totalMinutes = userTasks.reduce((sum, t) => sum + (t.actualMinutes ?? 0), 0);
    const completedTaskMinutes = userTasks
      .filter((t) => t.status === TaskStatus.Completed)
      .reduce((sum, t) => sum + (t.actualMinutes ?? 0), 0);
    const averageMinutesPerTask = totalMinutes / userTasks.length;

    return { totalMinutes, completedTaskMinutes, averageMinutesPerTask };
  }

  // ========== 私有辅助方法 ==========

  private parsePriority(value: string): Priority {
    const map: Record<string, Priority> = {
      HIGH: Priority.High,
      MEDIUM: Priority.Medium,
      LOW: Priority.Low,
    };
    const p = map[value.toUpperCase()];
    if (!p) throw new Error(`无效优先级: ${value}（可选: HIGH / MEDIUM / LOW）`);
    return p;
  }

  private parseStatus(value: string): TaskStatus {
    const map: Record<string, TaskStatus> = {
      PENDING: TaskStatus.Pending,
      IN_PROGRESS: TaskStatus.InProgress,
      COMPLETED: TaskStatus.Completed,
    };
    const s = map[value.toUpperCase()];
    if (!s) throw new Error(`无效状态: ${value}（可选: PENDING / IN_PROGRESS / COMPLETED）`);
    return s;
  }
}
