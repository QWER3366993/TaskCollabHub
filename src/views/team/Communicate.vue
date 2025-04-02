<!-- 实时通讯 -->
<script setup lang="ts">
import { ref, computed } from 'vue'
// 导入子组件
import MemberList from '@/views/team/components/ChatMessages.vue'
import ChatMessages from '@/views/team/components/ChatMessages.vue'
import ChatInput from '@/views/team/components/ChatInput.vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chat'
import type { ChatMessage } from '@/types/chat'
import type { Employee } from '@/types/team'

// 状态管理
const chartStore = useChatStore()
// 获取状态管理中的数据
const { historyMessage, friendsList } = storeToRefs(chartStore)
const messages = computed(() => historyMessage.value)

const onlineUsers = computed(() => {
  return (friendsList.value as Employee[]).filter(employee => employee && typeof employee === 'object' && 'online' in employee && employee.online)
})
const handleSend = async (message: ChatMessage) => {
  try {
    await chartStore.addMessage(message);
  } catch (error) {
    console.error("发送消息失败:", error);
  }
};

</script>

<template>
  <div class="chat-container">
    <!-- 左侧成员列表 -->
    <div class="sidebar">
      <MemberList :online-users="onlineUsers" />
    </div>
    <!-- 右侧主消息区 -->
    <div class="main-area">
      <ChatMessages :messages="messages" />
      <ChatInput @send-message="handleSend" />
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: grid;
  grid-template-columns: 240px 1fr;
  height: 100%;
}

.sidebar {
  border-right: 1px solid #eee;
  padding: 16px;
  background-color: #f9f9f9;
}

.main-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.main-area > * {
  flex: 1;
  overflow-y: auto;
}

.main-area > :last-child {
  flex: none;
  background-color: #fff;
  border-top: 1px solid #eee;
}
</style>