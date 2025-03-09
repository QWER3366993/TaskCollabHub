<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTaskStore } from '@/stores/task';
import { useUserStore } from '@/stores/user';
import type { Task } from '@/types/task';
import type { Comment } from '@/types/comment';
import dayjs from 'dayjs';

const router = useRouter();
const taskStore = useTaskStore();
const userStore = useUserStore();
// const tasks = ref<Task[]>([]);

const tasks = ref<Task[]>([
  {
    teamId: '1',
    id: '1',
    title: '任务1',
    description: '这是任务1的描述',
    status: '待处理',
    priority: '低',
    assignedTo: '张三',
    creator: '李四',
    scheduledTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    deadline: dayjs().add(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
    comments: [
      {
        user: {
          avatar: 'https://www.baidu.com/img/bdlogo.png',
          name: '张三'
        },
        content: '需要优先处理前端部分',
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
    ] as Comment[]
  },
  {
    teamId: '2',
    id: '2',
    title: '任务2',
    description: '这是任务2的描述',
    status: '进行中',
    priority: '中',
    assignedTo: '李四1',
    creator: '王五11',
    scheduledTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    deadline: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  },
]);

const isAdmin = computed(
  () => userStore.user.authorities?.includes('manager'));

// 定义 headers
const headers = ref([
  { text: '标题', value: 'title' },
  { text: '状态', value: 'status' },
  { text: '负责人', value: 'assignedTo' },
  { text: '截止时间', value: 'deadline' },
  { text: '操作', value: 'actions', sortable: false }
]);

// 加载任务列表
const loadTasks = async () => {
  try {
    await taskStore.getAllTasks();
    console.log('任务数据:', taskStore.tasks); // 调试信息
    tasks.value = taskStore.tasks;
  } catch (error) {
    console.error('加载任务失败:', error);
  }
};

// 创建任务
const createTask = () => {
  router.push({ name: 'taskscheduling', params: { id: 'new' } });
};

// 编辑任务
const editTask = (taskId: string) => {
  router.push({ name: 'taskdetail', params: { id: taskId } });
};

// 删除任务
const deleteTask = async (taskId: string) => {
  try {
    await taskStore.deleteTaskById(taskId);
    await loadTasks();
  } catch (error) {
    console.error('删除任务失败:', error);
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

  if (diffHours > 24) return `${Math.floor(diffHours/24)}天`;
  if (diffHours > 0) return `${diffHours}小时`;
  return '已过期';
};

// 过滤后的任务列表
const filteredTasks = computed(() => {
  // 先过滤再转换
  return tasks.value
    .filter(task => {
      const matchesStatus = selectedStatus.value === '全部' || 
                           task.status === selectedStatus.value;
      const matchesSearch = task.title.includes(searchQuery.value) || 
                           task.description.includes(searchQuery.value);
      return matchesStatus && matchesSearch;
    })
    .map(task => ({
      ...task,
      deadlineDisplay: task.deadline ? dayjs(task.deadline).format('MM/DD HH:mm') : '未设置',
      timeRemaining: calculateTimeRemaining(task.deadline),
      isExpired: task.deadline ? dayjs(task.deadline).isBefore(dayjs()) : false
    }));
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

onMounted(loadTasks);
</script>

<template>
  <v-container>
    <v-row align="center">
      <v-col  >
        <v-text-field v-model="searchQuery" label="搜索任务" prepend-inner-icon="search" density="comfortable"
          variant="outlined" />
      </v-col>
      <v-col >
        <v-select v-model="selectedStatus" :items="statusOptions" label="筛选状态" prepend-inner-icon="filter_alt" variant="outlined" />
      </v-col>
      <v-col >
        <v-btn color="primary" prepend-icon="add" @click="createTask" >
          新建任务
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col >
        <v-card >
          <v-data-table :headers="headers" :items="filteredTasks" :items-per-page="10">
            <!-- 状态列 -->
            <template #item.status="{ item }">
              <v-chip :color="statusColor(item.status)" label>
                <v-icon start>
                  {{
                    item.status === '待处理' ? 'mdi-alert-circle' :
                      item.status === '进行中' ? 'mdi-progress-clock' :
                        'mdi-check-circle'
                  }}
                </v-icon>
                {{ item.status }}
              </v-chip>
            </template>

            <!-- 负责人列 -->
            <template #item.assignedTo="{ item }">
              <div>
                <v-avatar size="32" color="primary" class="mr-2">
                  <span class="text-white">{{ item.assignedTo.charAt(0) }}</span>
                </v-avatar>
                {{ item.assignedTo }}
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
                  {{ dayjs(item.deadline).format('MM/DD HH:mm') }}
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
              <div>
                <v-tooltip text="编辑">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon variant="text" color="primary" @click="editTask(item.id)">
                      <v-icon>edit</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip text="删除"> // 添加v-if="isAdmin"，普通员工不可见
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon variant="text" color="grey" @click="deleteTask(item.id)">
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
  </v-container>
</template>

<style scoped>

</style>

