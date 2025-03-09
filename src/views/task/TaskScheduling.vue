<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import dayjs from 'dayjs';
import { useRoute, useRouter } from 'vue-router';
import { useTaskStore } from '@/stores/task';
import type { Task } from '@/types/task';
import type { Project } from '@/types/project';
import { useTeamStore } from '@/stores/team';
import type { Employee, Team } from '@/types/team';
import { useProjectStore } from '@/stores/project';

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const projectStore = useProjectStore();
const team = ref<Team[]>([])
const members = ref<Employee[]>([]); // 分配成员列表
const teamStore = useTeamStore();
const deadlineMenu = ref<boolean[]>([]); // 控制每个任务的截止时间选择器的显示
const reminderMenu = ref<boolean[]>([]); // 控制每个任务的提醒时间选择器的显示
// 动态更新当前时间
const currentTime = ref<string>(''); // 用于存储动态更新的时间

// 新增状态
const publishMode = ref<'task' | 'project'>('task') // 默认独立任务模式

// 更新当前时间
const updateTime = () => {
  const now = new Date();
  const date = now.toLocaleDateString();  // 获取当前日期
  const time = now.toLocaleTimeString();  // 获取当前时间
  currentTime.value = `${date} ${time}`;  // 格式化为 "yyyy-MM-dd HH:mm:ss"
};
// 格式化日期函数
const formatDate = (date: string | undefined): string => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '';
};

// 定时更新当前时间
setInterval(updateTime, 1000); // 每秒更新一次

// 初始化时更新一次时间
onMounted(() => {
  updateTime();
});

// 更新截止日期
const updateDeadlineDate = (date: Date | string, index: number) => {
  const newDate = dayjs(date);
  const currentDeadline = dayjs(tasks.value[index].deadline);
  const newDeadline = currentDeadline
    .set('year', newDate.year())
    .set('month', newDate.month())
    .set('date', newDate.date())
    .format('YYYY-MM-DD HH:mm:ss');
  tasks.value[index].deadline = newDeadline;
};

// 更新截止时间
const updateDeadlineTime = (time: string, index: number) => {
  const [hours, minutes] = time.split(':');
  const newDeadline = dayjs(tasks.value[index].deadline)
    .hour(Number(hours))
    .minute(Number(minutes))
    .format('YYYY-MM-DD HH:mm:ss');
  tasks.value[index].deadline = newDeadline;
};

// 更新提醒时间
const updateReminderTime = (time: string, index: number) => {
  tasks.value[index].reminderTime = time;
};

//当前项目列表
const projects = ref<Project[]>([
  {
    id: '',
    title: '',
    description: '',
    teamId: '',
    tasks: [],
    scheduledTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    deadline: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    image: undefined,
    progress: 0
  }

]);

// 当前任务列表
const tasks = ref<Task[]>([
  {
    id: '',
    title: '',
    description: '',
    employeeId: '',
    status: '待处理',
    priority: '低',
    creator: '',
    teamId: '', // 任务所属团队 ID
    scheduledTime: dayjs().format('YYYY-MM-DD HH:mm:ss'), // 初始化为当前时间
    deadline: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    reminderTime: '',
    image: undefined, // 用于存储上传的图片
  }
]);

// 添加新任务
const addTask = () => {
  tasks.value.push({
    id: '',
    title: '',
    description: '',
    employeeId: '',
    status: '待处理',
    priority: '低',
    creator: '',
    teamId: '',
    scheduledTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    deadline: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    reminderTime: '',
    image: undefined,
  });
  deadlineMenu.value.push(false); // 为新增任务初始化截止时间选择器状态
  reminderMenu.value.push(false); // 为新增任务初始化提醒时间选择器状态
};

const props = defineProps<{
  taskId: string;
  projectId: string;
}>();
// 保存所有任务
const saveAllTasks = async () => {
  if (publishMode.value === 'task') {
    try {
      for (const task of tasks.value) {
        if (!task.id) {
          await taskStore.createNewTask(task);
        } else {
          await taskStore.updateTask(props.taskId, task);
        }
      }
      router.push({ name: 'taskmanagement' }); // 返回任务列表页面
    } catch (error) {
      console.error('保存任务失败:', error);
    }
  } else if (publishMode.value === 'project') {
    try {
      for (const project of projects.value) {
        if (!project.id) {
          await projectStore.createNewProject(project);
        } else {
          await projectStore.updateProject(props.projectId, project);
        }
      }
      router.push({ name: 'taskmanagement' }); // 返回任务列表页面
    } catch (error) {
      console.error('保存项目失败:', error);
    }
  }
}

// 处理图片上传
const handleImageUpload = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    tasks.value[index].image = file; // 更新对应任务的图片
  }
};

// 加载团队列表
const loadTeams = async () => {
  try {
    const teams = await teamStore.getTeamList();
    if (Array.isArray(teams)) {
      team.value = teams;
    }
  } catch (error) {
    console.error('加载团队失败:', error)
  }
}

// 获取分配成员列表
const fetchMembers = async (teamId: string): Promise<Employee[]> => {
  try {
    const teamMembers = await teamStore.getTeamMembers(teamId); // 替换为你的后端接口
    return teamMembers; // 返回团队成员列表
  } catch (error) {
    console.error('获取成员列表失败:', error);
    throw error; // 抛出错误，便于调用者处理
  }
};

// 根据任务数量自动计算预计进度
const calculateProgress = computed(() => {
  const total = tasks.value.length
  const assigned = tasks.value.filter(t => t.employeeId).length
  return total > 0 ? Math.round((assigned / total) * 100) : 0
})

