<script setup lang="ts">
import type { ChatSession, SystemMessage } from '@/types/chat'
import type { Employee } from '@/types/team'
import { onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const props = defineProps<{
  sessions: ChatSession[] // 已存在的真实会话（来自数据库）
  employees: Employee[]   // 所有团队成员
  activeSessionId?: string
  systemMessages: SystemMessage[]
}>()

const emit = defineEmits<{
  (e: 'select', sessionId: string): void
  (e: 'create-private', targetUserId: string): void
}>()


const currentUserId = userStore.user.userId
// 1.处理会话名称显示
const formatSessionName = (session: ChatSession) => {
  switch (session.type) {
    case 'GROUP':
      return `群聊: ${session.name}`
    case 'PRIVATE':
      const [user1, user2] = session.members
      // 找出私聊中“不是我”的那个人的 ID
      const otherUserId = user1 === currentUserId ? user2 : user1
      // 从会话信息的用户列表中找出这个人
      const otherUser = props.employees.find(e => e.userId === otherUserId)
      return `与 ${otherUser?.name || '用户'} 私聊`
    default:
      return session.name
  }
}

// 2. 获取所有可能的私聊会话（排除已存在的）
const potentialPrivateSessions = computed(() => {
  const currentUserId = props.employees[0]?.userId
  if (!currentUserId) return []

  return props.employees
    .filter(employee =>
      employee.userId !== currentUserId && // 排除自己
      !props.sessions.some(s =>           // 排除已存在的会话
        s.type === 'PRIVATE' &&
        s.members.includes(employee.userId)
      )
    )
    .map(employee => ({
      sessionId: `${[currentUserId, employee.userId].sort().join('_')}`,
      name: employee.name,
      type: 'PRIVATE' as const,
      members: [currentUserId, employee.userId],
      unread: 0,
      isPotential: true // 标记为潜在会话
    }))
})

// 3. 合并会话列表（真实会话 + 潜在私聊会话）
const allDisplaySessions = computed(() => {
  // 合并真实会话和潜在会话
  const mergedSessions = [
    ...props.sessions,
    ...potentialPrivateSessions.value
  ]

  // 使用 formatSessionName 统一处理每个会话名称
  return mergedSessions.map(session => ({
    ...session,
    formattedName: formatSessionName(session), // 添加格式化的名称
  }))
})


// 4. 处理会话点击
const handleSessionClick = (session: ChatSession) => {
  if (session.isPotential) {
    // 如果是潜在会话，创建新会话
    emit('create-private', session.members[1])
  } else {
    // 已有会话，正常切换
    emit('select', session.sessionId)
  }
}

onMounted(async () => {
  await userStore.getUserInfo();
});
</script>

<template>
  <div class="member-list">
    <!-- 系统消息固定区域 -->
    <div class="system-messages">
      <div v-for="msg in systemMessages" :key="msg.timestamp" class="system-message">
        <span class="icon">ℹ️</span>
        <span class="content">
          {{
            msg.type === 'online' ? `${msg.userId} 上线` :
              msg.type === 'offline' ? `${msg.userId} 下线` :
                msg.timestamp
          }}
        </span>
      </div>
    </div>

    <!-- 可滚动的会话列表容器 -->
    <div class="scroll-wrapper">
      <div class="scrollable-sessions">
        <!-- 群聊会话 -->
        <template v-for="session in allDisplaySessions.filter(s => s.type === 'GROUP')" :key="session.sessionId">
          <div class="session-item group" :class="{ active: session.sessionId === activeSessionId }"
            @click="handleSessionClick(session)">
            <span class="icon">👥</span>
            <span class="name">{{ session.name }}</span>
          </div>
        </template>

        <!-- 私聊会话 -->
        <template v-for="session in allDisplaySessions.filter(s => s.type === 'PRIVATE')" :key="session.sessionId">
          <div class="session-item private"
            :class="{ active: session.sessionId === activeSessionId, potential: session.isPotential }"
            @click="handleSessionClick(session)">
            <span class="icon">👤</span>
            <span class="name">{{ session.formattedName }}</span>
            <span v-if="session.isPotential" class="hint">(未开始聊天)</span>
          </div>
        </template>
      </div>
    </div>

  </div>
</template>

<style scoped>
.member-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.scroll-wrapper {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  /* 给滚动条留出空间 */
}

.scrollable-sessions {
  height: 100%;
}

/* 自定义滚动条 */
.scroll-wrapper::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scroll-wrapper::-webkit-scrollbar-thumb {
  background-color: rgba(193, 2, 2, 0.2);
  border-radius: 3px;
}

.system-messages {
  padding: 8px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  overflow-y: auto;
  font-size: 0.8em;
  color: #666;
  padding: 4px 0;
}

/* 会话项基础样式 */
.session-item {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: 8px;
  margin: 4px 0;
  transition: background-color 0.2s ease;
  font-size: 14px;
  gap: 8px;
  color: #333;
}

.session-item:hover {
  background: #f0f2f5;
}

.session-item.active {
  background: #dbeafe;
  font-weight: 600;
  color: #1d4ed8;
}

.session-item.potential {
  color: #888;
}

.session-item .hint {
  font-size: 12px;
  color: #999;
  margin-left: auto;
  font-style: italic;
}

.session-item .icon {
  font-size: 16px;
  color: #555;
}

.session-item.group .icon {
  color: #10b981;
  /* 绿色 */
}

.session-item.private .icon {
  color: #3b82f6;
  /* 蓝色 */
}
</style>