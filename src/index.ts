import { InMemoryTaskRepository } from './infrastructure/TaskRepository';
import { TaskService } from './application/TaskService';
import { TaskController } from './interfaces/TaskController';

/**
 * 应用入口
 */
const repository = new InMemoryTaskRepository();
const taskService = new TaskService(repository);
const controller = new TaskController(taskService);

console.log('🚀 StudyFlow 学习任务管理系统 v0.1.0');
console.log('分层架构: domain → application → infrastructure → interfaces');
