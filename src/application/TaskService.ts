
import { Task } from "../domain";

export interface CreateTaskCommand {
  title: string;
  description?: string;
  dueDate?: Date;
  priority: string;
  userId: string;
}

export interface TaskService {

  createTask(input: CreateTaskCommand): Task;

  completeTask(taskId: string): Task;
  updateTaskStatus(taskId: string, status: string): Task;

  listTasksByPriority(userId: string): Task[];

  listDueTasks(date: Date): Task[];
  getUserProgress(userId: string): {
    total: number;
    completed: number;
  };
}
