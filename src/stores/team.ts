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
  const teams = ref<Map<string, Team>>(new Map()); // 团队列表（使用 Map 提高查找效率）
  const employees = ref<Employee[]>([]); //员工列表
  const currentTeam = ref<Team | null>(null); // 当前选中的团队
  const currentEmployee = ref<Employee | null>(null); // 当前选中的成员
  const teamMembers = ref<Employee[]>([]); // 当前团队的成员列表
  const availableTeams = ref<Team[]>([]); //可用团队
  // 计算属性：转换 Map 为数组（用于展示）
  const teamList = computed(() => Array.from(teams.value.values()));
  const errorMessage = ref<string>('');

  // 获取团队列表
  const getTeamList = async (): Promise<Team[]> => {
    try {
      const teamArray = await fetchTeams();
      teams.value = new Map(teamArray.map(team => [team.id, team]));
      return teamArray;
    } catch (error) {
      console.error(error);
      createToast('加载团队列表失败', { position: 'top-center', showIcon: true });
      return [];
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

  // 获取团队详情
  const getTeamById = async (teamId: string) => {
    try {
      currentTeam.value = await fetchTeamById(teamId);
    } catch (error) {
      console.error(error);
      createToast('获取团队详情失败', { position: 'top-center', showIcon: true });
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
  const createNewTeam = async (teamData: { name: string; description: string }) => {
    try {
      const newTeam = await createTeam(teamData);
      teams.value.set(newTeam.id, newTeam);
      createToast('团队创建成功', { position: 'top-center', showIcon: true });
    } catch (error) {
      console.error(error);
      createToast('创建团队失败', { position: 'top-center', showIcon: true });
    }
  };

  // 更新团队信息
  const updateTeamInfo = async (teamId: string, teamData: { name: string; description: string }) => {
    try {
      const updatedTeam = await updateTeam(teamId, teamData);
      teams.value.set(teamId, updatedTeam);
      if (currentTeam.value?.id === teamId) {
        currentTeam.value = updatedTeam;
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
      teams.value.delete(teamId);
      if (currentTeam.value?.id === teamId) {
        currentTeam.value = null;
        teamMembers.value = [];
      }
      createToast('团队删除成功', { position: 'top-center', showIcon: true });
    } catch (error) {
      console.error(error);
      createToast('删除团队失败', { position: 'top-center', showIcon: true });
    }
  };


  // 添加成员到团队
  const addMember = async (teamId: string, memberId: string) => {
    try {
      const updatedTeam = await addMemberToTeam(teamId, memberId);
      if (currentTeam.value?.id === teamId) {
        currentTeam.value = updatedTeam;
      }
      await getTeamMembers(teamId); // 重新获取成员列表
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
      if (currentTeam.value?.id === teamId) {
        currentTeam.value = updatedTeam;
      }
      await getTeamMembers(teamId); // 重新获取成员列表
      createToast('成员移除成功', { position: 'top-center', showIcon: true });
    } catch (error) {
      console.error(error);
      createToast('移除成员失败', { position: 'top-center', showIcon: true });
    }
  };

  // 获取团队成员列表
  const getTeamMembers = async (teamId: string) => {
    try {
      const data = await fetchTeamMembers(teamId); // 调用 API
      // 二次类型校验
      if (!Array.isArray(data)) {
        throw new Error('团队成员数据格式异常');
      }
      // 使用更安全的数组合并方式
      const newMembers = data.filter(newMember =>
        !employees.value.some(existing => existing.employeeId === newMember.employeeId)
      );
      // 同时更新employees列表用于全局查找
      employees.value = [...employees.value, ...data.filter(e =>
        !employees.value.some(existing => existing.employeeId === e.employeeId)
      )];
      return data; // 返回团队成员列表
    } catch (error) {
      console.error('获取团队成员失败:', error);
      throw error; // 抛出错误，便于调用者处理
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
    teamList,
    currentTeam,
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