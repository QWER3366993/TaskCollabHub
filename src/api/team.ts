import service from '@/utils/request'
import type { Team, Employee } from '@/types/team'
import type { OperationLog } from '@/types/task';

// 获取团队列表
export const fetchTeams = async (): Promise<Team[]> => {
  const response = await service({
    url: '/teams',
    method: 'get',
  });
  // 确保返回的是一个数组
  if (!Array.isArray(response.data)) {
    console.error('接口返回异常数据格式:', response.data);
    return [];
  }
  return response.data;
};

// 根据团队id获取团队详情
export const fetchTeamById = async (teamId: string): Promise<Team> => {
  const response = await service({
    url: `/teams/${teamId}`,
    method: 'get',
  });
  return response.data;
};

// 获取员工详情
export const fetchEmployeeById = async (employeeId: string): Promise<Employee> => {
  const response = await service({
    url: `/employees/employee-id/${employeeId}`,
    method: 'get',
  });
  return response.data;
};

//根据成员获取所在团队列表
export const fetchTeamByemployeeId = async (employeeId: string): Promise<Team[] | []> => {
  const response = await service({
    url: `/employees/${employeeId}/teams`,
    method: 'get',
  });
  // 返回的数据是团队数据，但 team 的 employees 只是 ID，你需要在此处理员工信息
  const teamsWithEmployees = response.data.map((team: Team) => {
    return {
      ...team,
      employees: team.employees.map((employeeId: string) => fetchEmployeeById(employeeId)) // 根据 ID 获取员工详细信息
    };
  });

  return teamsWithEmployees;
};

// 创建新团队
export const createTeam = async (teamData: {
  name: string;
  description: string;
  employees?: string[]
}
): Promise<Team> => {
  const response = await service({
    url: '/teams',
    method: 'post',
    data: {
      ...teamData,
      members: teamData.employees // 提交的是员工 ID 数组
    },
  });
  return response.data;
};

// 更新团队信息
export const updateTeam = async (teamId: string, teamData: { name: string; description: string; employees: string[] }): Promise<Team> => {
  const response = await service({
    url: `/teams/${teamId}`,
    method: 'put',
    data: {
      ...teamData,
      members: teamData.employees // 提交的是员工 ID 数组
    },
  });
  return response.data;
};

// 更新员工信息
export const updateEmployeeInfo = async (employeeId: string, employeeData: Partial<Employee>): Promise<Employee> => {
  const response = await service({
    url: `/employees/${employeeId}`,
    method: 'patch', // 改为 PATCH，支持部分更新
    data: employeeData,
  });
  return response.data;
};

// 删除团队
export const deleteTeam = async (teamId: string): Promise<Team> => {
  const response = await service({
    url: `/teams/${teamId}`,
    method: 'delete',
  });
  return response.data;
};

// 添加成员到团队
export const addMemberToTeam = async (teamId: string, employeeIds: string | string[]): Promise<Team> => {
  const ids = Array.isArray(employeeIds) ? employeeIds : [employeeIds];
  const response = await service({
    url: `/teams/${teamId}/employees`,
    method: 'post',
    data: { employeeIds: ids },
  });
  return response.data;
};

// 从团队中移除成员
export const removeMemberFromTeam = async (teamId: string, memberId: string): Promise<Team> => {
  const response = await service({
    url: `/teams/${teamId}/members/${memberId}`,
    method: 'delete',
  });
  return response.data;
};

// 获取某个团队的成员（根据ID数组获取详情）
export const fetchTeamMembers = async (teamId: string): Promise<Employee[]> => {
  try {
    const response = await service({
      url: `/teams/${teamId}/members`,
      method: 'get',
    });
    if (!Array.isArray(response.data)) {
      console.error('接口返回异常数据格式:', response.data);
      return [];
    }
    return response.data;
  } catch (error) {
    console.error('获取团队成员失败:', error);
    return []; // 确保始终返回数组
  }
};

// 获取所有员工列表
export const fetchEmployees = async (): Promise<Employee[]> => {
  const response = await service({
    url: '/employees',
    method: 'get',
  });
  return response.data;
};


// 目前从任务日志里筛选，暂且注释

// // 获取员工操作日志
// export const fetchEmployeeOperationLogs = async (employeeId: string): Promise<OperationLog[]> => {
//   const response = await service({
//     url: `/employees/${employeeId}/operations`,
//     method: 'get',
//   });
//   return response.data;
// };

// 获取日程列表
export const getSchedules = async () => {
  const response = await service.get('/schedules');
  return response;
};

// 创建日程
export const createSchedule = async (scheduleData: any) => {
  const response = await service.post('/schedule', scheduleData);
  return response;
}

// 更新日程
export const updateSchedule = async (scheduleId: string, scheduleData: any) => {
  const response = await service.put(`/schedule/${scheduleId}`, scheduleData);
  return response;
}

// 删除日程
export const deleteSchedule = async (scheduleId: string) => {
  const response = await service.delete(`/schedule/${scheduleId}`);
  return response;
}