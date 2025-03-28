<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { storeToRefs } from 'pinia'

const store = useChatStore()
const { messages } = storeToRefs(store)

// 滚动到底部处理
const messagesEnd = ref<HTMLElement>()

onMounted(() => {
  scrollToBottom()
})

watch(messages, () => {
  nextTick(scrollToBottom)
})

function scrollToBottom() {
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="message-container">
    <div v-for="msg in messages" :key="msg.id" class="message-item">
      <div class="message-header">
        <span class="username">{{ msg.sender.name }}</span>
        <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
        <span v-if="msg.mentions.length" class="mention-badge">@提及</span>
      </div>
      <div class="message-content">
        <span v-for="(part, index) in parseMessage(msg.content)" :key="index">
          <span v-if="part.type === 'mention'" class="mention">@{{ part.user }}</span>
          <span v-else>{{ part.text }}</span>
        </span>
      </div>
      <div class="message-status">
        <span v-if="msg.read" class="read-status">✓ 已读</span>
      </div>
    </div>
    <div ref="messagesEnd" />
  </div>
</template>