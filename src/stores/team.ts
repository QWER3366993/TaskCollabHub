// stores/team.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { createToast } from 'mosha-vue-toastify';
import type { Team, Employee } from '@/types/team';
import type { User } from '@/types/user';
import {
  fetchTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  fetchTeamById,
  fetchEmployeeById,
  addMemberToTeam,
  removeMemberFromTeam,
  fetchEmployees,
  fetchTeamMembers,
  fetchTeamByemployeeId
} from '@/api/team';

export const useTeamStore = defineStore('team', () => {
  // State
  const teams = ref<Team[]>([]); // 团队列表（使用 Map 提高查找效率）
  const teamDetail = ref<Team>();
  const employees = ref<Employee[]>([]); //员工列表
  const currentEmployee = ref<Employee | null>(null); // 当前选中的成员
  const teamMembers = ref<Employee[]>([]); // 当前团队的成员列表
  const availableTeams = ref<Team[]>([]); //可用团队
  // 计算属性：转换 Map 为数组（用于展示）
  const errorMessage = ref<string>('');

  // 获取团队列表
  const getTeamList = async (): Promise<Team[]> => {
    try {
      const data = await fetchTeams();
      teams.value = data;
      return data;
    } catch (error) {
      console.error(error);
      createToast('加载团队列表失败', { position: 'top-center', showIcon: true });
      return [];
    }
  };

  // 获取团队id获取团队详情
  const getTeamById = async (teamId: string): Promise<Team> => {
    try {
      const data = await fetchTeamById(teamId);
      // 同时加载成员列表
      const members = await fetchTeamMembers(teamId);
      teamDetail.value = {
        ...data,
        employees: members // 合并成员数据
      };
      return teamDetail.value;
    } catch (error) {
      console.error(error);
      createToast('获取团队详情失败', { position: 'top-center', showIcon: true });
      throw error;
    }
  };

  /** 根据员工 ID 获取团队列表 */
  const getTeamByemployId = async (employeeId: string): Promise<Team[]> => {
    try {
      const data = await fetchTeamByemployeeId(employeeId);
      if (data) {
        availableTeams.value = data;
        return data;
      } else {
        availableTeams.value = [];
        errorMessage.value = '团队不存在';
        createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
        return [];
      }
    } catch (error) {
      availableTeams.value = [];
      errorMessage.value = '获取当前团队失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      return [];
    }
  };

  //获取员工详情
  const getEmployeeById = async (userId: string) => {
    try {
      const employee = await fetchEmployeeById(userId);
      if (employee) {
        currentEmployee.value = employee; // 更新当前选中的员工
        return employee; // 返回单个员工对象
      } else {
        errorMessage.value = '员工不存在';
        createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
        return null;
      }
    } catch (error) {
      console.error(error);
      errorMessage.value = '获取员工详情失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      return null;
    }
  };

  // 创建新团队
  const createNewTeam = async (teamData: { name: string; description: string; employees?: Employee[] }) => {
    try {
      const newTeam = await createTeam(teamData);
      teams.value.push({
        ...newTeam,
        employees: [] // 初始化为空数组，后续通过 getTeamMembers 加载
      });
      createToast('团队创建成功', { position: 'top-center', showIcon: true });
    } catch (error) {
      console.error(error);
      createToast('创建团队失败', { position: 'top-center', showIcon: true });
    }
  };

  // 更新团队信息(通过索引替换特定位置的对象)
  const updateTeamInfo = async (teamId: string, teamData: { name: string; description: string; employees: Employee[] }) => {
    try {
      const updatedTeam = await updateTeam(teamId, teamData);

      // 找到需要更新的团队索引
      const teamIndex = teams.value.findIndex(team => team.id === teamId);
      if (teamIndex !== -1) {
        teams.value[teamIndex] = {
          ...teams.value[teamIndex],
          ...updatedTeam,
          employees: teamMembers.value // 保持本地成员数据同步
        };
      }
      // 更新详情数据
      if (teamDetail.value?.id === teamId) {
        teamDetail.value = {
          ...teamDetail.value,
          ...updatedTeam,
          employees: teamMembers.value
        };
      }
      createToast('团队信息更新成功', { position: 'top-center', showIcon: true });
    } catch (error) {
      console.error(error);
      createToast('更新团队信息失败', { position: 'top-center', showIcon: true });
    }
  };

  // 删除团队
  const deleteTeamById = async (teamId: string) => {
    try {
      await deleteTeam(teamId);
      // 过滤掉被删除的团队
      teams.value = teams.value.filter(team => team.id !== teamId);
      createToast('团队删除成功', { position: 'top-center', showIcon: true });
    } catch (error) {
      console.error(error);
      createToast('删除团队失败', { position: 'top-center', showIcon: true });
    }
  };

  // 添加成员到团队
  const addMember = async (teamId: string, employeeIds: string | string[]) => {
    try {
      const updatedTeam = await addMemberToTeam(teamId, employeeIds);
      // 更新本地数据
      const teamIndex = teams.value.findIndex(t => t.id === teamId);
      if (teamIndex !== -1) {
        teams.value[teamIndex].employees = updatedTeam.employees;
      }
      // 更新当前成员列表
      teamMembers.value = updatedTeam.employees;
      createToast('成员添加成功', { position: 'top-center', showIcon: true });
    } catch (error) {
      console.error(error);
      createToast('添加成员失败', { position: 'top-center', showIcon: true });
    }
  };

  // 从团队中移除成员
  const removeMember = async (teamId: string, memberId: string) => {
    try {
      const updatedTeam = await removeMemberFromTeam(teamId, memberId);
      // 更新本地数据
      const teamIndex = teams.value.findIndex(t => t.id === teamId);
      if (teamIndex !== -1) {
        teams.value[teamIndex].employees =
          teams.value[teamIndex].employees.filter(e => e.employeeId !== memberId);
      }
      // 更新当前成员列表
      teamMembers.value = teamMembers.value.filter(m => m.employeeId !== memberId);
      createToast('成员移除成功', { position: 'top-center', showIcon: true });
    } catch (error) {
      console.error(error);
      createToast('移除成员失败', { position: 'top-center', showIcon: true });
    }
  };

  // 获取团队成员列表
  const getTeamMembers = async (teamId: string): Promise<Employee[]> => {
    try {
      const data = await fetchTeamMembers(teamId);
      employees.value = data;
      return data;
    } catch (error) {
      errorMessage.value = '获取评论失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      return [];
    }
  };

  /** 获取员工列表 */
  const getEmployees = async (): Promise<Employee[]> => {
    try {
      const data = await fetchEmployees();
      employees.value = data;
      return data;
    } catch (error) {
      errorMessage.value = '获取员工列表失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      return [];
    }
  };

  // 获取员工姓名的方法(从 employees 数组中查找第一个 employeeId 匹配的员工对象)
  const getName = (employeeId: string) => {
    // 优先从当前团队成员查找
    const teamMember = teamMembers.value.find(e => e.employeeId === employeeId);
    if (teamMember) return teamMember.name;

    // 全局查找（含缓存数据）
    const globalEmployee = employees.value.find(e => e.employeeId === employeeId);
    return globalEmployee?.name || '未知成员';
  };

  return {
    teams,
    teamDetail,
    teamMembers,
    currentEmployee,
    employees,
    getTeamList,
    getTeamByemployId,
    createNewTeam,
    updateTeamInfo,
    deleteTeamById,
    getTeamById,
    getEmployeeById,
    addMember,
    removeMember,
    getTeamMembers,
    getEmployees,
    getName
  };
});