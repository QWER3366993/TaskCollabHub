<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTaskStore } from '@/stores/task';
import type { Task } from '@/types/task';
import dayjs from 'dayjs';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const commentInput = ref('');
const userStore = useUserStore();
const taskId = route.params.id as string; // 从路由参数中获取任务 ID

const task = ref<Task>({
  teamId: '1',
  id: '1',
  employeeId: 'ui',
  title: '任务详情示例',
  description: '这是任务详情描述',
  status: '进行中',
  priority: '中',
  assignedTo: '李四',
  creator: '王五',
  scheduledTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  deadline: dayjs().add(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
  comments: [],
  isIndependent: true
});

const statusColor = (status?: string) => {
  const colors: Record<string, string> = {
    '待处理': 'orange',
    '进行中': 'blue',
    '已完成': 'green'
  };
  return colors[status || ''] || 'grey';
};

const addComment = async () => {
  if (commentInput.value.trim()) {
    const newComment = {
      user: {
        name: userStore.user.name!,
        avatar: userStore.user.avatar!
      },
      // 使用 trim() 方法来去除输入内容两端的空格
      content: commentInput.value.trim(),
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
    // 提交到 store 进行持久化
    await taskStore.submitComment(taskId, newComment);
    // 更新本地数据
    if (task.value.comments) {
      task.value.comments.push(newComment);
    } else {
      task.value.comments = [newComment];
    }
    commentInput.value = '';
  }
};

onMounted(async () => {
  const taskDetails = await taskStore.getTaskById(taskId);
  if (taskDetails) {
    task.value = taskDetails;
  }
});
</script>

<template>
  <v-container class="task-detail">
    <v-btn color="grey" variant="text" prepend-icon="mdi-arrow-left" @click="router.back()" class="mb-4">
      返回列表
    </v-btn>

    <v-row>
      <v-col cols="12" md="8">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon large class="mr-2">mdi-clipboard-text-outline</v-icon>
            {{ task.title }}
          </v-card-title>

          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-list density="comfortable">
                  <v-list-item>
                    <template #prepend>
                      <v-icon>mdi-account</v-icon>
                    </template>
                    <v-list-item-title>负责人</v-list-item-title>
                    <v-list-item-subtitle>{{ task.assignedTo }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-icon>mdi-alert-circle</v-icon>
                    </template>
                    <v-list-item-title>状态</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip :color="statusColor(task.status)" size="small">
                        {{ task.status }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-icon>mdi-priority-high</v-icon>
                    </template>
                    <v-list-item-title>优先级</v-list-item-title>
                    <v-list-item-subtitle>{{ task.priority }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>

              <v-col cols="12" md="6">
                <v-list density="comfortable">
                  <v-list-item>
                    <template #prepend>
                      <v-icon>mdi-clock-start</v-icon>
                    </template>
                    <v-list-item-title>创建时间</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ dayjs(task.scheduledTime).format('YYYY/MM/DD HH:mm') }}
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-icon>mdi-clock-alert</v-icon>
                    </template>
                    <v-list-item-title>截止时间</v-list-item-title>
                    <v-list-item-subtitle :class="{ 'text-red': dayjs(task.deadline).isBefore(dayjs()) }">
                      {{ dayjs(task.deadline).format('YYYY/MM/DD HH:mm') }}
                      <span class="text-caption ml-1">
                        ({{ dayjs(task.deadline).fromNow() }})
                      </span>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>

              <v-col cols="12">
                <div class="text-subtitle-1 mb-2">任务描述</div>
                <v-card variant="outlined" class="pa-4">
                  {{ task.description }}
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card elevation="2" class="comment-section">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-comment-multiple-outline</v-icon>
            任务讨论（{{ task.comments?.length || 0 }}）
          </v-card-title>

          <v-card-text>
            <div v-for="(comment, index) in task.comments" :key="index" class="mb-4">
              <div class="d-flex align-start">
                <v-avatar color="primary" size="36" class="mr-2">
                  <span class="text-white">{{ comment.user.avatar.charAt(0) }}</span>
                </v-avatar>
                <div>
                  <div class="d-flex align-center">
                    <span class="font-weight-medium">{{ comment.user.name }}</span>
                    <span class="text-caption text-grey ml-2">
                      {{ dayjs().fromNow() }}
                    </span>
                  </div>
                  <div class="text-body-2 mt-1">{{ comment.content }}</div>
                </div>
              </div>
            </div>

            <v-textarea v-model="commentInput" label="添加评论" variant="outlined" rows="2" auto-grow
              @keydown.enter.except.prevent="addComment" />
            <v-btn color="primary" prepend-icon="mdi-send" @click="addComment" :disabled="!commentInput.trim()">
              发送
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>