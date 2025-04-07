<!-- 实时通讯 -->
<script setup lang="ts">
import { computed } from 'vue'
// 导入子组件
import MemberList from '@/views/team/components/MemberList.vue'
import ChatMessages from '@/views/team/components/ChatMessages.vue'
import ChatInput from '@/views/team/components/ChatInput.vue'
import { useTeamStore } from '@/stores/team'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chat'
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
// 状态管理
const userStore = useUserStore()
const teamStore = useTeamStore()
const chatStore = useChatStore()
const { activeSessionId, sessions, messages } = storeToRefs(chatStore)
const { employees } = storeToRefs(teamStore)

const currentSession = computed(() =>
  sessions.value.find(s => s.id === activeSessionId.value)
)

onMounted(async () => {
  await userStore.getUserInfo();
  await teamStore.getEmployees();
  await teamStore.getTeamList();
});
</script>

<template>
  <div class="chat-container">
    <div class="sidebar">
      <MemberList :sessions="sessions" :employees="employees" :active-session-id="activeSessionId" />
    </div>
    <div class="main-area">
      <ChatMessages v-if="currentSession" :messages="messages" :session-id="activeSessionId" />
      <ChatInput v-if="currentSession" :session-id="activeSessionId" :session-type="currentSession.type" />
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: grid;
  grid-template-columns: 240px 1fr;
  height: 100%;
  padding: 15px;
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

.main-area>* {
  flex: 1;
  overflow-y: auto;
}

.main-area> :last-child {
  flex: none;
  background-color: #fff;
  border-top: 1px solid #eee;
}
</style>