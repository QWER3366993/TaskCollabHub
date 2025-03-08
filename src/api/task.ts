import service from '@/utils/request'
import type { Comment } from '@/types/comment'
import type { Task, OperationLog } from '@/types/task'
import type { Employee } from '@/types/team'
import dayjs from 'dayjs'
// 获取任务列表
export const fetchTasks = async (): Promise<Task[]> => {
  const response = await service({
    url: '/api/tasks',
    method: 'get',
  });
  return response.data;
};

// 根据任务id获取任务详情
export const fetchTaskById = async (taskId: string): Promise<Task | null> => {
  const response = await service({
    url: '/api/tasks/${taskId}',
    method: 'get',
  });
  return response.data;
};

// 根据参与人员获取任务列表
export const fetchTasksByUser = async (): Promise<Task[]> => {
  const response = await service({
    url: '/api/tasks?assignedTo=${userId}',
    method: 'get',
  });
  return response.data;
};

// 根据任务状态获取任务列表
export const fetchTasksByStatus = async (status: '待处理' | '进行中' | '已完成'): Promise<Task[]> => {
  const response = await service({
    url: '/api/tasks?status=${status}',
    method: 'get',
  });
  return response.data;
};

// 获取任务评论
export const fetchCommentsByTaskId = async (taskId: string): Promise<Comment[]> => {
  const response = await service({
    url: `/api/tasks/${taskId}/comments`,
    method: 'get',
  });
  return response.data;
};

// 提交新评论
export const addComment = async (taskId: string, comment: Comment): Promise<Comment> => {
  const response = await service({
    url: `/api/tasks/${taskId}/comments`,
    method: 'post',
    data: comment,
  });
  return response.data;
};

// 创建任务
export const createTask = async (taskData: { title: string; description: string; assignedTo: string; priority: string; status: string; creator: string }): Promise<Task> => {
  const response = await service({
    url: '/api/tasks',
    method: 'post',
    data: taskData,
  });
  return response.data;
};

// 更新任务
export const updateOldTask = async (id: string, updatedTask: Partial<Task>): Promise<Task> => {
  const response = await service({
    url: `/api/tasks/${id}`,
    method: 'patch',
    data: updatedTask,
  });
  return response.data;
};

// 删除任务
export const deleteTask = async (id: string): Promise<void> => {
  await service({
    url: `/api/tasks/${id}`,
    method: 'delete',
  });
};

// 获取员工列表
export const fetchEmployees = async (): Promise<Employee[]> => {
  const response = await service({
    url: '/api/employees',
    method: 'get',
  });
  return response.data;
};

// 获取用户角色
export const fetchUserRole = async (): Promise<{ authorities: string }> => {
  const response = await service({
    url: '/api/user-role',
    method: 'get',
  });
  return response.data;
};

// 获取操作日志
export const fetchOperationLogs = async (): Promise<OperationLog[]> => {
  const response = await service({
    url: '/api/operation-logs',
    method: 'get',
  });
  return response.data;
};

// 开始任务调度
export const startTaskScheduling = async (): Promise<void> => {
  await service({
    url: '/api/start-task-scheduling',
    method: 'post',
  });
};

// 更新任务调度
export const updateTaskScheduling = async (taskId: string, scheduledTime: string): Promise<void> => {
  await service({
    url: '/api/update-task-scheduling',
    method: 'post',
    data: {
      taskId,
      scheduledTime: dayjs(scheduledTime).format('YYYY-MM-DD HH:mm:ss'), // 使用 dayjs 格式化日期
    }
  });
};

// 获取任务调度列表
export const fetchTaskSchedulingList = async (): Promise<any[]> => {
  const response = await service({
    url: '/api/task-scheduling-list',
    method: 'get',
  });
  return response.data;
};

// 获取任务概览数据
export const fetchTaskOverview = async (): Promise<{
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}> => {
  const response = await service({
    url: '/api/task-overview',
    method: 'get',
  });
  return response.data;
};

// 获取员工任务完成情况数据
export const fetchEmployeeTaskCompletion = async (): Promise<
  Array<{ name: string; completed: number; pending: number; overdue: number; month: string }>
> => {
  const response = await service({
    url: '/api/employee-task-completion',
    method: 'get',
  });
  return response.data;
};