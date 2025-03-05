<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTaskStore } from '@/stores/task';
import { ElMessage } from 'element-plus';
import type { Task } from '@/types/task';

const taskStore = useTaskStore();
const scheduledTasks = ref<Task[]>([]);
const dialogVisible = ref(false);
const currentTask = ref<Task>({
  id: '',
  title: '',
  description: '',
  status: '待处理',
  priority: '低', 
   assignedTo: '',
  creator: '',
  scheduledTime: new Date(),
});

// 获取调度任务列表
const fetchScheduledTasks = async () => {
  try {
    await taskStore.getAllTasks();
    scheduledTasks.value = taskStore.tasks;
  } catch (error) {
    console.error('获取调度任务列表失败', error);
    ElMessage.error('获取调度任务列表失败');
  }
};

// 调整任务调度时间
const adjustSchedule = (task: Task) => {
  currentTask.value = { ...task };
  dialogVisible.value = true;
};

// 保存调整后的任务调度时间
const saveAdjustedSchedule = async () => {
  try {
    await taskStore.updateTaskSchedule(currentTask.value.id, currentTask.value.scheduledTime);
    ElMessage.success('任务调度时间已更新');
    dialogVisible.value = false;
    fetchScheduledTasks(); // 刷新任务列表
  } catch (error) {
    console.error('保存任务调度失败', error);
    ElMessage.error('保存任务调度失败');
  }
};

// 保存任务调度时间（直接通过日期选择器）
const saveSchedule = async (task: Task) => {
  try {
    await taskStore.updateTaskSchedule(task.id, task.scheduledTime);
    ElMessage.success('任务调度时间已更新');
  } catch (error) {
    console.error('保存任务调度失败', error);
    ElMessage.error('保存任务调度失败');
  }
};

onMounted(fetchScheduledTasks);
</script>

<template>
  <div>
    <h2>任务调度</h2>
    <el-table :data="scheduledTasks" style="width: 100%" stripe>
      <el-table-column prop="title" label="任务名称" />
      <el-table-column prop="scheduledTime" label="调度时间">
        <template #default="scope">
          <el-date-picker
            v-model="scope.row.scheduledTime"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            @change="saveSchedule(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="assignedTo" label="分配成员" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" @click="adjustSchedule(scope.row)">调整</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 调整任务调度对话框 -->
    <el-dialog v-model="dialogVisible" title="调整任务调度">
      <el-form :model="currentTask">
        <el-form-item label="任务名称">
          <el-input v-model="currentTask.title" disabled />
        </el-form-item>
        <el-form-item label="调度时间">
          <el-date-picker
            v-model="currentTask.scheduledTime"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="分配成员">
          <el-input v-model="currentTask.assignedTo" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAdjustedSchedule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>