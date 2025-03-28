<script setup lang="ts">
import { ref } from 'vue'

const draft = ref('')
const fileInput = ref<HTMLInputElement>()
const mentions = ref<string[]>([])

function sendMessage() {
  if (!draft.value.trim()) return

  chatSocket.sendMessage({
    id: crypto.randomUUID(),
    content: draft.value,
    mentions: mentions.value,
    timestamp: new Date(),
    read: false
  })
  
  draft.value = ''
  mentions.value = []
}

function handleFileUpload(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files?.length) {
    // 处理文件上传逻辑
  }
}

// @提及处理
function checkMention(text: string) {
  const match = text.match(/@(\w+)$/)
  if (match) {
    // 显示成员选择下拉框
  }
}
</script>

<template>
  <div class="chat-input">
    <input 
      v-model="draft"
      @input="checkMention(draft)"
      @keydown.enter="sendMessage"
      placeholder="输入消息..."
    />
    <input
      ref="fileInput"
      type="file"
      hidden
      @change="handleFileUpload"
    />
    <button @click="fileInput?.click()">📎</button>
    <button @click="sendMessage">发送</button>
  </div>
</template>