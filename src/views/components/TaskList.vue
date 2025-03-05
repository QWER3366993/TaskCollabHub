<script setup lang="ts">
import { computed } from 'vue';
import { useTaskStore } from '@/stores/task';

const taskStore = useTaskStore();
const tasks = computed(() => taskStore.tasks);

const emit = defineEmits(['edit-task', 'delete-task', 'create-task']);

const emitCreateTask = () => {
  emit('create-task');
};

const emitEditTask = (task: any) => {
  emit('edit-task', task);
};

const emitDeleteTask = (id: string) => {
  emit('delete-task', id);
};
</script>

<template>
  <div>
    <el-button type="primary" @click="emitCreateTask">创建任务</el-button>
    <el-table :data="tasks" style="width: 100%">
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="status" label="状态" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button @click="emitEditTask(scope.row)">编辑</el-button>
          <el-button type="danger" @click="emitDeleteTask(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
