import type { Comment } from './comment';
export interface Task {
  teamId: string; // 所属团队 ID
  employeeId: string; // 负责人 ID
  projectId?: string // 项目关联字段
  id: string;
  title: string;
  description: string;
  status: '待处理' | '进行中' | '已完成';
  priority: '高' | '中' | '低';
  comments?: Comment[]; // 评论
  creator: string; // 创建者 ID
  scheduledTime: string; // 调度时间
  deadline?: string; // 截止时间
  image?: (File | FileWithPreview)[] | null;
  reminderTime?: string; // 任务截止前提醒时间
  operations?: OperationLog[];
}

// 文件预览类型
export interface FileWithPreview {
  name: string;
  url: string; //必须包含
  type: string;
  size: number;
  preview?: string;
}

export interface OperationLog {
  id: string;
  taskId: string; // 关联的任务ID
  employeeId: string; // 操作者ID
  operationType: 'create' | 'update' | 'delete' | 'status_change'; // 操作类型
  operation: string; // 操作描述，如“修改截止时间从2025-03-01到2025-05-01”
  time: string; // 操作时间
  details?: Record<string, { old: any; new: any }>; // 修改详情
}


