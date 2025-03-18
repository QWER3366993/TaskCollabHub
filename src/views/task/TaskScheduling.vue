<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import dayjs from 'dayjs';
import { useRoute, useRouter } from 'vue-router';
import { useTaskStore } from '@/stores/task';
import type { TaskCreateDTO, FileItem } from '@/types/task';
import type { ProjectCreateDTO } from '@/types/project';
import { useTeamStore } from '@/stores/team';
import type { Employee, Team } from '@/types/team';
import { useProjectStore } from '@/stores/project';
import { createToast } from 'mosha-vue-toastify';
import { useRouteStore } from '@/stores/route';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const taskStore = useTaskStore();
const projectStore = useProjectStore();
const team = ref<Team[]>([])
const members = ref<Employee[]>([]); // 分配成员列表
const teamStore = useTeamStore();
const userStore = useUserStore();
const deadlineMenu = ref<boolean[]>([]); // 控制每个任务的截止时间选择器的显示
const reminderMenu = ref<boolean[]>([]); // 控制每个任务的提醒时间选择器的显示
// 动态更新当前时间
const currentTime = ref<string>(''); // 用于存储动态更新的时间

// 添加文件删除确认对话框
const deleteConfirmDialog = ref(false);
const deletingFileIndex = ref(-1);
const deletingFileId = ref('');

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

const currentProjectIndex = ref<number>(0); // 默认监听第一个项目

//当前项目列表
const projects = ref<ProjectCreateDTO>({
  title: '',
  description: '',
  teamId: teamStore.currentTeam?.id || '',
  scheduledTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  deadline: dayjs().format('YYYY-MM-DD HH:mm:ss'), // 添加默认截止时间

});

// 当前任务列表
const tasks = ref<TaskCreateDTO[]>([
  {
    projectId: '',
    teamId: teamStore.currentTeam?.id || '',
    title: '',
    description: '',
    employeeId: '',
    status: '待处理',
    priority: '低',
    creator: '',
    scheduledTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    deadline: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    reminderTime: '',
    files: []
  }
])


// 添加新任务
const addTask = () => {
  tasks.value.push({
    projectId: '',
    teamId: teamStore.currentTeam?.id || '',
    title: '',
    description: '',
    employeeId: '',
    status: '待处理',
    priority: '低',
    creator: '',
    scheduledTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    deadline: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    reminderTime: '',
    files: [],
  });
  deadlineMenu.value.push(false); // 为新增任务初始化截止时间选择器状态
  reminderMenu.value.push(false); // 为新增任务初始化提醒时间选择器状态
};

const props = defineProps<{
  taskId?: string;
  projectId?: string;
}>();

// 提交项目/任务
const handleSubmit = async () => {
  if (publishMode.value === 'task') {
    try {
      const isNewTask = !props.taskId || props.taskId === 'new';
      for (const task of tasks.value) {
        if (isNewTask) {
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
      if (!projects.value.teamId) {
        createToast('请选择所属团队', { type: 'warning' })
        return
      }
      // 映射每个任务
      const projectTasks = tasks.value.map(task => ({
        ...task, // 展开原始任务数据
        creator: teamStore.currentEmployee?.employeeId || '', // 添加创建者
        teamId: projects.value.teamId // 添加团队 ID
      }));

      // 同时提交项目信息和关联任务
      const newProject = await projectStore.createNewProject(
        projects.value,
        projectTasks
      );

      createToast(`项目 ${newProject.title} 创建成功`, { type: 'success' })
    } catch (error) {
      createToast('项目创建失败', { type: 'danger' })
    }
  }
};

// 处理文件上传
const handleFileUpload = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;

  // 转换原生File为FileItem数组
  const newFiles = Array.from(target.files).map(file => ({
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type.split('/')[0] || 'other', // 简化类型分类
    url: URL.createObjectURL(file),
    uploader: teamStore.currentEmployee?.name || '未知用户',
    uploadTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    scope: 'task'
  } as FileItem));

  // 合并到现有文件列表
  tasks.value[index].files = [...(tasks.value[index].files || []), ...newFiles];
  // 清空文件输入
  target.value = '';
};

// 误上传时删除文件
const confirmDeleteFile = (taskIndex: number, fileId: string) => {
  deletingFileIndex.value = taskIndex;
  deletingFileId.value = fileId;
  deleteConfirmDialog.value = true;
};

// 执行文件删除

const deleteFile = () => {
  const index = deletingFileIndex.value;
  if (index >= 0 && index < tasks.value.length) {
    tasks.value[index].files = tasks.value[index].files?.filter(f => f.id !== deletingFileId.value);
  } else {
    console.error('无效的任务索引:', index);
  }
  deleteConfirmDialog.value = false;
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
    const teamMembers = await teamStore.getTeamMembers(teamId);
    return teamMembers; // 返回团队成员列表
  } catch (error) {
    console.error('获取成员列表失败:', error);
    throw error; // 抛出错误，便于调用者处理
  }
};

