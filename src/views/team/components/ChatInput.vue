<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '@/stores/chat'
import type { ChatMessage } from '@/types/chat'
import type { Employee } from '@/types/team'
import { useTeamStore } from '@/stores/team'

const teamStore = useTeamStore()
const chatStore = useChatStore()
const draft = ref('')
const fileInput = ref<HTMLInputElement>()
const mentions = ref<Employee[]>([])
const senderName = teamStore.currentEmployee?.name || "未知用户"

const sendMessage = async () => {
  if (!draft.value.trim()) return
  const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
    sessionId: chatStore.currentSessionId,
    type: 'text',
    content: draft.value,
    sender: senderName,
    receiverType: chatStore.currentSessionType,
    mentions: mentions.value,
    isRead: false
  }

  await chatStore.sendMessage(message)
  draft.value = ''
  mentions.value = []
}

const handleFileUpload = async (e: Event) => {
  const files = (e.target as HTMLInputElement)?.files
  if (files?.length) {
    const file = files[0]
    const fileMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
      sessionId: chatStore.currentSessionId,
      type: 'file',
      content: file.name,
      sender: senderName,
      receiverType: chatStore.currentSessionType,
      isRead: false,
      file: {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadTime: new Date().toISOString(),
      }
    }
    await chatStore.sendMessage(fileMessage)
  }
}

const checkMention = async (text: string) => {
  const match = text.match(/@(\w+)$/)
  if (match) {
    const username = match[1]
    const employee = teamStore.employees.find(e =>
      e.name === username || e.employeeId === username
    )
    if (employee) mentions.value.push(employee)
  }
}

</script>

<template>
  <div class="chat-input">
    <input v-model="draft" @input="checkMention(draft)" @keydown.enter="sendMessage" placeholder="输入消息..." />
    <input ref="fileInput" type="file" hidden @change="handleFileUpload" />
    <button @click="fileInput?.click()">📎</button>
    <button @click="sendMessage">发送</button>
  </div>
</template>

<style scoped>
.chat-input {
  display: flex;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #eee;
}

.chat-input input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 8px;
}

.chat-input button {
  padding: 8px 16px;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.chat-input button:hover {
  background-color: #0056b3;
}
</style>