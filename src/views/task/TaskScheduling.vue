<script setup lang="ts">
import { ref, onMounted } from 'vue';
import dayjs from 'dayjs';
import { useRoute, useRouter } from 'vue-router';
import { useTaskStore } from '@/stores/task';
import type { Task } from '@/types/task';
import { useTeamStore } from '@/stores/team';
import type { Employee } from '@/types/team';

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const members = ref<Employee[]>([]); // 分配成员列表
const teamStore = useTeamStore();
const deadlineMenu = ref<boolean[]>([]); // 控制每个任务的截止时间选择器的显示
const reminderMenu = ref<boolean[]>([]); // 控制每个任务的提醒时间选择器的显示
// 动态更新当前时间
const currentTime = ref<string>(''); // 用于存储动态更新的时间

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

// 当前任务列表
const tasks = ref<Task[]>([
  {
    id: '',
    title: '',
    description: '',
    status: '待处理',
    priority: '低',
    assignedTo: '',
    creator: '',
    teamId: '', // 任务所属团队 ID
    scheduledTime: dayjs().format('YYYY-MM-DD HH:mm:ss'), // 初始化为当前时间
    deadline: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    reminderTime: '',
    image: undefined, // 用于存储上传的图片 URL
  }
]);

// 添加新任务
const addTask = () => {
  tasks.value.push({
    id: '',
    title: '',
    description: '',
    status: '待处理',
    priority: '低',
    assignedTo: '',
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
}>();
// 保存所有任务
const saveAllTasks = async () => {
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
};

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

// 处理图片上传
const handleImageUpload = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    tasks.value[index].image = file; // 更新对应任务的图片
  }
};

// 初始化加载团队成员
onMounted(async () => {
  updateTime();
  reminderMenu.value = tasks.value.map(() => false); // 初始化 reminderMenu

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
});
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h2>发布项目</h2>
      </v-col>
      <v-col cols="12">
        <v-form>
          <div v-for="(task, index) in tasks" :key="index">
            <v-text-field v-model="task.title" label="任务名称" />
            <v-textarea v-model="task.description" label="任务描述" />
            <v-file-input v-model="task.image" label="上传图片" accept="image/*" @change="handleImageUpload" />
            <v-select v-model="task.priority" :items="['高', '中', '低']" label="优先级" />
            <v-select v-model="task.assignedTo" :items="members" label="分配成员" />
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