<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTaskStore } from '@/stores/task';
import { useTeamStore } from '@/stores/team';
import type { Task, FileItem } from '@/types/task';
import dayjs from 'dayjs';
import { useUserStore } from '@/stores/user';
import { getFileIcon } from '@/types/fileTypeIcons'
import { createToast } from 'mosha-vue-toastify';

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const commentInput = ref('');
const userStore = useUserStore();
const teamStore = useTeamStore();
const taskId = route.params.id as string; // 从路由参数中获取任务 ID

const defaultTask: Task = {
  id: '',
  title: '加载中...',
  description: '',
  status: '待处理',
  priority: '高',
  scheduledTime: dayjs().toISOString(),
  deadline: dayjs().toISOString(),
  comments: [],
  creator: '',
  teamId: '',
  employeeId: ''
};

// 编辑相关状态
const editDialog = ref(false);
const editTask = ref<Task>({ ...defaultTask });
// 删除框相关状态
const deleteDialog = ref(false);

// 打开编辑对话框
const openEdit = () => {
  editTask.value = { ...task.value };
  editDialog.value = true;
};

const task = ref<Task>(defaultTask);

// 状态颜色映射
const statusColor = (status?: string) => {
  const colors: Record<string, string> = {
    '待处理': 'orange',
    '进行中': 'blue',
    '已完成': 'green'
  };
  return colors[status || ''] || 'grey';
};

// 优先级颜色映射
const priorityColor = (priority?: string) => {
  const colors: Record<string, string> = {
    '高': 'red',
    '中': 'orange',
    '低': 'green'
  };
  return colors[priority || ''] || 'grey';
};

// 发表评论功能
const addComment = async () => {
  if (commentInput.value.trim()) {
    const newComment = {
      user: {
        name: userStore.user.name!,
        avatar: userStore.user.avatar!,
        userId: teamStore.currentEmployee?.userId// 添加用户ID
      },
      // 使用 trim() 方法来去除输入内容两端的空格
      content: commentInput.value.trim(),
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
    try {
      // 提交到 store 进行持久化
      await taskStore.submitComment(taskId, newComment);
      // if-else写法可以替换为利用展开运算符：task.value.comments = [...(task.value.comments || []), newComment];
      // 更新本地数据
      if (task.value.comments) {
        task.value.comments.push(newComment);
      } else {
        // 如果 task.value.comments 不存在，则将其初始化为一个包含 newComment 的数组
        task.value.comments = [newComment];
      }
      //清空输入框
      commentInput.value = '';
    } catch (error) {
      console.error('评论提交失败：', error);
    }
  }
};

// 类型守卫方法
const isFileWithPreview = (file: File | FileItem): file is FileItem => {
  return 'url' in file;
};



// 文件上传
const handleUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const MAX_SIZE = 5 * 1024 * 1024;
  const validFiles = Array.from(input.files).filter(file => {
    if (file.size > MAX_SIZE) {
      alert(`文件 ${file.name} 超过大小限制`);
      return false;
    }
    return true;
  });

  // 转换为统一FileItem格式
  const newFiles = validFiles.map(file => ({
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type.split('/')[0] || 'other',
    url: URL.createObjectURL(file),
    uploader: userStore.user.name || '匿名用户',
    uploadTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    scope: 'task'
  } as FileItem));

  // 合并文件列表
  task.value.files = [...(task.value.files || []), ...newFiles];
  input.value = '';
};

// 统一使用FileItem类型处理
const isFileItem = (file: FileItem): file is FileItem => {
  return 'id' in file && 'url' in file;
};


const formatSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

// 日志功能实现部分
const operationTypeMap = {
  create: '创建',
  update: '修改',
  delete: '删除',
  status_change: '状态变更'
};

const fieldMap = {
  title: '标题',
  deadline: '截止时间',
  status: '状态',
  priority: '优先级'
};

// type 参数只能是 operationTypeMap 对象的键之一，即 "create" | "update" | "delete" | "status_change"
const getLogColor = (type: keyof typeof operationTypeMap): string => {
  const colors: Record<typeof type, string> = {
    create: 'green',
    update: 'blue',
    delete: 'red',
    status_change: 'orange'
  };
  return colors[type] || 'grey'; // 提供默认值
};

