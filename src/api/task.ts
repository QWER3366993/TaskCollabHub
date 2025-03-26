import service from '@/utils/request'
import type { Comment } from '@/types/comment'
import type { Task, TaskCreateDTO, OperationLog, FileItem } from '@/types/task'
import type { Employee } from '@/types/team'
import type { User } from '@/types/user'
import dayjs from 'dayjs'

// ==================== 任务相关接口 ====================
// 获取任务列表
export const fetchTasks = async (): Promise<Task[]> => {
  const response = await service({
    url: '/tasks',
    method: 'get',
  });
  return response.data;
};

// 根据任务id获取任务详情
export const fetchTaskById = async (taskId: string): Promise<Task | null> => {
  const response = await service({
    url: `/tasks/${taskId}`,
    method: 'get',
  });
  return response.data;
};

export const fetchTasksByTeam = async (teamId: string): Promise<Task[]> => {
  const response = await service({
    url: `/tasks?teamId=${teamId}`,
    method: 'get',
  });
  return response.data;
};

// 根据参与人员获取任务列表
export const fetchTasksByUser = async (userId: string): Promise<Task[]> => {
  const response = await service({
    url: `/tasks?employeeId=${userId}`,
    method: 'get',
  });
  return response.data;
};

// // 根据任务状态获取任务列表
// export const fetchTasksByStatus = async (status: '待处理' | '进行中' | '已完成'): Promise<Task[]> => {
//   const response = await service({
//     url: `/tasks?status=${status}`,
//     method: 'get',
//   });
//   return response.data;
// };

// 创建任务
export const createTask = async (taskData: TaskCreateDTO): Promise<Task> => {
  const response = await service({
    url: '/tasks',
    method: 'post',
    data: taskData,
  });
  return response.data;
};

// 更新任务
export const updateOldTask = async (id: string, updatedTask: Partial<Task>): Promise<Task> => {
  const response = await service({
    url: `/tasks/${id}`,
    method: 'patch',
    data: updatedTask,
  });
  return response.data;
};

// 删除任务
export const deleteTask = async (id: string): Promise<void> => {
  await service({
    url: `/tasks/${id}`,
    method: 'delete',
  });
};

// ==================== 评论相关接口 ====================
// 获取任务评论
export const fetchCommentsByTaskId = async (taskId: string): Promise<Comment[]> => {
  const response = await service({
    url: `/tasks/${taskId}/comments`,
    method: 'get',
  });
  return response.data;
};

// 提交新评论
export const addComment = async (taskId: string, comment: Comment): Promise<Comment> => {
  const response = await service({
    url: `/tasks/${taskId}/comments`,
    method: 'post',
    data: comment,
  });
  return response.data;
};

// ==================== 其他接口 ====================
// 获取用户角色
export const fetchUserRole = async (): Promise<{ authorities: string }> => {
  const response = await service({
    url: '/user-role',
    method: 'get',
  });
  return response.data;
};

// 获取操作日志
export const fetchOperationLogs = async (): Promise<OperationLog[]> => {
  const response = await service({
    url: '/operation-logs',
    method: 'get',
  });
  return response.data;
};

// 开始任务调度
export const startTaskScheduling = async (): Promise<void> => {
  await service({
    url: '/start-task-scheduling',
    method: 'post',
  });
};

// 更新任务调度
export const updateTaskScheduling = async (taskId: string, scheduledTime: string): Promise<void> => {
  await service({
    url: '/update-task-scheduling',
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
    url: '/task-scheduling-list',
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
    url: '/task-overview',
    method: 'get',
  });
  return response.data;
};

// 获取员工任务完成情况数据
export const fetchEmployeeTaskCompletion = async (): Promise<
  Array<{ name: string; completed: number; pending: number; overdue: number; month: string }>
> => {
  const response = await service({
    url: '/employee-task-completion',
    method: 'get',
  });
  return response.data;
};

// ==================== 文件相关接口 ====================
// 公共文件操作
export const fetchPublicFiles = async (): Promise<FileItem[]> => {
  const response = await service.get<FileItem[]>('/files/public')
  return response.data
}
// 文件共享下的上传
export const uploadPublicFile = async (formData: FormData): Promise<FileItem> => {
  const response = await service.post<FileItem>('/files/public', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// 任务文件操作
export const fetchTaskFiles = async (taskId: string): Promise<FileItem[]> => {
  const response = await service.get<FileItem[]>(`/tasks/${taskId}/files`)
  return response.data
}

// 任务调度下的文件上传
export const uploadTaskFile = async (taskId: string, formData: FormData): Promise<FileItem> => {
  const response = await service.post<FileItem>(`/tasks/${taskId}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// 文件下载接口（公共/任务通用）
export const downloadFile = async (fileId: string, fileName: string): Promise<void> => {
  const response = await service.get<Blob>(`/files/${fileId}/download`, {
    responseType: 'blob',
    transformResponse: [(data) => data] // 禁用默认 JSON 解析
  });

  // 获取原始文件名
  const contentDisposition = response.headers['content-disposition'];
  const serverFileName = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || fileName;

  // 创建 Blob
  const blob = new Blob([response.data], { type: response.headers['content-type'] });

  // 创建对象 URL
  const url = URL.createObjectURL(blob);

  // 创建隐藏链接
  const link = document.createElement('a');
  link.href = url;
  link.download = decodeURIComponent(serverFileName); // 解码中文文件名
  link.style.display = 'none';

  // 添加清理监听器
  link.addEventListener('load', () => {
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  });

  document.body.appendChild(link);
  link.click();
};

// 统一删除接口
export const deleteFile = async (fileId: string): Promise<void> => {
  await service.delete(`/files/${fileId}`)
}