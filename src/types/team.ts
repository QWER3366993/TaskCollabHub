export interface Team {
    id: string;
    name: string;
    description: string;
  }

  export interface Employee {
    teamId: string; // 员工所属团队的 ID
    employeeId: string; // 员工 ID
    userId: string; // 关联的 User ID
    name: string; // 员工姓名
    status: string; // 员工状态，例如: '在职', '请假'
    workload: number; // 当前任务数量
    position: string; // 职位，例如: '前端工程师', '测试工程师'
    authorities?: string[]; // 权限，例如: ['admin', 'manager', 'member']
  }