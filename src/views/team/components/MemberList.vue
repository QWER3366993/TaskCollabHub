<script setup lang="ts">
import type { ChatSession } from '@/types/chat'
import type { Employee } from '@/types/team'

defineProps<{
  sessions: ChatSession[]
  employees: Employee[]
  activeSessionId?: string
}>()

const getSessionName = (session: ChatSession) => {
  if (session.type === 'group') return `群聊：${session.name}`
  if (session.type === 'private') return `私聊：${session.name}`
  return session.name
}
</script>

<template>
  <div class="member-list">
    <!-- 会话列表 -->
    <div class="session-section">
      <h3>聊天会话</h3>
      <div 
        v-for="session in sessions"
        :key="session.id"
        class="session-item"
        :class="{ active: session.id === activeSessionId }" 
      >
        <div class="session-icon">
          <span v-if="session.type === 'group'">👥</span>
          <span v-else-if="session.type === 'private'">👤</span>
        </div>
        <div class="session-info">
          <div class="session-name">{{ getSessionName(session) }}</div>
          <div class="session-preview">{{ session.lastMessage }}</div>
        </div>
        <div class="session-status">
          <span v-if="session.unread > 0" class="unread-badge">
            {{ session.unread }}
          </span>
        </div>
      </div>
    </div>

    <!-- 在线成员 -->
    <div class="online-section">
      <h3>在线成员</h3>
      <div 
        v-for="employee in employees.filter(e => e.online)"
        :key="employee.employeeId"
        class="member-item"
      >
        <div class="presence-indicator online"></div>
        <span class="employee-name">{{ employee.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 样式优化 */
.session-item {
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f5f5f5;
  }

  &.active {
    background: #e3f2fd;
  }
}

.unread-badge {
  background: #ff4081;
  color: white;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 0.8em;
}

.presence-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;

  &.online {
    background: #4caf50;
  }
}
</style>