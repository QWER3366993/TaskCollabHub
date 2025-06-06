<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTaskStore } from '@/stores/task';
import { useUserStore } from '@/stores/user';
import { useTeamStore } from '@/stores/team';
import type { Task } from '@/types/task';
import type { Employee } from '@/types/team';
import dayjs from 'dayjs';

const router = useRouter();
const taskStore = useTaskStore();
const userStore = useUserStore();
const teamStore = useTeamStore();
const tasks = ref<Task[]>([]);
const employees = ref<Employee[]>([]);

const isAdmin = computed(() =>
  userStore.user?.authorities?.includes('ROLE_ADMIN') ||
  userStore.user?.authorities?.includes('ROLE_Manager')
);

// 定义 headers
const headers = ref([
  { title: '标题', value: 'title' },
  { title: '状态', value: 'status' },
  { title: '负责人', value: 'employeeId' },
  { title: '截止时间', value: 'deadline' },
  { title: '操作', value: 'actions', sortable: true }
]);
//排序规则
// const sortOrder = ref([{ key: 'deadline', order: 'asc' as 'asc' | 'desc' }]);

const projects = computed(() => {
  return [{ id: null, title: '全部' }, ...taskStore.projects.map(project => ({
    id: project.projectId,
    title: project.title
  }))];
});

const loadProjects = async () => {
  try {
    await taskStore.getAllProjects();
  } catch (error) {
    console.error('加载项目失败:', error);
  }
};

// 加载任务列表
const loadTasks = async () => {
  try {
    const result = await taskStore.getAllTasks(); // 确保先加载数据
    if (Array.isArray(taskStore.tasks)) {
      tasks.value = result;
    }
  } catch (error) {
    throw error;
  }
};

// 加载员工列表
const loadEmployees = async () => {
  try {
    const result = await teamStore.getEmployees();
    if (Array.isArray(result)) {
      employees.value = result;
    } else {
      console.error('接口返回值异常:', result);
    }
  } catch (error) {
    console.error('加载员工失败:', error);
  }
};

// 创建任务跳转
const createTask = () => {
  router.push({ name: 'taskscheduling', params: { id: 'new' } });
};

// 编辑跳转
const editTask = (task: Task) => {
  if (task.projectId) {
    // 项目任务跳转
    router.push({
      name: 'ProjectTaskDetail',
      params: {
        projectId: task.projectId,
        taskId: task.taskId
      }
    })
  } else {
    // 独立任务跳转
    router.push({
      name: 'IndependentTaskDetail',
      params: {
        taskId: task.taskId
      }
    })
    console.log('编辑跳转', task.taskId)
  }
}

// 删除任务
const deleteDialog = ref(false);       // 删除确认弹窗控制
const taskToDeleteId = ref<string | null>(null);  // 待删除任务ID

// 打开删除确认弹窗
const confirmDeleteTask = (taskId: string) => {
  taskToDeleteId.value = taskId;
  deleteDialog.value = true;
};

// 删除任务并关闭弹窗
const deleteTask = async () => {
  if (!taskToDeleteId.value) return;
  try {
    await taskStore.deleteTaskById(taskToDeleteId.value);
    await filterTasksByProject() // 初始加载所有任务
  } catch (error) {
    console.error('删除任务失败:', error);
  } finally {
    deleteDialog.value = false;
    taskToDeleteId.value = null;
  }
};

// 状态过滤器
const statusOptions = ['全部', '待处理', '进行中', '已完成'];
const selectedStatus = ref('全部');

// 搜索功能
const searchQuery = ref('');

// 任务状态判断（时间计算方法)
const calculateTimeRemaining = (deadline?: string) => {
  if (!deadline) return '';

  const now = dayjs();
  const deadlineDayjs = dayjs(deadline);
  const diffHours = deadlineDayjs.diff(now, 'hour');

  if (diffHours > 24) return `${Math.floor(diffHours / 24)}天`;
  if (diffHours > 0) return `${diffHours}小时`;
  return '已过期';
};

const selectedProjectId = ref<string | null>(null);

