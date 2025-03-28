<!-- 实时通讯 -->
<script setup lang="ts">
import { ref } from 'vue'
// 导入子组件
import MemberList from '@/views/team/components/ChatMessages.vue'
import ChatMessages from '@/views/team/components/ChatMessages.vue'
import ChatInput from '@/views/team/components/ChatInput.vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chat'

// 状态管理
const store = useChatStore()

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
}

.main-area {
  display: flex;
  flex-direction: column;
}
</style>