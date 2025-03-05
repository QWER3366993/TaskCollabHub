<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Task } from '@/types/task';

const props = defineProps<{
  modelValue: boolean;
  task: Task | null;
}>();

const emit = defineEmits(['update:modelValue', 'save']);

const visible = ref(props.modelValue);
const task = ref<Task>(props.task || {
  id: '',
  title: '',
  description: '',
  status: '待处理',
  priority: '低',
  assignedTo: '',
  creator: '', 
  scheduledTime: new Date() // 使用当前日期作为默认值
});

const saveTask = () => {
  emit('save', task.value);
  visible.value = false;
};

watch(() => props.modelValue, (value) => {
  visible.value = value;
});

watch(visible, (value) => {
  emit('update:modelValue', value);
});
</script>

<template>
  <el-dialog v-model="visible" :title="task.id ? '编辑任务' : '创建任务'">
    <el-form :model="task">
      <el-form-item label="任务名称">
        <el-input v-model="task.title" />
      </el-form-item>
      <el-form-item label="优先级">
        <el-select v-model="task.priority">
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="task.status">
          <el-option label="未开始" value="not_started" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
        </el-select>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="task.description" type="textarea" />
      </el-form-item>
      <el-form-item label="分配给">
        <el-input v-model="task.assignedTo" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="saveTask">保存</el-button>
    </template>
  </el-dialog>
</template>