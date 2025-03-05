// stores/team.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { createToast } from 'mosha-vue-toastify';
import type { Team, Employee } from '@/types/team';
import {
  fetchTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  fetchTeamById,
  addMemberToTeam,
  removeMemberFromTeam,
  fetchTeamMembers
} from '@/api/team';

export const useTeamStore = defineStore('team', () => {
  // State
  const teams = ref<Map<string, Team>>(new Map()); // 团队列表（使用 Map 提高查找效率）
  const currentTeam = ref<Team | null>(null); // 当前选中的团队
  const teamMembers = ref<Employee[]>([]); // 当前团队的成员列表

  // 计算属性：转换 Map 为数组（用于展示）
  const teamList = computed(() => Array.from(teams.value.values()));

  // 获取团队列表
  const getTeamList = async () => {
    try {
      const teamArray = await fetchTeams();
      teams.value = new Map(teamArray.map(team => [team.id, team]));
    } catch (error) {
      console.error(error);
      createToast('加载团队列表失败', { position: 'top-center', showIcon: true });
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

  // 获取团队详情
  const getTeamById = async (teamId: string) => {
    try {
      currentTeam.value = await fetchTeamById(teamId);
    } catch (error) {
      console.error(error);
      createToast('获取团队详情失败', { position: 'top-center', showIcon: true });
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
      teamMembers.value = await fetchTeamMembers(teamId);
    } catch (error) {
      console.error(error);
      createToast('获取团队成员失败', { position: 'top-center', showIcon: true });
    }
  };

  return {
    teams,
    teamList,
    currentTeam,
    teamMembers,
    getTeamList,
    createNewTeam,
    updateTeamInfo,
    deleteTeamById,
    getTeamById,
    addMember,
    removeMember,
    getTeamMembers
  };
});