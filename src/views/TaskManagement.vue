<script setup lang="ts">
import { ref } from 'vue';
import TaskList from '@/views/components/TaskList.vue';
import TaskDialog from '@/views/components/TaskDialog.vue';
import { useTaskStore } from '@/stores/task';
import type { Task } from '@/types/task';

const taskStore = useTaskStore();
const dialogVisible = ref(false);
const currentTask = ref<Task | null>(null);

const openCreateDialog = () => {
  currentTask.value = {
    id: '',
    title: '',
    description: '',
    status: '待处理',
    priority: '低',
    assignedTo: '',
    creator: '',
    scheduledTime: new Date(),
    image: undefined, // 可选属性，可以初始化为 undefined
  };
  dialogVisible.value = true;
};

const openEditDialog = (task: Task) => {
  currentTask.value = { ...task };
  dialogVisible.value = true;
};

const deleteTask = async (id: string) => {
  await taskStore.deleteTaskById(id);
};

const saveTask = async (task: Task) => {
  if (task.id) {
    await taskStore.updateTask(task.id, task.status);
  } else {
    await taskStore.createNewTask(task);
  }
  dialogVisible.value = false;
};
</script>

<template>
  <div>
    <h2>任务管理</h2>
    <TaskList @edit-task="openEditDialog" @delete-task="deleteTask" @create-task="openCreateDialog" />
    <TaskDialog v-model="dialogVisible" :task="currentTask" @save="saveTask" />
  </div>
</template>