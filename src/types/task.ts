export interface Task {
    id: string;
    title: string;
    description: string;
    status: '待处理' | '进行中' | '已完成';
    assignedTo: string;
    priority: '高' | '中' | '低';
    creator:  string;
    scheduledTime:Date
    image?: string; // 添加 image 属性，并设为可选
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