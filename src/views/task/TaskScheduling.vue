<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed, onUnmounted } from 'vue';
import dayjs from 'dayjs';
import { useRoute, useRouter } from 'vue-router';
import { useTaskStore } from '@/stores/task';
import type { TaskCreateDTO, FileItem, RecommendEmployeeDTO } from '@/types/task';
import type { ProjectCreateDTO } from '@/types/project';
import { useTeamStore } from '@/stores/team';
import type { Employee, Team } from '@/types/team';
import { useProjectStore } from '@/stores/project';
import { createToast } from 'mosha-vue-toastify';
import { useUserStore } from '@/stores/user';
import { recommendEmployeeForTask } from '@/api/task';

const userStore = useUserStore();
const router = useRouter();
const taskStore = useTaskStore();
const projectStore = useProjectStore();
const employeeTeams = ref<Team[]>([]); // 当前用户所属团队
const members = ref<Employee[]>([]); // 分配成员列表
const loadingTeams = ref(true); // 团队加载状态
const teamStore = useTeamStore();
const deadlineProjectMenu = ref<boolean>(false)
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

const isAdmin = computed(() =>
  userStore.user?.authorities?.includes('ROLE_ADMIN') ||
  userStore.user?.authorities?.includes('ROLE_Manager')
);

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

//当前项目列表
const project = ref<ProjectCreateDTO>({
  title: '',
  description: '',
  teamId: teamStore.currentEmployee?.teamId || '',
  scheduledTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  deadline: dayjs().format('YYYY-MM-DD HH:mm:ss'), // 添加默认截止时间

});

// 当前任务列表
const tasks = ref<TaskCreateDTO[]>([
  {
    projectId: '',
    teamId: teamStore.currentEmployee?.teamId || '',
    title: '',
    description: '',
    employeeId: members.value[0]?.employeeId || '', // 自动选择第一个成员
    status: '待处理',
    priority: '低',
    creator: userStore.employee?.employeeId || '', // 设置创建者ID
    scheduledTime: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
    deadline: dayjs().add(7, 'day').format('YYYY-MM-DDTHH:mm:ss'), // 默认7天后
    reminderTime: '',
    files: []
  }
])


const recommendations = ref<RecommendEmployeeDTO[][]>([]);

const handleRecommendClick = async (index: number) => {
  const taskDetail = tasks.value[index];
  console.log('taskDetail before sending:', taskDetail); // 打印任务数据

  try {
    const result = await recommendEmployeeForTask({
      title: taskDetail.title,
      teamId: taskDetail.teamId,
      description: taskDetail.description,
      priority: taskDetail.priority,
      deadline: dayjs(taskDetail.deadline).format('YYYY-MM-DDTHH:mm:ss')
    });
    console.log('推荐结果', result);
    recommendations.value[index] = result.data;
    tasks.value[index].employeeId = result.data[0]?.employeeId || '';
    createToast('推荐成功!', {
      type: 'success',
      timeout: 3000
    });
  } catch (err) {
    console.error('推荐失败', err);
    createToast('获取推荐失败，请检查任务信息', {
      type: 'danger',
      timeout: 2000
    });
  }
};


