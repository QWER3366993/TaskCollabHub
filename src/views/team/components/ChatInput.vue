<!-- ChatInput.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useTeamStore } from '@/stores/team'
import type { ChatMessage } from '@/types/chat'
import type { FileItem } from '@/types/task'

const props = defineProps<{
  sessionId: string
  sessionType: 'private' | 'group' | 'system'
}>()

const teamStore = useTeamStore()
const chatStore = useChatStore()
const draft = ref('')
const fileInput = ref<HTMLInputElement>()

const sendMessage = async () => {
  if (!draft.value.trim()) return

  const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
    sessionId: props.sessionId,
    sessionType: props.sessionType,
    content: draft.value,
    sender: teamStore.currentEmployee!.employeeId,
    isRead: false
  }

  await chatStore.sendMessage(message)
  draft.value = ''
}

const handleFile = async (e: Event) => {
  const file = (e.target as HTMLInputElement)?.files?.[0]
  if (!file) return

  const fileItem: FileItem = {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    url: URL.createObjectURL(file),
    uploadTime: new Date().toISOString()
  }

  const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
    sessionId: props.sessionId,
    sessionType: props.sessionType,
    content: `发送文件：${file.name}`,
    sender: teamStore.currentEmployee!.employeeId,
    file: fileItem,
    isRead: false
  }

  await chatStore.sendMessage(message)
}
</script>

<template>
  <div class="chat-input">
    <input
      v-model="draft"
      @keydown.enter.prevent="sendMessage"
      placeholder="输入消息..."
    />
    
    <input
      ref="fileInput"
      type="file"
      hidden
      @change="handleFile"
    />
    
    <button @click="fileInput?.click()">
      📎
    </button>
    
    <button @click="sendMessage">
      发送
    </button>
  </div>
</template>

<style scoped>
.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border-top: 1px solid #eee;

  input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 20px;
    outline: none;

    &:focus {
      border-color: #2196f3;
    }
  }

  button {
    padding: 8px 16px;
    border: none;
    border-radius: 20px;
    background: #2196f3;
    color: white;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.9;
    }

    &:active {
      opacity: 0.8;
    }
  }
}
</style>