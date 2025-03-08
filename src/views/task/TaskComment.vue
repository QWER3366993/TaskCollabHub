<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTaskStore } from '@/stores/task';
import { useUserStore } from '@/stores/user';
import type { Comment } from '@/types/comment';

const taskStore = useTaskStore();
const userStore = useUserStore();
const props = defineProps<{
  taskId: string;
}>();

const comment = ref('');
const comments = ref<Comment[]>([]);
const currentUser = userStore.user;

const fetchComments = async () => {
  try {
    const fetchedComments = await taskStore.getCommentsByTaskId(props.taskId);
    comments.value = fetchedComments || [];
  } catch (error) {
    console.error('获取评论失败', error);
  }
};

const addComment = async () => {
  if (comment.value.trim()) {
    const newComment: Comment = {
      user: { avatar: currentUser.avatar!, name: currentUser.username! },
      text: comment.value,
    };
    await taskStore.submitComment(props.taskId, newComment);
    comments.value.push(newComment);
    comment.value = '';
  }
};

onMounted(fetchComments);
</script>

<template>
    <div>
      <el-input v-model="comment" type="textarea" placeholder="添加评论" />
      <el-button type="primary" @click="addComment">提交评论</el-button>
      <el-divider />
      <el-list>
        <el-list-item v-for="(comment, index) in comments" :key="index">
          <el-avatar :src="comment.user?.avatar" />
          <span>{{ comment.user?.name }}: {{ comment.text }}</span>
        </el-list-item>
      </el-list>
    </div>
  </template>
  