// 添加新任务
const addTask = () => {
  tasks.value.push({
    projectId: '',
    teamId: teamStore.currentEmployee?.teamId || '',
    title: '',
    description: '',
    employeeId: members.value[0]?.employeeId || '', // 默认选择第一个成员
    status: '待处理',
    priority: '低',
    creator: userStore.employee?.employeeId || '', // 设置创建者ID
    scheduledTime: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
    deadline: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
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
    if (tasks.value.length === 0) {
      createToast('请至少添加一个任务', { type: 'warning' });
      return;
    }
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
    if (tasks.value.length === 0) {
      createToast('请至少添加一个任务', { type: 'warning' });
      return;
    }
    if (!project.value.title) {
      createToast('请填写项目名称', { type: 'warning' });
      return;
    }
    if (!project.value.teamId) {
      createToast('请选择所属团队', { type: 'warning' })
      return;
    }
    try {
      // 映射每个任务
      const projectTasks = tasks.value.map(task => ({
        ...task, // 展开原始任务数据
        creator: teamStore.currentEmployee?.employeeId || '', // 添加创建者
        teamId: project.value.teamId, // 添加团队 ID
        projectId: '' // 将在创建后自动关联
      }));

      // 同时提交项目信息和关联任务
      const newProject = await projectStore.createNewProject({
        ...project.value,
      }, projectTasks);

      createToast(`项目 ${newProject.title} 创建成功`, { type: 'success' })
    } catch (error) {
      createToast('项目创建失败', { type: 'danger' })
    }
  }
};

// 处理文件上传
const handleFileUpload = async (event: Event, index: number) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;
  const formData = new FormData();
  try {
    // 转换原生 File 到 FileItem 并添加到 FormData
    Array.from(target.files).forEach((file, i) => {
      const fileItem: FileItem = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type.split('/')[0] || 'other', // 简化类型分类
        url: URL.createObjectURL(file),
        uploader: userStore.employee?.name || '未知用户',
        uploadTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        scope: 'task'
      };
      // 添加到 tasks 的 files 列表
      tasks.value[index].files = [...(tasks.value[index].files || []), fileItem];
      // 将文件添加到 FormData
      formData.append(`files[${i}]`, file); // 使用数组形式命名键
    });
    // 调用任务存储的上传方法
    await taskStore.uploadFile(formData);
    // 清空文件输入框
    target.value = '';
  } catch (error) {
    console.error('文件上传失败:', error);
  }
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

// 加载当前员工所属团队
const loadEmployeeTeams = async () => {
  try {
    loadingTeams.value = true; // 开始加载
    const employeeId = userStore.employee?.employeeId;
    if (!employeeId) {
      console.error('用户信息未加载或不存在');
      return;
    }
    if (employeeId) {
      employeeTeams.value = await teamStore.getTeamByemployId(employeeId);
    }
  } catch (error) {
    console.error('加载用户团队失败:', error);
  } finally {
    loadingTeams.value = false; // 结束加载
  }
}

// 获取分配成员列表
const fetchMembers = async (teamId: string): Promise<Employee[]> => {
  try {
    const teamMembers = await teamStore.getTeamMembers(teamId);
    console.log('团队成员列表:', teamMembers);
    return teamMembers; // 返回团队成员列表
  } catch (error) {
    console.error('获取成员列表失败:', error);
    throw error; // 抛出错误，便于调用者处理
  }
};

// 团队变更处理
const handleTeamChange = async (newTeamId: string) => {
  try {
    // 更新项目团队ID
    project.value.teamId = newTeamId;
    console.log('团队变更处理:', newTeamId);
    // 加载新团队成员
    members.value = await fetchMembers(newTeamId);
    // 自动更新所有任务的团队ID
    tasks.value.forEach(task => {
      task.teamId = newTeamId;
      if (!task.employeeId && members.value.length > 0) {
        task.employeeId = members.value[0].employeeId; // 默认分配第一个成员
      }
    });
  } catch (error) {
    console.error('团队变更处理失败:', error);
  }
}

// 验证工作量
const validateWorkload = (employeeId: string) => {
  if (!employeeId) return true;
  // 根据 employeeId 查找成员
  const member = members.value.find(m => m.employeeId === employeeId);
  if (!member) return true; // 如果未找到成员，默认返回 true
  return member.workload <= 70; // 返回 true/false 控制验证状态
};

