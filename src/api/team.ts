import service from '@/utils/request'
import type { Team, Employee } from '@/types/team'
import type { Project } from '@/types/project';

// 获取团队列表
export const fetchTeams = async (): Promise<Team[]> => {
  const response = await service({
    url: '/api/teams',
    method: 'get',
  });
  return response.data;
};

//根据成员获取所在团队列表
export const fetchTeamByemployeeIdId = async (employeeId: string): Promise<Team[] | null> => {
  const response = await service({
    url: `/api/projects/${employeeId}`,
    method: 'get',
  });
  return response.data;
};

// 创建新团队
export const createTeam = async (teamData: { name: string; description: string }): Promise<Team> => {
  const response = await service({
    url: '/api/teams',
    method: 'post',
    data: teamData,
  });
  return response.data;
};

// 更新团队信息
export const updateTeam = async (teamId: string, teamData: { name: string; description: string }): Promise<Team> => {
  const response = await service({
    url: `/api/teams/${teamId}`,
    method: 'put',
    data: teamData,
  });
  return response.data;
};

// 删除团队
export const deleteTeam = async (teamId: string): Promise<Team> => {
  const response = await service({
    url: `/api/teams/${teamId}`,
    method: 'delete',
  });
  return response.data;
};

// 获取团队详情
export const fetchTeamById = async (teamId: string): Promise<Team> => {
  const response = await service({
    url: `/api/teams/${teamId}`,
    method: 'get',
  });
  return response.data;
};

// 获取员工详情
export const fetchEmployeeById = async (userId: string): Promise<Employee> => {
  const response = await service({
    url: `/api/employees/${userId}`,
    method: 'get',
  });
  return response.data;
};

// 添加成员到团队
export const addMemberToTeam = async (teamId: string, memberId: string): Promise<Team> => {
  const response = await service({
    url: `/api/teams/${teamId}/members`,
    method: 'post',
    data: { memberId },
  });
  return response.data;
};

// 从团队中移除成员
export const removeMemberFromTeam = async (teamId: string, memberId: string): Promise<Team> => {
  const response = await service({
    url: `/api/teams/${teamId}/members/${memberId}`,
    method: 'delete',
  });
  return response.data;
};

// 获取特定团队成员
export const fetchTeamMembers = async (teamId: string): Promise<Employee[]> => {
  const response = await service({
    url: `/api/teams/${teamId}/members`,
    method: 'get',
  });
  return response.data;
};

// 获取所有员工列表
export const fetchEmployees = async (): Promise<Employee[]> => {
  const response = await service({
    url: '/employees',
    method: 'get',
  });
  return response.data;
};