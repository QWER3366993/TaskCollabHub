import type { Comment } from './comment';
export interface Task {
  teamId: string; // 所属团队 ID
  employeeId: string; // 负责人 ID
  projectId?: string // 项目关联字段
  taskId: string;
  title: string;
  description: string;
  status: '待处理' | '进行中' | '已完成';
  priority: '高' | '中' | '低';
  comments?: Comment[]; // 评论
  creator: string; // 创建者 ID
  scheduledTime: string; // 调度时间
  completedTime ?: string;  // 完成时间
  deadline?: string; // 截止时间
  files?: FileItem[];
  reminderTime?: string; // 任务截止前提醒时间
  operations?: OperationLog[];
}


export interface TaskCreateDTO {
  projectId?: string
  teamId: string; 
  title: string
  description: string
  employeeId?: string
  priority: '高' | '中' | '低';
  status: '待处理' | '进行中' | '已完成';
  creator: string
  scheduledTime: string; 
  deadline?: string; 
  reminderTime?: string;
  files?: FileItem[];
}

// 文件类型定义（为了在聊天中复用该file类型，将uploader和scope设为可选字段）
export interface FileItem {
  id: string;
  taskId?: string; // 关联任务ID（当scope=task时存在）
  name: string;
  size: number;
  type: string;
  url: string;
  uploadTime: string;
  uploader?: string;
  scope?: 'task' | 'public' // 文件作用域
  downloadCount?: number
}

export interface OperationLog {
  id: string;
  taskId: string; // 关联的任务ID
  employeeId: string; // 操作者ID
  operationType: 'create' | 'update' | 'delete' | 'status_change' | 'view' | "file_upload"; // 操作类型
  operation: string; // 操作描述，如“修改截止时间从2025-03-01到2025-05-01”
  time: string; // 操作时间
  details?: Record<string, { old: any; new: any }>; // 修改详情
}


export interface RecommendEmployeeDTO {
  employeeId: string;
  employeeName: string;
  position: string;
  workload: number;
  score: number;
}

