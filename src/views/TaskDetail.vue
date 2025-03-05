<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTaskStore } from '@/stores/task';
import TaskUpload from '@/views/components/TaskUpload.vue';
import TaskComment from '@/views/components/TaskComment.vue';

const taskStore = useTaskStore();
const route = useRoute();
const taskId = route.params.id as string;
const task = ref<any>(null);

const fetchTaskDetail = async () => {
  try {
    task.value = await taskStore.getTaskById(taskId);
  } catch (error) {
    console.error('获取任务详情失败', error);
  }
};

onMounted(fetchTaskDetail);
</script>

<template>
  <div>
    <el-row>
      <el-col :span="12">
        <el-card>
          <h3>{{ task?.title }}</h3>
          <p>优先级: {{ task?.priority }}</p>
          <p>状态: {{ task?.status }}</p>
          <p>负责人: {{ task?.assignedTo }}</p>
        </el-card>
      </el-col>
      <el-col :span="12">
        <TaskUpload :task-id="taskId" />
      </el-col>
    </el-row>

    <el-divider />

    <TaskComment :task-id="taskId" />
  </div>
</template>