// 当选择项目模式时，自动填充团队
watch(
  () => projects.value[0].id,
  (newVal) => {
    if (newVal) {
      tasks.value.forEach(t => {
        t.teamId = newVal // 自动继承项目团队
      })
      fetchMembers(newVal) // 加载团队成员
    }
  }
)

// 初始化
onMounted(async () => {
  updateTime();
  // 初始化时间选择器
  reminderMenu.value = tasks.value.map(() => false);
  // 加载用户所属团队
  const employeeId = route.params.teamId as string;
  await teamStore.getTeamByemployId(employeeId);
  // 默认选中第一个团队
  if (teamStore.teamList.length > 0) {
    projects.value[0].id = teamStore.teamList[0].id
    await teamStore.getTeamMembers(projects.value[0].id)
  }

  const teamId = route.params.teamId as string;
  if (teamId) { // 假设任务对象中有 teamId 字段
    try {
      members.value = await fetchMembers(teamId); // 获取团队成员并赋值
    } catch (error) {
      console.error('加载团队成员失败:', error);
    }
  } else {
    console.error('任务未分配团队');
  }
})
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h2>任务下发</h2>
      </v-col>
      <v-col cols="12">
        <v-form>
          <!-- 模式切换 -->
          <div class="mode-switch mb-4">
            <v-btn-toggle v-model="publishMode" mandatory>
              <v-btn value="task" variant="outlined">独立任务</v-btn>
              <v-btn value="project" variant="outlined">项目发布</v-btn>
            </v-btn-toggle>
          </div>
          <div v-for="(project, index) in projects" :key="index">
            <!-- 项目信息（仅项目模式显示） -->
            <template v-if="publishMode === 'project'">
              <v-card class="mb-4">
                <v-card-title>项目信息</v-card-title>
                <v-card-text>
                  <v-text-field v-model="project.title" label="项目名称" required />
                  <v-select v-model="project.teamId" :items="team" label="所属团队" item-title="name" item-value="id"
                    :loading="!team.length" />
                  <!-- loading 状态，当团队列表为空时，显示加载中状态 -->
                  <v-menu v-model="deadlineMenu[index]" :close-on-content-click="false">
                    <template #activator="{ props }">
                      <v-text-field :model-value="formatDate(project.deadline)" label="整体项目截止时间" readonly
                        v-bind="props" />
                    </template>
                    <!-- 成员选择器绑定 -->
                    <template v-for="(task, index) in tasks" :key="index">
                      <v-select v-model="task.employeeId" :items="teamStore.teamMembers" label="分配成员" item-title="name"
                        item-value="id" :disabled="!project.teamId" :rules="[v => !!v || '必须选择成员']">
                        <template v-slot:no-data>
                          <v-list-item>
                            <v-list-item-title>
                              {{ project.teamId ? '暂无成员' : '请先选择团队' }}
                            </v-list-item-title>
                          </v-list-item>
                        </template>
                      </v-select>
                    </template>
                    <!-- <v-date-picker :model-value="dayjs(project.deadline).toDate()"
                      @update:model-value="(date) => updateDeadlineDate(date, index)"
                      :min="dayjs().format('YYYY-MM-DD')" />
                    <v-time-picker :model-value="dayjs(project.deadline).format('HH:mm')"
                      @update:model-value="(time) => updateDeadlineTime(time, index)" format="24hr" /> -->
                  </v-menu> 
                </v-card-text>
              </v-card>
            </template>
          </div>
          <div v-for="(task, index) in tasks" :key="index">
            <v-text-field v-model="task.title" label="任务名称" />
            <v-textarea v-model="task.description" label="任务描述" />
            <v-file-input v-model="task.image" label="上传图片" accept="image/*" @change="handleImageUpload" />
            <v-select v-model="task.priority" :items="['高', '中', '低']" label="优先级" />
            <v-select v-model="task.employeeId" :items="members" label="分配成员" />
            <!-- 调度时间：显示实时时间 -->
            <v-text-field :value="currentTime" label="调度时间" readonly />
            <!-- 截止时间：可点击选择日期和时间 -->
            <v-menu v-model="deadlineMenu[index]" :close-on-content-click="false">
              <template #activator="{ props }">
                <v-text-field :model-value="formatDate(task.deadline)" label="截止时间" readonly v-bind="props" />
              </template>
              <v-date-picker :model-value="dayjs(task.deadline).toDate()"
                @update:model-value="(date) => updateDeadlineDate(date, index)" :min="dayjs().format('YYYY-MM-DD')" />
              <v-time-picker :model-value="dayjs(task.deadline).format('HH:mm')"
                @update:model-value="(time) => updateDeadlineTime(time, index)" format="24hr" />
            </v-menu>

            <!-- 提醒时间选择器 -->
            <v-menu v-model="reminderMenu[index]" :close-on-content-click="false">
              <template #activator="{ props }">
                <v-text-field :model-value="task.reminderTime" label="任务截止前提醒" readonly v-bind="props" />
              </template>
              <v-time-picker :model-value="task.reminderTime"
                @update:model-value="(time) => updateReminderTime(time, index)" format="24hr" />
            </v-menu>
            <v-btn color="error" @click="tasks.splice(index, 1)">删除任务</v-btn>
          </div>
        </v-form>
      </v-col>
      <v-col cols="12">
        <v-btn color="primary" @click="addTask">添加任务</v-btn>
        <v-btn color="success" @click="saveAllTasks">保存所有任务</v-btn>
        <v-btn @click="router.push({ name: 'taskmanagement' })">取消</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
<style scoped></style>