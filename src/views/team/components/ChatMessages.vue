<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { storeToRefs } from 'pinia'
import type { ChatMessage } from '@/types/chat'
import dayjs from 'dayjs'
import type { FileItem } from '@/types/task'
const chartStore = useChatStore()
const historyMessage = chartStore.historyMessage
const messages = computed(() => historyMessage)
const messagesEnd = ref<HTMLElement>()
const chatStore = useChatStore()

onMounted(() => {
  scrollToBottom()
})

watch(messages, () => {
  nextTick(scrollToBottom)
})

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick(); // 等待 DOM 更新后执行
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth' });
};

// 标记消息为已读
const markMessagesAsRead = async (sessionId: string) => {
  try {
    chatStore.historyMessage.forEach((msg) => {
      if (msg.sessionId === sessionId) {
        msg.isRead = true; // 直接修改消息状态
      }
    });

    await chatStore.setUnreadCount(sessionId, 0); // 异步设置未读数量归零
  } catch (error) {
    console.error("标记消息已读失败:", error);
  }
};

// 解析消息内容
// 解析消息内容
function parseMessage(message: ChatMessage): any[] {
  try {
    if (!message) return [];
    // 解析消息内容，处理@提及等
    if (message.type === "text") {
      const parts = message.content.split(/(@\S+)/);
      return parts.map(part => ({
        type: part.startsWith('@') ? 'mention' : 'text',
        content: part
      })).filter(part => part.content.trim() !== '');
    }
    // 解析文件消息
    if (message.type === "file" && message.file) {
      return [{ type: 'file', file: message.file }];
    }
    // 解析系统消息
    if (message.type === "system") {
      return [{ type: 'system', content: message.content }];
    }
    return [];
  } catch (error) {
    console.error("解析消息失败:", error);
    return [];
  }
}

// 预先解析所有消息内容
const parsedMessages = computed(() => {
  return messages.value.map(msg => ({
    ...msg,
    parsedContent: parseMessage(msg)
  }));
});
</script>

<template>
  <div class="message-container">
    <div v-for="msg in parsedMessages" :key="msg.id" class="message-item">
      <div class="message-header">
        <span class="username">{{ msg.sender }}</span>
        <span class="timestamp">{{ dayjs(msg.timestamp).format("HH:mm:ss") }}</span>
        <span v-if="msg.mentions?.length" class="mention-badge">@提及</span>
      </div>
      <div class="message-content">
        <span v-for="(part, index) in msg.parsedContent" :key="index">
          <span v-if="part.type === 'mention'" class="mention">{{ part.content }}</span>
          <span v-else-if="part.type === 'file'">
            <a :href="part.file.url" target="_blank">{{ part.file.name }}</a>
          </span>
          <span v-else-if="part.type === 'system'" class="system-message">{{ part.content }}</span>
          <span v-else>{{ part.content }}</span>
        </span>
      </div>
      <div class="message-status">
        <span v-if="msg.isRead" class="read-status">✓ 已读</span>
      </div>
    </div>
    <div ref="messagesEnd"></div>
  </div>
</template>

<style scoped>
.message-container {
  padding: 16px;
  overflow-y: auto;
}

.message-item {
  margin-bottom: 16px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.username {
  font-weight: bold;
}

.timestamp {
  color: #666;
}

.message-content {
  word-break: break-all;
}

.message-status {
  text-align: right;
  color: #666;
}
</style>