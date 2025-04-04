export interface StatusTrendData {
  dates: string[]
  values: number[]
}

export type ContributionData = {
  names: string[]; // 成员名称
  values: { total: number; completed: number; pending: number; overdue: number }[]; // 每个成员的任务数据
  completed: number[]; // 每个成员的已完成任务数
  overdue: number[]; // 每个成员的超期任务数
  pending: number[]; // 每个成员的待完成任务数
  topPerformer: { name: string; count: number }; // 最佳执行者
  totalOverdue: number; // 总超期任务数
  sortedEmployees: {
    id: string;
    total: number;
    completed: number;
    overdue: number;
    pending: number;
    earlyCompletedTime: number;
    totalCompletedTime: number
  }[];
};

export interface StatusDataItem {
  value: number // 任务数量
  title: string // 状态名称
  color: string // 图标颜色
  lightColor: string // 浅色背景
  icon: string //图标
}
