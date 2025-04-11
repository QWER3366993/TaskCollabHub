export interface Team {
    teamId: string;
    name: string;
    description: string;
    createdAt?: string;     
    employees: string[];
  }

  export interface Employee {
    teamId: string; // 员工所属团队的 ID
    employeeId: string; // 员工 ID
    userId: string // 关联 User
    name: string; // 员工姓名
    status: string; // 员工状态，例如: '在职', '请假'
    workload: number; // 当前任务数量
    position: string; // 职位，例如: '前端工程师', '测试工程师'
    authorities: string[]; // 权限，例如: ['admin', 'manager', 'member']
    avatar?: string; // 头像
    online: boolean // 在线状态
  }

  export interface Schedule {
    scheduleId: string;
    title: string;
    date: string;
    time: string;
    participants: string[];
  }