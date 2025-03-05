<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { UploadFile } from 'element-plus';

interface FileItem {
  name: string;
  size: string;
  url: string;
}

const fileList = ref<FileItem[]>([]);

// 文件上传前的校验
const beforeUpload = (file: File) => {
  const isAllowedType = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type);
  const isWithinSize = file.size / 1024 / 1024 < 10; // 文件大小限制为 10MB

  if (!isAllowedType) {
    ElMessage.error('只支持上传 JPG、PNG 或 PDF 文件');
    return false;
  }
  if (!isWithinSize) {
    ElMessage.error('文件大小不能超过 10MB');
    return false;
  }
  return true;
};

// 文件上传成功后的处理
const handleSuccess = (response: any, file: UploadFile) => {
  ElMessage.success('文件上传成功');
  fileList.value.push({
    name: file.name,
    size: `${(file.size! / 1024).toFixed(2)} KB`,
    url: response.url, // 假设后端返回文件的 URL
  });
};

// 文件上传失败后的处理
const handleError = (error: Error) => {
  ElMessage.error('文件上传失败');
  console.error('上传失败:', error);
};

// 删除文件
const handleRemove = (file: FileItem) => {
  fileList.value = fileList.value.filter((item) => item.url !== file.url);
  ElMessage.success('文件删除成功');
};
</script>

<template>
    <div>
        <!-- 替换为实际的上传接口 -->
      <el-upload
        action="/api/upload"  
        :before-upload="beforeUpload"
        :on-success="handleSuccess"
        :on-error="handleError"
        :on-remove="handleRemove"
        :file-list="fileList"
        multiple
      >
        <el-button type="primary">上传文件</el-button>
      </el-upload>
  
      <!-- 已上传文件列表 -->
      <el-table :data="fileList" style="width: 100%; margin-top: 20px">
        <el-table-column prop="name" label="文件名" />
        <el-table-column prop="size" label="文件大小" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button type="danger" @click="handleRemove(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </template>