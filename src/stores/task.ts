import { defineStore } from 'pinia';
import { ref, computed, nextTick } from 'vue';
import {
  fetchTaskById,
  // fetchTasksByStatus,
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
  downloadFile,
  deleteFile
} from '@/api/task';
import { createToast } from 'mosha-vue-toastify';
import type { Task, OperationLog, FileItem, TaskCreateDTO } from '@/types/task';
import type { Comment } from '@/types/comment';
import type { Employee } from '@/types/team';
import { safeDate } from '@/utils/convert';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
export const useTaskStore = defineStore('task', () => {
  /** 任务列表 */
  const tasks = ref<Task[]>([]);
  /** 单个任务详情 */
  const taskDetail = ref<Task>();
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
  const recentVisits = ref<Array<{ id: string; title: string; time: string }>>([]);
  const files = ref<FileItem[]>([]);
  const currentTaskId = ref('');
  const uploadProgress = ref(0);
  const currentScope = ref<'task' | 'public'>('task');
  //  保持全局加载状态
  const downloadLoading = ref(false);
  // 高亮显示当前操作项
  const currentDownloadingId = ref<string | null>(null);
  // 跟踪所有进行中的下载
  const downloadingIds = ref<string[]>([])

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

  interface FileState {
    downloadingIds: string[] // 正在下载的文件ID列表
  }

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
      const data = await fetchTaskById(taskId);
      console.log('[Store] 原始API响应:', data);
      if (!data) {
        throw new Error('任务不存在');
      }
      taskDetail.value = data; // 确保 data 不为 null
      console.log('[Store] 更新后数据:', taskDetail.value);
      // 记录查看日志
      recordViewLog(data);
      return taskDetail.value;
    } catch (error) {
      console.error('获取任务失败:', error);
      throw error; // 抛出错误，由组件决定是否清空数据
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

  // /** 根据任务状态获取任务列表 */
  // const getTasksByStatus = async (status: '待处理' | '进行中' | '已完成'): Promise<Task[]> => {
  //   try {
  //     const data = await fetchTasksByStatus(status);
  //     tasks.value = data;
  //     return data;
  //   } catch (error) {
  //     errorMessage.value = '获取任务列表失败';
  //     createToast(errorMessage.value, { position: 'top-center', showIcon: true, type: 'danger' });
  //     return [];
  //   }
  // };

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
  const createNewTask = async (taskData: TaskCreateDTO): Promise<Task> => {
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
      if (!originalTask) {
        throw new Error('任务不存在');
      }
      // 检测变更
      const changes = detectChanges(originalTask, updatedTask);

      // 调用API
      const updatedTaskResponse = await updateOldTask(taskId, updatedTask);

      // 更新本地数据
      tasks.value = tasks.value.map(task => {
        if (task.id === taskId) {
          return { ...task, ...updatedTaskResponse };
        }
        return task;
      });

      // 记录操作日志
      addOperationLog({
        taskId,
        employeeId: userStore.user.userId as string, // 类型断言
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


  // 查看日志记录
  const recordViewLog = (task: Task) => {
    // 1. 检查 store 是否存在
    if (!userStore) {
      console.warn('Store 未初始化，无法记录日志');
      return;
    }

    // 2. 检查用户数据是否存在
    if (!userStore.user.userId) {
      console.warn('用户未登录，跳过日志记录');
      return;
    }

    // 3. 检查任务数据是否存在
    if (!task?.id) {
      console.warn('任务数据无效，无法记录日志');
      return;
    }

    // 安全执行日志记录
    addOperationLog({
      taskId: task.id,
      employeeId: userStore.user.userId,
      operationType: 'view',
      operation: `查看任务：${task.title || '无标题任务'}`,
      time: new Date().toISOString()
    });

    // 更新访问记录（示例逻辑）
    if (recentVisits.value) {
      const existingIndex = recentVisits.value.findIndex(v => v.id === task.id);
      if (existingIndex > -1) {
        recentVisits.value[existingIndex].time = new Date().toISOString();
      } else {
        recentVisits.value.unshift({
          id: task.id,
          title: task.title || '新任务',
          time: new Date().toISOString()
        });
      }
      recentVisits.value = recentVisits.value.slice(0, 5);
    }
  };

  /** 删除任务 */
  const deleteTaskById = async (id: string): Promise<void> => {
    try {
      // 先记录删除日志
      addOperationLog({
        taskId: id,
        employeeId: userStore.user.userId as string, // 类型断言
        operationType: 'delete',
        operation: '删除任务',
        time: new Date().toISOString()
      });

      // 延迟删除以便日志显示
      await nextTick();

      // 执行删除操作
      await deleteTask(id);
      tasks.value = tasks.value.filter((task) => task.id !== id);

      // 清理相关日志
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
      const data = await fetchOperationLogs()
      console.log("操作日志数据：", data);

      // 添加类型校验
      if (!Array.isArray(data)) {
        throw new Error('Invalid operation logs format')
      }
      operationLogs.value = data.map(processLog) // 确保处理后的数据格式正确

      return operationLogs.value
    } catch (error) {
      console.error('获取操作日志失败:', error)
      operationLogs.value = [] // 确保重置为空数组
      return []
    }
  }

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

  const downloadFiles = async (file: FileItem) => {
    try {
      downloadingIds.value.push(file.id)
      downloadLoading.value = true
      currentDownloadingId.value = file.id

      // 添加扩展名补全逻辑
      const fileNameWithExtension = file.name.includes('.')
        ? file.name
        : `${file.name}.${file.type.split('/')[1] || ''}`

      await downloadFile(file.id, fileNameWithExtension)

      createToast(`文件 ${file.name} 下载成功`, { type: 'success' })
    } catch (error) {
      console.error('下载失败:', error)
      createToast('文件损坏或下载失败', {
        position: 'top-center',
        type: 'danger',
      })
    } finally {
      downloadingIds.value = downloadingIds.value.filter(id => id !== file.id)
      downloadLoading.value = downloadingIds.value.length > 0
      currentDownloadingId.value = downloadingIds.value[0] || null
    }
  }

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
    downloadingIds,
    recentVisits,
    getAllTasks,
    getTaskById,
    getTasksByUser,
    // getTasksByStatus,
    getCommentsByTaskId,
    submitComment,
    createNewTask,
    recordViewLog,
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
    downloadFiles,
    removeFile
  };
});