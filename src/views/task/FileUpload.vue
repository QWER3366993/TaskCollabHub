<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { FileItem } from '@/types/task';
import { useTaskStore } from '@/stores/task'
import { createToast } from 'mosha-vue-toastify';
import { useRoute } from 'vue-router'
import { uploadPublicFile, uploadTaskFile } from '@/api/task';
const route = useRoute();
const taskStore = useTaskStore()
const files = ref<FileItem[]>([])
const taskId = route.query.id as string;
const loading = ref(false)
const uploadProgress = ref(0)
const searchQuery = ref('')
const currentScope = ref<'task' | 'public'>('task')
const uploadInput = ref<HTMLInputElement | null>(null);

const emits = defineEmits(['update'])

const headers = [
  { title: '文件名', key: 'name' },
  { title: '类型', key: 'type' },
  { title: '大小', key: 'size' },
  { title: '上传时间', key: 'createdAt' },
  { title: '操作', key: 'actions' }
]

// 新增作用域切换
const scopeOptions = [
  { title: '任务文件', value: 'task' },
  { title: '公共文件', value: 'public' }
]

// 文件类型图标映射
const fileTypeIcons: Record<string, string> = {
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'application/pdf': 'picture_as_pdf',
  'default': 'file_present'
};

const getFileIcon = (type: string) => {
  return fileTypeIcons[type] || fileTypeIcons.default;
};



// 文件列表计算属性
const filteredFiles = computed(() => {
  return (taskStore.files || []).filter(file =>
    file.scope === currentScope.value &&
    file.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 文件上传处理
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) {
    createToast('未选择任何文件', { position: 'top-center', showIcon: true, type: 'warning' });
    return;
  }

  const formData = new FormData();
  Array.from(target.files).forEach(file => formData.append('files', file));

  try {
    if (currentScope.value === 'task') {
      await uploadTaskFile(taskId, formData); // 确保 taskId 正确传递
    } else {
      await uploadPublicFile(formData);
      createToast('文件上传成功', { position: 'top-center', showIcon: true, type: 'success' });
    }
  } catch (error) {
    createToast('文件上传失败', { position: 'top-center', showIcon: true, type: 'danger' });
  }
};

// 删除文件
const deleteFile = async (id: string) => {
  if (!confirm('确定删除此文件？')) return
  try {
    const response = await taskStore.removeFile(id)
    await taskStore.getFiles()
    createToast('文件删除成功', { position: 'top-center', showIcon: true, type: 'success' });
    return response;
  } catch (error) {
    createToast('文件删除失败', { position: 'top-center', showIcon: true, type: 'success' });
  }
}

// 格式化文件大小
const formatSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// 初始化加载
onMounted(async () => {
  loading.value = true
  try {
    await taskStore.getFiles();
    files.value = taskStore.files
  } finally {
    loading.value = false
  }
})

</script>

<template>
  <v-container class="file-manager">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="folder" class="mr-2"></v-icon>
        文件管理
        <v-spacer></v-spacer>

        <!-- 搜索框布局 -->
        <v-text-field v-model="searchQuery" label="搜索文件..." prepend-inner-icon="search" density="compact" class="mr-4"
          style="max-width: 300px; margin-top: 20px" />

        <!-- 使用 scopeOptions 动态生成按钮 -->
        <v-btn-toggle v-model="currentScope" mandatory class="mr-4">
          <v-btn v-for="option in scopeOptions" :key="option.value" :value="option.value" variant="outlined">
            {{ option.title }}
          </v-btn>
        </v-btn-toggle>

        <v-btn color="primary" @click="uploadInput?.click()">
          <v-icon icon="upload" class="mr-2"></v-icon>
          上传文件
          <input ref="uploadInput" type="file" hidden @change="handleFileUpload" multiple>
        </v-btn>
      </v-card-title>

      <v-card-text>

        <v-progress-linear v-if="uploadProgress > 0" :model-value="uploadProgress" height="20" color="light-blue"
          striped>
          <template v-slot:default>
            <span class="text-white">{{ uploadProgress }}%</span>
          </template>
        </v-progress-linear>

        <v-data-table :headers="headers" :items="filteredFiles" :loading="loading" class="elevation-1">
          <template v-slot:item.size="{ item }">
            {{ formatSize(item.size) }}
          </template>

          <!-- 使用图标替换文件类型文字 -->
          <template v-slot:item.type="{ item }">
            <v-icon>{{ getFileIcon(item.type) }}</v-icon>
          </template>

          <template v-slot:item.createdAt="{ item }">
            {{ new Date(item.uploadTime).toLocaleString() }}
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn icon variant="text" color="primary" :href="item.url" target="_blank">
              <v-icon>download</v-icon>
            </v-btn>

            <v-btn icon variant="text" color="grey" @click="deleteFile(item.id)">
              <v-icon>delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
.file-manager {
  max-width: 1200px;
  margin: 0 auto;
}

:deep(.v-data-table__td) {
  vertical-align: middle;
}
</style>