// 根据所选项目过滤任务
const filterTasksByProject = async () => {
  if (selectedProjectId.value) {
    await taskStore.getProjectTasks(selectedProjectId.value);
  } else {
    await taskStore.loadAllTasksWithProjects(); // 使用新的合并方法
  }
};
// 过滤后的任务列表
const filteredTasks = computed(() => {
  if (!Array.isArray(taskStore.allTasks)) {
    console.error('allTasks 不是数组:', taskStore.tasks)
    return []
  }
  return taskStore.allTasks.filter(task => {
    const matchesProject = !selectedProjectId.value || task.projectId === selectedProjectId.value;
    const matchesStatus = selectedStatus.value === '全部' || task.status === selectedStatus.value;
    const matchesSearch = (String(task.title || '').toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (String(task.description || '').toLowerCase().includes(searchQuery.value.toLowerCase()));
    return matchesProject && matchesStatus && matchesSearch;
  });
});



// 状态颜色映射
const statusColor = (status: string) => {
  const colors: Record<string, string> = {
    '待处理': 'warning',
    '进行中': 'primary',
    '已完成': 'success'
  };
  return colors[status] || 'secondary';
};

// 状态图标映射
const statusIcon = (status: string) => {
  const icons: Record<string, string> = {
    '待处理': 'flag_circle',
    '进行中': 'play_circle',
    '已完成': 'check_circle'
  }
  return icons[status] || 'help'
}


// // 创建员工映射关系（id-name）(优化：创建store替换该方法)
// const employeeMap = computed(() => {
//   return new Map(
//     taskStore.employees.map(emp => [emp.employeeId.toString(), emp.name])
//   );
// });

onMounted(async () => {
  await userStore.getUserInfo();
  await loadEmployees(); //先加载员工数据再加载任务（防止getName在员工数据未就绪时被调用）
  await loadProjects(); // 先加载项目
  await filterTasksByProject() // 初始加载所有任务
  await taskStore.loadAllTasksWithProjects(); // 加载项目及独立任务到 allTasks

});
</script>

<template>
  <v-container class="task-management">
    <!-- 顶部操作栏 -->
    <v-row class="mb-3">
      <!-- 左侧搜索和筛选 -->
      <v-col cols="12" md="8" class="d-flex align-center gap-4" style="gap: 16px;">
        <!-- 搜索框 -->
        <v-text-field v-model="searchQuery" label="搜索任务" prepend-inner-icon="search" density="comfortable"
          variant="outlined" class="search-box" hide-details single-line></v-text-field>

        <!-- 任务状态筛选框 -->
        <v-select v-model="selectedStatus" :items="statusOptions" label="筛选状态" prepend-inner-icon="filter_alt"
          density="comfortable" hide-details variant="outlined" class="filter-box"></v-select>

        <!-- 项目筛选框 -->
        <v-select v-model="selectedProjectId" :items="projects" item-title="title" item-value="id" label="筛选项目"
          prepend-inner-icon="filter_alt" density="comfortable" hide-details variant="outlined" class="filter-box">
        </v-select>
      </v-col>

      <!-- 右侧新建按钮 -->
      <v-col cols="12" md="4" class="d-flex justify-end">
        <v-btn color="primary" @click="createTask" class="new-task-btn" height="48" prepend-icon="add">
          <template #prepend>
            <v-icon size="24"></v-icon>
          </template>
          新建任务
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card>
          <!-- 表格 -->
          <v-data-table :headers="headers" :items="filteredTasks" :sort-by="[{ key: 'title', order: 'asc' }]"
            :items-per-page="10" style="width: 100%">
            <!-- 状态列 -->
            <template #item.status="{ item }">
              <v-chip :color="statusColor(item.status)" label :prepend-icon="statusIcon(item.status)"
                class="status-chip">

                {{ item.status }}
              </v-chip>
            </template>

            <!-- 负责人列 -->
            <template #item.employeeId="{ item }">
              <div>
                <v-avatar size="32" color="primary" class="mr-2">
                  <!-- 如果 item.employeeId 存在，显示该 ID 的第一个字符 -->
                  <span class="text-white">{{ item.employeeId ? item.employeeId.charAt(0) : '' }}</span>
                </v-avatar>
                {{ teamStore.getName(item.employeeId) }}
              </div>
            </template>

            <!-- 截止时间列 -->
            <template #item.deadline="{ item }">
              <div>
                <v-icon color="grey-darken-1" class="mr-2" size="18">
                  alarm
                </v-icon>
                <!-- 任务过期则爆红 -->
                <span :class="{ 'text-red': dayjs(item.deadline).isBefore(dayjs().add(1, 'day')) }">
                  {{ dayjs(item.deadline).format('YYYY/MM/DD HH:mm') }}
                </span>
                <v-tooltip location="bottom">
                  <template #activator="{ props }">
                    <!-- 任务时间提示 -->
                    <span v-bind="props" class="ml-1 text-caption text-grey">
                      ({{ dayjs(item.deadline).fromNow() }})
                    </span>
                  </template>
                  <span>剩余时间</span>
                </v-tooltip>
              </div>
            </template>

            <!-- 操作列 -->
            <template #item.actions="{ item }">
              <div class="action-buttons">
                <v-tooltip text="编辑">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon variant="text" color="primary" @click="editTask(item)">
                      <v-icon>edit</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
                <!-- 添加v-if="isAdmin"，普通员工不可见 -->
                <v-tooltip text="删除" v-if="isAdmin">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon variant="text" color="grey" @click="confirmDeleteTask(item.taskId)">
                      <v-icon>delete</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
    <!-- 删除确认弹窗 -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="headline">确认删除任务</v-card-title>
        <v-card-text>
          <span>确定要删除此任务吗？删除后无法恢复。</span>
        </v-card-text>
        <v-card-actions>
          <v-btn color="red" @click="deleteTask">确认删除</v-btn>
          <v-btn @click="deleteDialog = false">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
/* 统一搜索框和筛选框的样式 */
.search-box,
.filter-box {
  :deep(.v-field) {
    height: 48px;
    /* 设置统一高度 */
    align-items: center;
    /* 垂直居中 */
  }
}

/* 新建任务按钮样式 */
.new-task-btn {
  /* 添加圆角 */
  border-radius: 8px;
  /* 调整内边距 */
  padding: 0 24px;
  /* 调整字体大小 */
  font-size: 18px;
  letter-spacing: normal;

  transition: all 0.3s ease;

  /* 鼠标悬停时，向下移动1像素 */
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

/* 状态图标样式 */
.status-chip {
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

/* 悬停操作按钮 */
.action-buttons {
  opacity: 0.5;
  transition: opacity 0.3s ease;

  .v-data-table__tr:hover & {
    opacity: 1;
  }
}
</style>
