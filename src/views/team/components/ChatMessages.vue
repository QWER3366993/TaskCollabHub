<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import dayjs from 'dayjs'
import { useChatStore } from '@/stores/chat'
import type { ChatMessage } from '@/types/chat'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const props = defineProps<{
  messages: ChatMessage[]
  sessionId: string
}>()

const chatStore = useChatStore()
const messagesEnd = ref<HTMLElement>()

// 自动滚动到底部
const scrollToBottom = () => {
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
}

// 标记为已读
const markAsRead = () => {
  if (props.sessionId) {
    chatStore.clearUnread(props.sessionId);
  }
}

// 消息分组（按天）
const groupedMessages = computed(() => {
  const groups: Record<string, ChatMessage[]> = {}
  
  props.messages.forEach(msg => {
    const date = dayjs(msg.timestamp).format('YYYY-MM-DD')
    if (!groups[date]) groups[date] = []
    groups[date].push(msg)
  })

  return Object.entries(groups)
})

onMounted(scrollToBottom)
</script>

<template>
  <div class="message-container" @scroll="markAsRead">
    <div v-for="[date, messages] in groupedMessages" :key="date">
      <div class="date-divider">{{ dayjs(date).format('YYYY年MM月DD日') }}</div>
      
      <div v-for="msg in messages" :key="msg.id" class="message-bubble">
        <div class="message-header">
          <span class="sender">{{ msg.sender }}</span>
          <span class="time">{{ dayjs(msg.timestamp).format('HH:mm') }}</span>
        </div>
        
        <div class="message-content">
          <!-- 系统消息 -->
          <template v-if="msg.sessionType === 'system'">
            <span class="system-message">{{ msg.content }}</span>
          </template>

          <!-- 普通消息 -->
          <template v-else>
            <span v-if="msg.mentions?.includes(userStore.user.userId!)" class="mention">
              @你
            </span>
            {{ msg.content }}
          </template>

          <!-- 文件消息 -->
          <div v-if="msg.file" class="file-message">
            <a :href="msg.file.url" target="_blank">
              📎 {{ msg.file.name }} ({{ (msg.file.size / 1024).toFixed(1) }}KB)
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <div ref="messagesEnd"></div>
  </div>
</template>

<style scoped>
.message-bubble {
  background: white;
  border-radius: 12px;
  padding: 8px 12px;
  margin: 8px 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.system-message {
  color: #666;
  font-style: italic;
}

.mention {
  color: #ff4081;
  font-weight: bold;
}

.file-message a {
  color: #2196f3;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.date-divider {
  text-align: center;
  color: #999;
  margin: 16px 0;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 45%;
    height: 1px;
    background: #eee;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }
}
</style>