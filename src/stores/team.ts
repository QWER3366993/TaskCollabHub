// stores/team.ts
import { defineStore } from 'pinia';
import { ref, onMounted, reactive, computed } from 'vue';
import { createToast } from 'mosha-vue-toastify';
import type { Team, Employee } from '@/types/team';
import { useTaskStore } from './task';
import type { User } from '@/types/user';
import type { ContributionData } from '@/types/report';
import type { OperationLog } from '@/types/task';
import dayjs from 'dayjs';
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
  fetchTeamByemployeeId,
  updateEmployeeInfo
  // fetchEmployeeOperationLogs
} from '@/api/team';

export const useTeamStore = defineStore('team', () => {
  // State
  const teams = ref<Team[]>([]); // 团队列表（使用 Map 提高查找效率）
  const teamDetail = ref<Team>();
  const employees = ref<Employee[]>([]); //员工列表
  const currentEmployee = ref<Employee | null>(null); // 当前选中的成员
  const teamMembers = ref<Employee[]>([]); // 当前团队的成员列表
  const availableTeams = ref<Team[]>([]); //可用团队
  const employeeOperationLogs = ref<OperationLog[]>([]);
  const errorMessage = ref<string>('');
  const taskStore = useTaskStore()
  const contributionData = ref<ContributionData>({
    names: [],
    values: [],
    completed: [],
    pending: [],
    overdue: [],
    topPerformer: { name: '', count: 0 },
    totalOverdue: 0,
    sortedEmployees: [],
  });

  onMounted(async () => {
    await taskStore.getAllTasks(); // 确保任务数据加载完成
  });

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
        employees: members.map(member => member.employeeId)
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
  const getEmployeeById = async (employeeId: string) => {
    try {
      const employee = await fetchEmployeeById(employeeId);
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

  // 更新员工信息（支持部分或完整更新）
  const updateEmployee = async (employeeId: string, employeeData: Partial<Employee>): Promise<Employee | null> => {
    try {
      const updatedEmployee = await updateEmployeeInfo(employeeId, employeeData); // 调用 API
      if (updatedEmployee) {
        // 更新当前员工信息
        if (currentEmployee.value && currentEmployee.value.employeeId === employeeId) {
          currentEmployee.value = { ...currentEmployee.value, ...updatedEmployee };
        }
        // 更新员工列表中的信息
        const index = employees.value.findIndex(emp => emp.employeeId === employeeId);
        if (index !== -1) {
          employees.value[index] = { ...employees.value[index], ...updatedEmployee };
        }
        createToast('员工信息更新成功', { position: 'top-center', showIcon: true });
        return updatedEmployee;
      } else {
        errorMessage.value = '员工信息更新失败，未获取到更新数据';
        createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
        return null;
      }
    } catch (error) {
      console.error(error);
      errorMessage.value = '更新员工信息失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      return null;
    }
  };

  // 创建新团队
  const createNewTeam = async (teamData: { name: string; description: string; employees?: string[] }) => {
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
  const updateTeamInfo = async (teamId: string, teamData: { name: string; description: string; employees: string[] }) => {
    try {
      const updatedTeam = await updateTeam(teamId, teamData);

      // 找到需要更新的团队索引
      const teamIndex = teams.value.findIndex(team => team.teamId === teamId);
      if (teamIndex !== -1) {
        teams.value[teamIndex] = {
          ...teams.value[teamIndex],
          ...updatedTeam,
          employees: teamMembers.value.map(member => member.employeeId) // 转换为字符串数组
        };
      }
      // 更新详情数据
      if (teamDetail.value?.teamId === teamId) {
        teamDetail.value = {
          ...teamDetail.value,
          ...updatedTeam,
          employees: teamMembers.value.map(member => member.employeeId) // 转换为字符串数组
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
      teams.value = teams.value.filter(team => team.teamId !== teamId);
      createToast('团队删除成功', { position: 'top-center', showIcon: true });
    } catch (error) {
      console.error(error);
      createToast('删除团队失败', { position: 'top-center', showIcon: true });
    }
  };

  // 辅助函数：将员工 ID 数组转换为 Employee 对象数组
  const convertEmployeeIdsToObjects = async (employeeIds: string[]): Promise<Employee[]> => {
    const employeeObjects: Employee[] = [];
    for (const id of employeeIds) {
      const employee = await getEmployeeById(id);
      if (employee) {
        employeeObjects.push(employee);
      }
    }
    return employeeObjects;
  };

  // 添加成员到团队
  const addMember = async (teamId: string, employeeIds: string | string[]) => {
    try {
      const updatedTeam = await addMemberToTeam(teamId, employeeIds);

      // 更新本地数据
      const teamIndex = teams.value.findIndex(t => t.teamId === teamId);
      if (teamIndex !== -1) {
        // 将 Employee 对象数组转换为字符串数组
        teams.value[teamIndex].employees = updatedTeam.employees; // 类型匹配
      }

      // 更新当前成员列表
      teamMembers.value = await convertEmployeeIdsToObjects(updatedTeam.employees);
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
      const teamIndex = teams.value.findIndex(t => t.teamId === teamId);
      if (teamIndex !== -1) {
        teams.value[teamIndex].employees =
          teams.value[teamIndex].employees.filter(e => e !== memberId);
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
      // 优先从缓存读取
      const cached = teamMembers.value.filter(e => e.teamId === teamId);
      if (cached.length > 0) return cached;

      // 无缓存则请求数据
      const data = await fetchTeamMembers(teamId);
      teamMembers.value = [...teamMembers.value, ...data]; // 合并到全局缓存
      return data;

    } catch (error) {
      errorMessage.value = '获取成员失败'; // 更准确的错误提示
      createToast(errorMessage.value, { type: 'danger' });
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

  // // 获取员工操作日志
  // const getEmployeeOperationLogs = async (employeeId: string): Promise<OperationLog[]> => {
  //   try {
  //     const data = await fetchEmployeeOperationLogs(employeeId);
  //     employeeOperationLogs.value = data;
  //     return data;
  //   } catch (error) {
  //     errorMessage.value = '获取员工操作日志失败';
  //     createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
  //     throw error;
  //   }
  // }

  // 员工贡献数据
  const updateContributionData = () => {
    const employeeMap = new Map<string, { total: number; completed: number; overdue: number; pending: number; totalCompletedTime: number; earlyCompletedTime: number }>();

    // 初始化成员数据
    employees.value.forEach(employee => {
      employeeMap.set(employee.employeeId, { total: 0, completed: 0, overdue: 0, pending: 0, totalCompletedTime: 0, earlyCompletedTime: 0 });
    });

    // 遍历任务统计数据
    taskStore.allTasks.forEach(task => {
      if (task.employeeId) {
        const employee = employeeMap.get(task.employeeId);
        if (!employee) return;

        // 总任务数
        employee.total += 1;

        // 已完成任务数
        if (task.status === '已完成') {
          employee.completed += 1;

          if (task.completedTime && task.scheduledTime) {
            if (!dayjs(task.completedTime).isValid() || !dayjs(task.scheduledTime).isValid()) {
              console.error("时间格式无效:", task.completedTime, task.scheduledTime);
            } else {
              const taskCompletionTime = dayjs(task.completedTime).diff(dayjs(task.scheduledTime), 'minute');
              employee.totalCompletedTime += taskCompletionTime;
            }
            if (!dayjs(task.completedTime).isValid() || !dayjs(task.scheduledTime).isValid()) {
              console.error("时间格式无效:", task.completedTime, task.scheduledTime);
            } else {
              const taskEarlyCompletionTime = dayjs(task.deadline).diff(dayjs(task.completedTime), 'minute');
              // 各任务提前完成总时长
              employee.earlyCompletedTime += taskEarlyCompletionTime;
            }
          } else {
            console.warn(`⚠️ 任务 ${task.taskId} 没有有效的 completedTime 或 scheduledTime`, task.completedTime, task.scheduledTime);
          }
        }

        // 超期任务数（未完成且截止时间已过）
        if (
          task.status !== '已完成' &&
          task.deadline &&
          dayjs().isAfter(dayjs(task.deadline))
        ) {
          employee.overdue += 1;
        }

        // 未完成任务数
        if (task.status !== '已完成') {
          employee.pending += 1;
        }
      }

    });

    // 转换为数组并排序
    const sortedEmployees = Array.from(employeeMap.entries()).sort((a, b) => b[1].completed - a[1].completed);

    // 更新 contributionData 的响应式数据
    contributionData.value.names = sortedEmployees.map(([id]) =>
      employees.value.find(e => e.employeeId === id)?.name || '未知成员'
    );
    contributionData.value.values = sortedEmployees.map(([, data]) => ({
      total: data.total,
      completed: data.completed,
      overdue: data.overdue,
      pending: data.pending
    }));
    contributionData.value.completed = sortedEmployees.map(([, data]) => data.completed);
    contributionData.value.pending = sortedEmployees.map(([, data]) => data.pending);
    contributionData.value.overdue = sortedEmployees.map(([, data]) => data.overdue);

    // KPI 数据
    contributionData.value.topPerformer = {
      name: sortedEmployees[0]?.[1].completed > 0
        ? employees.value.find(e => e.employeeId === sortedEmployees[0][0])?.name || ""
        : "", // 如果没有最佳执行者，返回空字符串
      count: sortedEmployees[0]?.[1].completed || 0
    };

    contributionData.value.totalOverdue = Array.from(employeeMap.values()).reduce((sum, m) => sum + m.overdue, 0);
    contributionData.value.sortedEmployees = sortedEmployees.map(([id, data]) => ({ id, ...data }));
  };

  return {
    teams, // 团队列表
    teamDetail,
    teamMembers,
    currentEmployee,
    employees,
    availableTeams, // 员工所在的团队列表
    employeeOperationLogs,
    contributionData,
    getTeamList,
    getTeamByemployId,
    createNewTeam,
    updateTeamInfo,
    deleteTeamById,
    getTeamById,
    getEmployeeById,
    updateEmployee,
    addMember,
    removeMember,
    getTeamMembers,
    getEmployees,
    getName,
    updateContributionData,
    // getEmployeeOperationLogs
  };
});