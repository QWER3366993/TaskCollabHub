<!-- 编辑器组件 -->
<script lang='ts' setup>
import '@wangeditor/editor/dist/css/style.css' // 引入 css
import { onBeforeUnmount, ref, shallowRef, computed } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor } from '@wangeditor/editor'
import { createToast } from 'mosha-vue-toastify'

// 编辑器实例 (使用 shallowRef 优化性能)
const editorRef = shallowRef<IDomEditor>()
const mode = ref<'default' | 'simple'>('default')
const modelValue = defineModel<string>({ required: true })

// 编辑器配置
const toolbarConfig = {
  excludeKeys: ['group-image', 'insertTable'], // 排除不需要的功能
}


const editorConfig = {
  placeholder: '请输入公告内容...',
  MENU_CONF: {
    uploadImage: {
      server: '/upload', // 图片上传接口
      fieldName: 'file',
      maxFileSize: 5 * 1024 * 1024, // 5M
      allowedFileTypes: ['image/*'],
      customInsert(res: any, insertFn: any) {
        insertFn(res.data.url, '', '') // 处理上传响应
      },
    },
  },
}

// 高度响应式
const editorHeight = computed(() => {
  return window.innerHeight < 600 ? '300px' : '500px'
})

// 处理编辑器创建
const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  editor?.destroy()
})
</script>

<template>
    <div class="editor-wrapper">
        <toolbar class="editor-toolbar" :editor="editorRef" :mode="mode" :default-config="toolbarConfig" />
        <editor class="editor-content" :style="{ height: editorHeight }" v-model="modelValue" :mode="mode"
            :default-config="editorConfig" @on-created="handleCreated"/>
    </div>
</template>

<style scoped>
.editor-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
   max-height: 350px; /* 限制高度 */
  overflow-y: auto; /* 启用滚动条 */
}

.editor-toolbar {
  border-bottom: 1px solid #e5e7eb !important;
  background: #f9fafb;
}

.editor-content {
  padding: 0 16px;
  background: white;
}
</style>