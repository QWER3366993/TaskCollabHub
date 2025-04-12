<script setup lang="ts">
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import { onUpdated, nextTick, ref, onMounted, computed, watch } from 'vue'
import { useTeamStore } from '@/stores/team';

const teamStore = useTeamStore()
const props = defineProps<{
  messages: any[]
  sessionId: string
}>()

const userStore = useUserStore()
const chatWindowRef = ref<HTMLElement | null>(null)

const filteredMessages = computed(() => {
  return props.messages
    .filter(msg => msg.sessionId === props.sessionId)
    .sort((a, b) => dayjs(a.timestamp).diff(dayjs(b.timestamp)))
})

const getSenderName = (userId: string) => {
  if (userId === userStore.user?.userId) return '我'
  return teamStore.employees.find(e => e.userId === userId)?.name || userId
}


// 自动滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatWindowRef.value) {
      chatWindowRef.value.scrollTop = chatWindowRef.value.scrollHeight
    }
  })
}

watch(filteredMessages, scrollToBottom, { deep: true })
</script>

<template>
  <div class="chat-messages" ref="chatWindowRef">
    <template v-for="msg in filteredMessages" :key="msg.messageId">
      <div v-if="msg.sessionType === 'SYSTEM'" :message="msg"></div>
      <div v-else class="message-item" :class="{ 'own': msg.sender === userStore.user?.userId }">
        <div class="sender" v-if="msg.sessionType === 'GROUP' || msg.sender !== userStore.user?.userId">
          {{ getSenderName(msg.sender) }}
        </div>
        <div class="content">{{ msg.content }}</div>
        <div class="time">
          {{ dayjs(msg.timestamp).format('HH:mm') }}
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.chat-messages {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
  border: 1px solid #000000;
  border-radius: 8px;
  background-color: #f9f9f9;
  min-height: 300px; /* 给个最低高度 */
  display: flex;
  flex-direction: column;
}

.empty-hint {
  margin: auto;
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 20px;
}

.message-item {
  margin-bottom: 12px;
  max-width: 60%;
  padding: 10px;
  background-color: #f1f1f1;
  border-radius: 8px;
}

.message-item.own {
  margin-left: auto;
  background-color: #d0f0fd;
}

.sender {
  font-weight: bold;
  margin-bottom: 4px;
}

.time {
  font-size: 0.75em;
  color: #888;
  text-align: right;
}
</style>