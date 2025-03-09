import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  fetchTaskById,
  fetchTasksByStatus,
  fetchTasks,
  createTask,
  updateOldTask,
  deleteTask,
  fetchCommentsByTaskId,
  addComment,
  fetchTasksByUser,
  fetchEmployees,
  fetchUserRole,
  fetchOperationLogs,
  updateTaskScheduling,
  fetchTaskOverview,
  fetchEmployeeTaskCompletion,
} from '@/api/task';
import { createToast } from 'mosha-vue-toastify';
import type { Task, OperationLog } from '@/types/task';
import type { Comment } from '@/types/comment';
import type { Employee } from '@/types/team';
import { safeDate } from '@/utils/convert';

export const useTaskStore = defineStore('task', () => {
  /** 任务列表 */
  const tasks = ref<Task[]>([]);
  /** 单个任务详情 */
  const taskDetail = ref<Task | null>(null);
  /** 任务评论 */
  const comments = ref<Comment[]>([]);
  /** 员工列表 */
  const employees = ref<Employee[]>([]);
  /** 用户角色 */
  const userRole = ref<{ authorities: string }>({ authorities: '' });
  /** 操作日志 */
  const operationLogs = ref<OperationLog[]>([]);
  /** 任务概览数据 */
  const taskOverview = ref<{
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
  }>({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });

  /** 员工任务完成情况数据 */
  const employeeTaskCompletion = ref<
    Array<{ name: string; completed: number; pending: number; overdue: number; month: string }>
  >([]);

  /** 错误信息 */
  const errorMessage = ref<string>('');

  /** 计算属性：已完成任务数量 */
  const completedTasksCount = computed(() =>
    tasks.value.filter((task) => task.status === '已完成').length
  );

  /** 处理日志时间格式 */
  const processLog = (log: any): OperationLog => ({
    ...log,
    time: safeDate(log.timestamp),
  });

  // 根据项目筛选任务
  const getTasksByProject = computed(() => (projectId: string) => {
    return tasks.value.filter(t => t.projectId === projectId)
  })

  /** 获取所有任务 */
  const getAllTasks = async (): Promise<Task[]> => {
    try {
      const data = await fetchTasks();
      tasks.value = data;
      return data;
    } catch (error) {
      errorMessage.value = '获取任务列表失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      return [];
    }
  };

  /** 根据任务 ID 获取任务详情 */
  const getTaskById = async (taskId: string): Promise<Task | null> => {
    try {
      const data = await fetchTaskById(taskId);
      if (data) {
        taskDetail.value = data;
        return data;
      } else {
        taskDetail.value = null;
        errorMessage.value = '任务不存在';
        createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
        return null;
      }
    } catch (error) {
      taskDetail.value = null;
      errorMessage.value = '获取任务详情失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      return null;
    }
  };

  /** 根据参与人员获取任务列表 */
  const getTasksByUser = async (): Promise<Task[]> => {
    try {
      const data = await fetchTasksByUser();
      tasks.value = data;
      return data;
    } catch (error) {
      errorMessage.value = '获取任务列表失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      return [];
    }
  };

  /** 根据任务状态获取任务列表 */
  const getTasksByStatus = async (status: '待处理' | '进行中' | '已完成'): Promise<Task[]> => {
    try {
      const data = await fetchTasksByStatus(status);
      tasks.value = data;
      return data;
    } catch (error) {
      errorMessage.value = '获取任务列表失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      return [];
    }
  };

  /** 获取任务评论 */
  const getCommentsByTaskId = async (taskId: string): Promise<Comment[]> => {
    try {
      const data = await fetchCommentsByTaskId(taskId);
      comments.value = data;
      return data;
    } catch (error) {
      errorMessage.value = '获取评论失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      return [];
    }
  };

  /** 提交新评论 */
  const submitComment = async (taskId: string, comment: Comment): Promise<void> => {
    try {
      await addComment(taskId, comment);
      createToast('评论提交成功', { position: 'top-center', showIcon: true, type: 'success' });
      await getCommentsByTaskId(taskId);
    } catch (error) {
      errorMessage.value = '提交评论失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
    }
  };

  /** 创建新任务 */
  const createNewTask = async (taskData: Task): Promise<Task> => {
    try {
      const newTask = await createTask(taskData);
      tasks.value.push(newTask);
      createToast('任务创建成功', { position: 'top-center', showIcon: true, type: 'success' });
      return newTask;
    } catch (error) {
      errorMessage.value = '创建任务失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      throw error;
    }
  };

  /** 更新任务 */
  const updateTask = async (taskId: string, updatedTask: Partial<Task>): Promise<void> => {
    try {
      const updatedTaskResponse = await updateOldTask(taskId, updatedTask);

      const taskIndex = tasks.value.findIndex((task) => task.id === taskId);
      if (taskIndex !== -1) {
        tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...updatedTask };
      }

      createToast('任务更新成功', { position: 'top-center', showIcon: true, type: 'success' });
    } catch (error) {
      errorMessage.value = '更新任务失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
    }
  };

  /** 删除任务 */
  const deleteTaskById = async (id: string): Promise<void> => {
    try {
      await deleteTask(id);
      tasks.value = tasks.value.filter((task) => task.id !== id);
      createToast('任务删除成功', { position: 'top-center', showIcon: true, type: 'success' });
    } catch (error) {
      errorMessage.value = '删除任务失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
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

  /** 获取用户角色 */
  const getUserRole = async (): Promise<string> => {
    try {
      const data = await fetchUserRole();
      userRole.value = data;
      return data.authorities;
    } catch (error) {
      errorMessage.value = '获取用户角色失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      return 'null';
    }
  };

  /** 获取操作日志 */
  const getOperationLogs = async (): Promise<OperationLog[]> => {
    try {
      const data = await fetchOperationLogs();
      operationLogs.value = data;
      return data.map(processLog);
    } catch (error) {
      errorMessage.value = '获取操作日志失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      return [];
    }
  };

  /** 开始任务调度 */
  const startTaskScheduling = async (): Promise<void> => {
    try {
      await startTaskScheduling();
      await getAllTasks();
      await fetchOperationLogs();
      createToast('任务调度成功', { position: 'top-center', showIcon: true, type: 'success' });
    } catch (error) {
      errorMessage.value = '任务调度失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
    }
  };

  /** 更新任务调度 */
  const updateTaskSchedule = async (taskId: string, scheduledTime: string): Promise<void> => {
    try {
      await updateTaskScheduling(taskId, scheduledTime);
      await getAllTasks();
      await getOperationLogs();
      createToast('任务调度调整成功', { position: 'top-center', showIcon: true, type: 'success' });
    } catch (error) {
      errorMessage.value = '保存任务调度失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
    }
  };

  /** 获取任务概览数据 */
  const getTaskOverview = async () => {
    try {
      const data = await fetchTaskOverview();
      taskOverview.value = data;
    } catch (error) {
      errorMessage.value = '获取任务概览失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
    }
  };

  /** 获取员工任务完成情况数据 */
  const getEmployeeTaskCompletion = async () => {
    try {
      const data = await fetchEmployeeTaskCompletion();
      if (data && data.length > 0) {
        employeeTaskCompletion.value = data;
      } else {
        employeeTaskCompletion.value = [];
      }
    } catch (error) {
      errorMessage.value = '获取员工任务完成情况失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      employeeTaskCompletion.value = [];
    }
  };

  return {
    tasks,
    taskDetail,
    comments,
    employees,
    userRole,
    operationLogs,
    taskOverview,
    employeeTaskCompletion,
    completedTasksCount,
    getTasksByProject,
    getAllTasks,
    getTaskById,
    getTasksByUser,
    getTasksByStatus,
    getCommentsByTaskId,
    submitComment,
    createNewTask,
    updateTask,
    deleteTaskById,
    getEmployees,
    getUserRole,
    getOperationLogs,
    updateTaskSchedule,
    startTaskScheduling,
    getTaskOverview,
    getEmployeeTaskCompletion,
  };
});