const getLogIcon = (type: keyof typeof operationTypeMap) => {
  return {
    create: 'add_circle',
    update: 'update',
    delete: 'delete',
    status_change: 'query_stats'
  }[type];
};

const formatValue = (value: string | number | Date) => {
  return dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD') : value;
};
// 日志功能部分结束

// 加载任务详情的方法
const loadTaskDetail = async (taskId: string) => {
  try {
    // ✅ 清空旧数据，展示加载状态
    task.value = { ...defaultTask };
    // 从Store或API获取数据，确保使用 taskId
    const taskDetails = await taskStore.getTaskById(taskId);
    if (taskDetails) {
      task.value = taskDetails;
      console.log('加载的任务数据:', task.value); // 🔍 验证数据是否正确
    }
  } catch (error) {
    console.error('加载任务失败:', error);
  }
};

// 保存修改
const saveTask = async () => {
  try {
    await taskStore.updateTask(taskId, editTask.value);
    task.value = editTask.value;
    editDialog.value = false;
    createToast('任务更新成功', { type: 'success' });
  } catch (error) {
    createToast('更新失败', { type: 'danger' });

  }
};

const confirmDelete = async () => {
  try {
    await taskStore.deleteTaskById(taskId);
    router.push({ name: 'taskmanagement' });
    createToast('任务已删除', { type: 'success' });
  } catch (error) {
    createToast('删除失败', { type: 'danger' });
  }
};

onMounted(async () => {
  await loadTaskDetail(taskId);
});
</script>

