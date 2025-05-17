<!-- 实时通讯 -->
<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import MemberList from '@/views/team/components/MemberList.vue'
import ChatMessages from '@/views/team/components/ChatMessages.vue'
import ChatInput from '@/views/team/components/ChatInput.vue'
import { useTeamStore } from '@/stores/team'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chat'
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import type { SystemMessage } from '@/types/chat'

// 状态管理
const userStore = useUserStore()
const teamStore = useTeamStore()
const chatStore = useChatStore()
const { activeSessionId, sessions, messages } = storeToRefs(chatStore)
const { employees } = storeToRefs(teamStore)

let socket: WebSocket | null = null

// 系统消息状态
const systemMessages = ref<SystemMessage[]>([])
const currentSession = computed(() =>
  sessions.value.find(s => s.sessionId === activeSessionId.value)
)

const handleSelectSession = async (sessionId: string) => {
  const session = sessions.value.find(s => s.sessionId === sessionId);
  if (!session) return;

  chatStore.switchSession(sessionId);
  if (session.type === 'PRIVATE' || session.type === 'GROUP') {
    await chatStore.loadMessages(sessionId, session.type)
  }
};

onMounted(async () => {
  await userStore.getUserInfo()
  await teamStore.getEmployees()
  await teamStore.getTeamList()
  await chatStore.loadSessions()

})



// 在父组件中处理新建私聊
const handleCreatePrivate = async (targetUserId: string) => {
  const sessionId = await chatStore.createPrivateSession(targetUserId)
  chatStore.switchSession(sessionId)
}

</script>

<template>
  <div class="chat-container">
    <div class="sidebar">
      <MemberList :sessions="sessions" :employees="employees" :active-session-id="activeSessionId"
        :system-messages="systemMessages" @select="handleSelectSession" @create-private="handleCreatePrivate" />
    </div>
    <div class="main-area">
      <template v-if="currentSession">
        <ChatMessages :messages="messages" :session-id="activeSessionId" />
        <ChatInput :session-id="activeSessionId" :session-type="currentSession.type" />
      </template>
      <template v-else>
        <div class="empty-session-tip">
          <p>👈 请选择一个会话开始聊天</p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: grid;
  grid-template-columns: 200px 1fr;
  height: 100%;
  padding: 15px;
}

.sidebar {
  border-right: 1px solid #eee;
  padding: 6px;
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
  border-top: 1px solid #eee;
}

.empty-session-tip {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #828282;
  font-size: 16px;
  padding: 30px;
}
</style>