// 团队成员映射
const memberOptions = computed(() => {
  return teamStore.teamMembers.map(m => ({
    title: m.name,
    value: m.employeeId
  }))
})

// 根据任务数量自动计算预计进度
const calculateProgress = computed(() => {
  const total = tasks.value.length
  const assigned = tasks.value.filter(t => t.employeeId).length
  return total > 0 ? Math.round((assigned / total) * 100) : 0
})

// 当选择项目模式时，自动填充团队
watch(
  () => projects.value.teamId,
  (newVal) => {
    if (newVal) {
      tasks.value.forEach(t => {
        t.teamId = newVal // 自动继承项目团队
      })
      fetchMembers(newVal) // 加载团队成员
    }
  }
)

let intervalId: any;
// 初始化
onMounted(async () => {
  updateTime();
  intervalId = setInterval(updateTime, 1000);
  // 初始化时间选择器
  reminderMenu.value = tasks.value.map(() => false);
  // 动态获取团队数据
  await loadTeams();
})

onUnmounted(() => {
  clearInterval(intervalId);
});

// 动态监听当前项目的 teamId
watch(
  () => projects.value.teamId,
  async (newVal) => {
    if (newVal && currentProjectIndex.value !== null) {
      try {
      members.value = await fetchMembers(newVal); // 更新成员列表
      const projectTasks = tasks.value.filter(task => task.teamId === projects.value.teamId);
      projectTasks.forEach(t => {
        t.teamId = newVal; // 更新任务的 teamId
        t.employeeId = members.value[0]?.employeeId || ''; // 默认分配第一个成员
      });
      } catch (error) {
        console.error('加载团队成员失败:', error);
      }
    }
  }
);

</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h2>任务下发</h2>
      </v-col>
      <v-col cols="12" class="mx-auto"> <!-- 添加居中限制 -->
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
                  <v-text-field v-model="projects.title" label="项目名称" required />
                  <v-select v-model="projects.teamId" :items="loadTeams" label="所属团队" item-title="name" item-value="id"
                    :loading="!team.length" @update:modelValue="fetchMembers">
                    <!-- loading 状态，当团队列表为空时，显示加载中状态 -->
                    <template v-slot:no-data>
                      <v-list-item>
                        <v-list-item-title>无可用团队</v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-select>
                  <v-menu v-model="deadlineMenu[index]" :close-on-content-click="false">
                    <template #activator="{ props }">
                      <v-text-field :model-value="formatDate(projects.deadline)" label="整体项目截止时间" readonly
                        v-bind="props" />
                    </template>
                    <!-- 成员选择器绑定 -->
                    <template v-for="(task, index) in tasks" :key="index">
                      <v-select v-model="task.employeeId" :items="teamStore.teamMembers" label="负责人" item-title="name"
                        item-value="employeeId" :disabled="!projects.teamId" :rules="[v => !!v || '必须选择成员']">
                        <template v-slot:no-data>
                          <v-list-item>
                            <v-list-item-title>
                              {{ projects.teamId ? '暂无成员' : '请先选择团队' }}
                            </v-list-item-title>
                          </v-list-item>
                        </template>
                      </v-select>
                    </template>
                  </v-menu>
                </v-card-text>
              </v-card>
            </template>
          </div>
          <div v-for="(task, index) in tasks" :key="index">
            <v-text-field v-model="task.title" label="任务名称" />
            <v-textarea v-model="task.description" label="任务描述" />
            <v-file-input multiple label="上传文件" @change="handleFileUpload($event, index)" prepend-icon="upload_file"
              :model-value="[]" />
            <!-- 显示已上传文件 -->

            <v-list v-if="task.files?.length" density="compact" class="my-2">
              <v-list-item v-for="file in task.files" :key="file.id" :title="file.name"
                :subtitle="`${(file.size / 1024).toFixed(2)} KB - ${file.uploader}`">
                <template #prepend>
                  <v-icon class="mr-2">
                    {{
                      file.type.startsWith('image') ? 'image' :
                        file.type === 'pdf' ? 'picture_as_pdf' :
                          'description'
                    }}
                  </v-icon>
                </template>
                <!-- 删除按钮 -->
                <template #append>
                  <v-btn icon variant="text" color="grey" size="small" @click="confirmDeleteFile(index, file.id)">
                    <v-icon>delete</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
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
        <v-btn color="success" @click="handleSubmit">提交</v-btn>
        <v-btn @click="router.push({ name: 'taskmanagement' })">取消</v-btn>
      </v-col>
    </v-row>
  </v-container>
  <v-dialog v-model="deleteConfirmDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6">确认删除</v-card-title>
      <v-card-text>
        确定要删除这个文件吗？该操作不可撤销。
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" @click="deleteFile">确认删除</v-btn>
        <v-btn color="secondary" @click="deleteConfirmDialog = false">取消</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>