let intervalId: any;
// 初始化
onMounted(async () => {
  updateTime();
  await userStore.getUserInfo();
  intervalId = setInterval(updateTime, 1000);
  // 初始化时间选择器
  reminderMenu.value = tasks.value.map(() => false);
  await teamStore.getEmployees()
  // 动态获取团队数据
  await loadEmployeeTeams();
  // 如果有默认团队（例如当前团队）
  if (teamStore.currentEmployee?.teamId && employeeTeams.value.some(t => t.teamId === teamStore.currentEmployee?.teamId)) {
    project.value.teamId = teamStore.currentEmployee?.teamId;
    await handleTeamChange(teamStore.currentEmployee?.teamId);
  }
})

// 动态监听当前项目的 teamId
watch(
  () => project.value.teamId,
  async (newVal) => {
    if (newVal) {
      if (publishMode.value === 'project') {
        tasks.value.forEach(t => t.teamId = newVal); // 自动继承项目团队
      }
      try {
        members.value = await fetchMembers(newVal); // 更新成员列表
        tasks.value.forEach(task => {
          if (!task.employeeId && members.value.length > 0) {
            task.employeeId = members.value[0].employeeId;
          }
        });
      } catch (error) {
        console.error('加载团队成员失败:', error);
      }
    }
  },
  { immediate: true }
);


onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold primary--text ">任务下发</h2>
      </v-col>
      <v-col cols="12" class="mx-auto"> <!-- 添加居中限制 -->
        <v-form>
          <!-- 模式切换 -->
          <div class="mode-switch mb-8">
            <v-btn-toggle v-model="publishMode" mandatory class="elevation-2 rounded-lg">
              <v-btn value="task" class="text-h6 px-6" :class="{ 'primary--text': publishMode === 'task' }">
                <v-icon left>list</v-icon>
                独立任务
              </v-btn>
              <v-btn value="project" class="text-h6 px-6" :class="{ 'primary--text': publishMode === 'project' }">
                <v-icon left>list_alt</v-icon>
                项目发布
              </v-btn>
            </v-btn-toggle>
          </div>
          <div>
            <!-- 项目信息（仅项目模式显示） -->
            <template v-if="publishMode === 'project'">
              <v-card class="mb-4">
                <v-card-title>项目信息</v-card-title>
                <v-card-text>
                  <v-text-field v-model="project.title" label="项目名称" required />

                  <!-- 项目截止时间 -->
                  <v-menu v-model="deadlineProjectMenu" :close-on-content-click="false">
                    <template #activator="{ props }">
                      <v-text-field :model-value="formatDate(project.deadline)" label="整体项目截止时间" readonly
                        v-bind="props" />
                    </template>
                    <v-date-picker :model-value="dayjs(project.deadline).toDate()"
                      @update:model-value="date => project.deadline = dayjs(date).format('YYYY-MM-DD HH:mm:ss')"
                      :min="dayjs().format('YYYY-MM-DD')" />
                  </v-menu>
                </v-card-text>
              </v-card>
            </template>
          </div>

          <!-- 任务项 -->
          <div v-for="(task, index) in tasks" :key="index" class="task-item mb-4">
            <!-- mb-4（底部外边距）来控制任务项之间的上下间距 -->
            <v-card class="elevation-2 rounded-xl pa-4">
              <div class="d-flex align-center mb-4">
                <!-- 任务标题和操作 -->
                <v-text-field v-model="task.title" label="任务名称" outlined hide-details class="flex-grow-1 mr-4"
                  background-color="white" />
                <v-btn color="error" @click="tasks.splice(index, 1)" icon class="ml-2" size="40px">
                  <v-icon>delete</v-icon>
                </v-btn>
              </div>

              <!-- 任务详情区域 -->
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
              <!-- 团队选择器 -->
              <v-select v-model="project.teamId" :items="employeeTeams" label="所属团队" item-title="name"
                item-value="teamId" :loading="loadingTeams" :rules="[v => !!v || '必须选择团队']"
                @update:modelValue="handleTeamChange">
                <template v-slot:no-data>
                  <v-list-item>
                    <v-list-item-title>
                      {{ employeeTeams.length ? '无匹配团队' : '您不属于任何团队' }}
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-select>
              <!-- 分配成员 -->
              <v-select v-model="task.employeeId" :items="members" label="分配成员" item-title="name"
                item-value="employeeId" :disabled="!project.teamId" :rules="[v => !!v || '必须选择成员',
                (value) => validateWorkload(value) || '该成员任务负载过高（>70）！'
                ]">
                <!-- 自定义选项展示 -->
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <v-list-item-title>
                      <span class="text-caption ">{{ item.raw.position }}</span>
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      任务负载:
                      <span :class="{ 'text-red': item.raw.workload > 60, 'text-green': item.raw.workload <= 30 }">
                        {{ item.raw.workload }} %
                      </span>
                    </v-list-item-subtitle>
                  </v-list-item>
                </template>

                <!-- 选中后的展示 -->
                <template v-slot:selection="{ item }">
                  <span>{{ item.raw.name }}</span>
                  <span class="text-caption text-grey ml-2">{{ item.raw.position }}</span>
                </template>

                <template v-slot:no-data>
                  <v-list-item>
                    <v-list-item-title>
                      {{ project.teamId ? '暂无成员' : '请先选择团队' }}
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-select>


              <div v-if="recommendations[index]?.length" class="recommend-section">
                <!-- 推荐首选部分 -->
                <div class="text-subtitle-2 mt-1 mb-1  ml-2" v-if="recommendations[index]?.length">
                  推荐首选：<v-icon size="16">stars</v-icon>
                </div>

                <v-chip class="ma-1" :color="empIndex === 0 ? 'blue' : 'green'" text-color="white"
                  @click="task.employeeId = emp.employeeId" v-for="(emp, empIndex) in recommendations[index]"
                  :key="emp.employeeId">
                  <v-avatar start>
                    <v-icon :size="empIndex === 0 ? '24' : '20'">{{ empIndex === 0 ? 'stars' : 'person' }}</v-icon>
                  </v-avatar>
                  {{ emp.employeeName }} ({{ emp.position }})
                  <v-tooltip activator="parent" location="top">
                    推荐得分：{{ emp.score }} | 工作负载：{{ emp.workload }}%
                  </v-tooltip>
                </v-chip>
              </div>

              <!-- 添加推荐按钮 -->
              <v-btn color="info" @click="handleRecommendClick(index)" class="mt-2" density="compact"
                style="padding: 4px 10px;">
                <v-icon left size="20">auto_awesome</v-icon>
                <span class="text-body-2" style="font-size: 14px;">智能推荐</span>
              </v-btn>



              <!-- 调度时间：显示实时时间 -->
              <v-text-field v-model="currentTime" label="调度时间" readonly />
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
            </v-card>
          </div>

        </v-form>
      </v-col>
      <!-- 操作按钮组 -->
      <v-col cols="12" class="mt-3">
        <div class="d-flex justify-space-between gap-4">
          <div class="d-flex  align-center gap-4">
            <v-btn color="primary" @click="addTask" class="rounded-pill px-3" elevation="2">
              <v-icon left>add</v-icon>
              添加任务
            </v-btn>
            <v-btn v-if="isAdmin" color="success" @click="handleSubmit" class="rounded-pill px-" elevation="2">
              <v-icon left>check</v-icon>
              提交{{ publishMode === 'project' ? '项目' : '任务' }}
            </v-btn>
          </div>
          <div>
            <v-btn color="grey" @click="router.push({ name: 'taskmanagement' })" outlined class="rounded-pill px-3">
              <v-icon left>close</v-icon>
              取消
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
    <!-- 附件删除提示框 -->
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
  </v-container>
</template>

<style scoped>
/* 按钮美化 */
.v-btn {
  text-transform: none;
  letter-spacing: normal;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 任务项动画 */
.task-item {
  transition: all 1s ease;
}
</style>