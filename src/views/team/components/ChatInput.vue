<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  sessionId: string
  sessionType: 'PRIVATE' | 'GROUP' | 'SYSTEM'
}>()

const message = ref('')
const chatStore = useChatStore()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const sendMessage = () => {
  if (!message.value.trim()) return

  const newMsg = {
    messageId: ``, 
    sessionId: props.sessionId,
    sessionType: props.sessionType,
    sender: userStore.user.userId!,
    content: message.value.trim(),
    timestamp: new Date().toISOString(),
    isRead: false,
  }

  chatStore.sendMessage(newMsg)
  message.value = ''
}
</script>

<template>
  <div class="chat-input">
    <textarea
      v-model="message"
      @keydown.enter.prevent="sendMessage"
      placeholder="请输入消息，按 Enter 发送">
    </textarea>
  </div>
</template>

<style scoped>
.chat-input {
  padding: 10px;
  border-top: 1px solid #eee;
  background-color: #fff;
}

textarea {
  width: 100%;
  height: 60px;
  resize: none;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 14px;
}
</style>
