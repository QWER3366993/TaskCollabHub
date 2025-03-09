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
  image?: File | File[] | null; 
  reminderTime?: string; // 任务截止前提醒时间
}

export interface OperationLog {
  id: string;
  userId: string;
  operation: string;
  time: Date;
}

// 数字字面量类型，用于表示状态
export type WorkStatus = 0 | 1 | 2;

// 状态配置类型定义
export type StatusConfig = {
  label: string;
  type: 'success' | 'warning' | 'danger'; // 字面量类型
};