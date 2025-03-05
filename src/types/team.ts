export interface Team {
    id: string;
    name: string;
    description: string;
  }

  export interface Employee {
    id: number;
    name: string;
    status: string; // 例如: '在职', '请假'
    workload: number; // 当前任务数量
    position: string; // 例如: ['前端工程师', '测试工程师']
    authorities?: string[] //admin,manager,member
  }