<template>
  <v-container class="task-detail">
    <v-btn color="grey" variant="text" prepend-icon="undo" @click="router.back()" class="mb-4">
      返回列表
    </v-btn>

    <v-row>
      <!-- 左侧主内容区域 -->
      <v-col cols="12" md="8">
        <v-card elevation="2">
          <v-card-title class="d-flex justify-space-between align-center">
            <div class="d-flex align-center">
              <v-icon large class="mr-2">titlecase</v-icon>
              <span class="text-h5">{{ task.title }}</span>
            </div>
            <div>
              <!-- ‌tonal‌：按钮有颜色渐变效果 -->
              <v-btn variant="tonal" color="primary" prepend-icon="edit" @click="openEdit">编辑</v-btn>
              <!-- 编辑对话框 -->
              <v-dialog v-model="editDialog" max-width="600">
                <v-card>
                  <v-card-title>编辑任务</v-card-title>
                  <v-card-text>
                    <v-text-field v-model="editTask.title" label="标题" />
                    <v-textarea v-model="editTask.description" label="描述" />
                    <v-select v-model="editTask.priority" :items="['高', '中', '低']" label="优先级" />
                    <v-menu>

                    </v-menu>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn @click="editDialog = false">取消</v-btn>
                    <v-btn color="primary" @click="saveTask">保存</v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>

              <!-- 删除按钮 -->
              <v-btn variant="tonal" color="error" prepend-icon="delete" @click="deleteDialog = true">删除</v-btn>
              <!-- 删除确认对话框 -->
              <v-dialog v-model="deleteDialog" max-width="400">
                <v-card>
                  <v-card-title class="text-h6">确认删除？</v-card-title>
                  <v-card-text>此操作不可撤销，确定要删除该任务吗？</v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="error" @click="confirmDelete">确认删除</v-btn>
                    <v-btn @click="deleteDialog = false">取消</v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </div>
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text>
            <v-row>
              <!-- 基本信息列 -->
              <v-col cols="12">
                <v-list density="comfortable">
                  <v-list-item>
                    <template #prepend>
                      <v-icon>man</v-icon>
                    </template>
                    <v-list-item-title class="font-weight-bold">负责人</v-list-item-title>
                    <v-list-item-subtitle class="text-body-1">{{
                      teamStore.getName(task.employeeId) }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-icon>folder</v-icon>
                    </template>
                    <v-list-item-title class="font-weight-bold">关联项目</v-list-item-title>
                    <v-list-item-subtitle class="text-body-1">{{ task.projectId || '未关联项目' }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-icon>personcheck</v-icon>
                    </template>
                    <v-list-item-title class="font-weight-bold">创建者</v-list-item-title>
                    <v-list-item-subtitle class="text-body-1">{{ task.creator }}</v-list-item-subtitle>
                  </v-list-item>

                  <!-- 状态信息列 -->
                  <v-col cols="12">
                    <v-list density="comfortable">
                      <v-list-item>
                        <template #prepend>
                          <v-icon :color="statusColor(task.status)">schedule</v-icon>
                        </template>
                        <v-list-item-title class="font-weight-bold">状态</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip :color="statusColor(task.status)" label>
                            <v-icon start>schedule</v-icon>
                            {{ task.status }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <template #prepend>
                          <v-icon color="amber">bolt</v-icon>
                        </template>
                        <v-list-item-title class="font-weight-bold">优先级</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip :color="priorityColor(task.priority)" label>
                            {{ task.priority }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>

                      <v-list-item>
                        <template #prepend>
                          <v-icon color="purple">alarm</v-icon>
                        </template>
                        <v-list-item-title class="font-weight-bold">提醒时间</v-list-item-title>
                        <v-list-item-subtitle class="text-body-1">
                          {{ task.reminderTime ? dayjs(task.reminderTime).format('YYYY/MM/DD HH:mm') : '未设置提醒' }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-col>
                </v-list>
              </v-col>

              <!-- 时间线区域 -->
              <v-col cols="12">
                <v-timeline side="end" align="start" density="compact">
                  <v-timeline-item dot-color="primary" size="small">
                    <template #icon>
                      <v-icon>schedule</v-icon>
                    </template>
                    <div class="text-body-1 font-weight-bold">创建时间</div>
                    <div>{{ dayjs(task.scheduledTime).format('YYYY/MM/DD HH:mm') }}</div>
                  </v-timeline-item>

                  <v-timeline-item dot-color="red" size="small">
                    <template #icon>
                      <v-icon>schedule</v-icon>
                    </template>
                    <div class="text-body-1 font-weight-bold">截止时间</div>
                    <div :class="{ 'text-red': dayjs(task.deadline).isBefore(dayjs()) }">
                      {{ dayjs(task.deadline).format('YYYY/MM/DD HH:mm') }}
                      <v-chip v-if="dayjs(task.deadline).isBefore(dayjs())" color="red" size="small" class="ml-2">
                        已过期
                      </v-chip>
                    </div>
                  </v-timeline-item>
                </v-timeline>
              </v-col>

              <!-- 任务描述 -->
              <v-col cols="12">
                <div class="text-h6 mb-2">📝 任务描述</div>
                <v-card variant="outlined" class="pa-4 rounded-lg" style="min-height: 120px">
                  <div v-if="task.description" class="text-body-1 pre-line">{{ task.description }}</div>
                  <div v-else class="text-grey">暂无任务描述</div>
                </v-card>
              </v-col>

              <!-- 附件预览 -->
              <v-col cols="12" v-if="task.files?.length">
                <div class="text-h6 mb-2">📎 附件预览</div>
                <v-row>
                  <v-col v-for="(file, index) in task.files" :key="file.id" cols="12" md="4">
                    <v-card variant="outlined" class="pa-2 file-card">
                      <div class="d-flex align-center">
                        <v-icon class="mr-2">{{ getFileIcon(file.type) }}</v-icon>
                        <div class="flex-grow-1 text-truncate">
                          <!-- 使用 v-tooltip 组件来显示文件名 -->
                          <v-tooltip :text="`${file.name} - ${formatSize(file.size)}`" location="bottom">
                            <template v-slot:activator="{ props }">
                              <span v-bind="props">{{ file.name }} - {{ formatSize(file.size) }}</span>
                            </template>
                          </v-tooltip>
                        </div>
                        <v-btn icon :href="file.url" download :title="`下载 ${file.name}`" variant="plain" color="primary"
                          size="small">
                          <v-icon>download</v-icon>
                        </v-btn>
                      </div>
                      <div class="text-caption text-grey mt-1">
                        {{ formatSize(file.size) }} - {{ dayjs(file.uploadTime).format('MM/DD HH:mm') }}
                      </div>
                    </v-card>
                  </v-col>
                </v-row>
              </v-col>
              <v-col cols="12">
                <!-- multiple属性：允许用户选择多个文件进行上传。 -->
                <v-file-input multiple label="添加附件" @change="handleUpload" prepend-icon="attach_file"
                  class="uniform-file-input">
                  <template #selection="{ fileNames }">
                    <v-chip v-for="(name, index) in fileNames" :key="index" size="small" class="ma-1">
                      {{ name }}
                    </v-chip>
                  </template>
                </v-file-input>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 右侧评论区域 -->
      <v-col cols="12" md="4">
        <v-card elevation="2" class="comment-section">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">sms</v-icon>
            任务讨论（{{ task.comments?.length || 0 }}）
          </v-card-title>

          <v-card-text>
            <!-- 评论列表 -->
            <div v-for="(comment, index) in task.comments" :key="index" class="mb-4">
              <div class="d-flex align-start">
                <v-avatar :image="comment.user.avatar" size="36" class="mr-2"></v-avatar>
                <div class="flex-grow-1">
                  <div class="d-flex align-center">
                    <span class="font-weight-medium">{{ comment.user.name }}</span>
                    <span class="text-caption text-grey ml-2">
                      {{ dayjs(comment.createdAt).fromNow() }}
                    </span>
                  </div>
                  <v-card variant="outlined" class="pa-3 mt-1 rounded-lg">
                    <div class="text-body-2">{{ comment.content }}</div>
                  </v-card>
                </div>
              </div>
            </div>

            <!-- 评论输入 -->
            <div class="comment-input-wrapper">
              <v-textarea v-model="commentInput" label="写下你的评论..." variant="outlined" rows="2" auto-grow hide-details
                class="mb-2" @keydown.enter.except.prevent="addComment"></v-textarea>
              <div class="d-flex justify-end">
                <v-btn color="primary" append-icon="send" @click="addComment" :disabled="!commentInput.trim()"
                  variant="tonal">
                  发送评论
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title class="text-subtitle-1">
            <v-icon small class="mr-2">construction</v-icon>
            操作记录（共{{ task.operations?.length || 0 }}条）
          </v-card-title>
          <v-timeline density="compact">
            <v-timeline-item v-for="(log, index) in task.operations" :key="index"
              :dot-color="getLogColor(log.operationType)" size="small">
              <div class="d-flex align-center">
                <v-icon small class="mr-2">{{ getLogIcon(log.operationType) }}</v-icon>
                <div>
                  <div class="text-caption text-grey">
                    {{ dayjs(log.time).format('YYYY-MM-DD HH:mm') }}
                    <v-chip x-small class="ml-2">{{ operationTypeMap[log.operationType] }}</v-chip>
                  </div>
                  <div class="text-body-2">
                    {{ teamStore.getName(log.employeeId) }} {{ log.operation }}
                    <div v-if="log.details" class="text-caption text-grey mt-1">
                      <div v-for="(change, field) in log.details" :key="field">
                        {{ fieldMap[field as keyof typeof fieldMap] }}:
                        {{ formatValue(change.old) }} → {{ formatValue(change.new) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.comment-input-wrapper {
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/*hover:伪类, 鼠标悬停在.file-card元素上时，应用以下样式 */
.file-card:hover {
  /* 鼠标悬停时，将.file-card元素在垂直方向上向上移动2像素 */
  transform: translateY(-2px);
  /* 添加一个阴影效果 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-card {
  height: 80px;
  /* transform属性发生变化时，过渡效果的持续时间为0.2秒 */
  transition: transform 0.2s;
}

/* .v-chip标签的宽度不会超过200像素,防止文字溢出或换行 */
.uniform-file-input :deep(.v-chip) {
    max-width: 200px;
}
</style>