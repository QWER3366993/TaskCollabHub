<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { storeToRefs } from 'pinia'
import type { User } from '@/types/user'

const store = useChatStore()
const { onlineUsers } = storeToRefs(store)

const presenceStatus = (user: User) => {
  if (user.online) return '🟢 在线'
  const minutesAgo = Math.floor((Date.now() - user.lastActive.getTime()) / 60000)
  return `⚪ 离线 (${minutesAgo}分钟前)`
}
</script>

<template>
  <div class="member-list">
    <div v-for="user in onlineUsers" :key="user.id" class="member-item">
      <div class="presence-indicator" :class="{ online: user.online }" />
      <span class="username">{{ user.name }}</span>
      <span class="presence-status">{{ presenceStatus(user) }}</span>
    </div>
  </div>
</template>