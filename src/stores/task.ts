import { defineStore } from 'pinia';
import { ref, computed, nextTick } from 'vue';
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
  fetchUserRole,
  fetchOperationLogs,
  updateTaskScheduling,
  fetchTaskOverview,
  fetchEmployeeTaskCompletion,
  fetchPublicFiles,
  uploadPublicFile,
  fetchTaskFiles,
  uploadTaskFile,
  deleteFile
} from '@/api/task';
import { createToast } from 'mosha-vue-toastify';
import type { Task, OperationLog, FileItem } from '@/types/task';
import type { Comment } from '@/types/comment';
import type { Employee } from '@/types/team';
import { safeDate } from '@/utils/convert';
import useStore from 'element-plus/es/components/table/src/store/index.mjs';

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

  //日志
  const loading = ref(false);

  const files = ref<FileItem[]>([]);
  const currentTaskId = ref('');
  const uploadProgress = ref(0);
  const currentScope = ref<'task' | 'public'>('task'); 

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

  /** 操作日志映射表（taskId -> logs） */
  const taskOperationLogs = ref<Record<string, OperationLog[]>>({});

  /** 获取指定任务的操作日志 */
  const getTaskOperations = computed(() => (taskId: string) => {
    return taskOperationLogs.value[taskId] || []
  })

  // 根据项目筛选任务
  const getTasksByProject = computed(() => (projectId: string) => {
    return tasks.value.filter(t => t.projectId === projectId)
  })

  // ==================== 任务 ====================
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
      return await fetchTaskById(taskId);
    } catch (error) {
      taskDetail.value = null;
      errorMessage.value = '获取任务详情失败';
      createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
      return null;
    }
  };

  /** 根据参与人员获取任务列表 */
  const getTasksByUser = async (userId: string): Promise<Task[]> => {
    try {
      const data = await fetchTasksByUser(userId);
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
      // 查找原任务
      const originalTask = tasks.value.find(t => t.id === taskId);
      if (!originalTask) throw new Error('任务不存在');

      // 检测变更
      const changes = detectChanges(originalTask, updatedTask);

      // 调用API
      const updatedTaskResponse = await updateOldTask(taskId, updatedTask);

      // 更新本地数据
      const taskIndex = tasks.value.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks.value[taskIndex] = {
          ...tasks.value[taskIndex],
          ...updatedTask
        };
      }

      // 记录操作日志
      addOperationLog({
        taskId,
        employeeId: useStore().user.id,
        operationType: 'update',
        operation: `修改了 ${Object.keys(changes).join(', ')}`,
        details: changes,
        time: new Date().toISOString()
      });

      createToast('任务更新成功', {
        position: 'top-center',
        showIcon: true,
        type: 'success'
      });
    } catch (error) {
      errorMessage.value = '更新任务失败: ' + (error as Error).message;
      createToast(errorMessage.value, {
        position: 'top-center',
        showIcon: true,
        type: 'danger'
      });
    }
  };


  /** 删除任务 */
  const deleteTaskById = async (id: string): Promise<void> => {
    try {
      // 先记录删除日志
      addOperationLog({
        taskId: id,
        employeeId: useStore().user.id,
        operationType: 'delete',
        operation: '删除任务',
        time: new Date().toISOString()
      });

      // 延迟删除以便日志显示
      await nextTick();

      // 执行删除操作
      await deleteTask(id);
      tasks.value = tasks.value.filter((task) => task.id !== id);

      // 清理相关日志（可选）
      operationLogs.value = operationLogs.value.filter(log => log.taskId !== id);

      createToast('任务删除成功', {
        position: 'top-center',
        showIcon: true,
        type: 'success'
      });
    } catch (error) {
      errorMessage.value = '删除任务失败';
      createToast(errorMessage.value, {
        position: 'top-center',
        showIcon: true,
        type: 'danger'
      });
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

  // 日志 
  /** 生成唯一ID */
  const generateLogId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  /** 变更检测工具函数 */
  const detectChanges = (original: Task, updated: Partial<Task>) => {
    const changes: Record<string, { old: any; new: any }> = {};
    Object.entries(updated).forEach(([key, newVal]) => {
      const oldVal = original[key as keyof Task];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes[key] = { old: oldVal, new: newVal };
      }
    });
    return changes;
  };

  /** 添加操作日志 */
  const addOperationLog = (log: Omit<OperationLog, 'id'>) => {
    const fullLog: OperationLog = {
      ...log,
      id: generateLogId()
    };
    // 同时更新任务对象的operations字段
    const task = tasks.value.find(t => t.id === log.taskId);
    if (task) {
      task.operations = [...(task.operations || []), fullLog];
    }
  };

  // ==================== 文件 ====================
  const getFiles = async () => {
    loading.value = true;
    try {
      if (currentScope.value === 'task' && currentTaskId.value) {
        const data = await fetchTaskFiles(currentTaskId.value);
        files.value = data
        return data
      } else {
        const data = await fetchPublicFiles();
        files.value = data
        return data
      }
    } catch (error) {
      console.error(error);
    } finally {
      loading.value = false;
    }
  };

  const uploadFile = async (formData: FormData) => {
    loading.value = true;
    try {
      uploadProgress.value = 0;
      const progressHandler = (progress: number) => {
        uploadProgress.value = progress;
      };
      const config = {
        onUploadProgress: (progressEvent: ProgressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          progressHandler(percentCompleted);
        },
      };
      if (currentScope.value === 'task' && currentTaskId.value) {
        await uploadTaskFile(currentTaskId.value, formData);
      } else {
        await uploadPublicFile(formData);
      }
      await getFiles();
    } catch (error) {
      console.error(error);
    } finally {
      uploadProgress.value = 0;
      loading.value = false;
    }
  };

  const removeFile = async (fileId: string) => {
    await deleteFile(fileId);
    files.value = files.value.filter((f) => f.id !== fileId);
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
    getTaskOperations,
    files,
    loading,
    uploadProgress,
    currentTaskId,
    currentScope,
    getAllTasks,
    getTaskById,
    getTasksByUser,
    getTasksByStatus,
    getCommentsByTaskId,
    submitComment,
    createNewTask,
    updateTask,
    deleteTaskById,
    getUserRole,
    getOperationLogs,
    updateTaskSchedule,
    startTaskScheduling,
    getTaskOverview,
    getEmployeeTaskCompletion,
    addOperationLog,
    detectChanges,
    getFiles,
    uploadFile,
    removeFile
  };
});