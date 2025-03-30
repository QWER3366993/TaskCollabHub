<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import type { ChatStatus } from '@/types/chat'
import { storeToRefs } from 'pinia'
import type { User } from '@/types/user'
import type { Employee } from '@/types/team'

const chartStore = useChatStore()
const friendsList = chartStore.friendsList;

const onlineUsers = computed(() => {
  return (friendsList as Employee[]).filter(employee => employee && typeof employee === 'object' && 'online' in employee && employee.online)
})

// 获取在线状态
const presenceStatus = async (employee: Employee): Promise<string> => {
  if (!employee) return '未知状态';  // 如果员工信息无效，返回'未知状态'

  try {
    // 调用 chatStore 中的 getOnlineStatus 方法获取在线状态
    const status = await chartStore.getOnlineStatus(employee.employeeId);
    // 根据获取的状态返回相应的文本
    return status ? '🟢 在线' : '⚪ 离线';  // 在线时返回在线状态图标，离线时返回离线状态图标
  } catch (error) {
    console.error('获取在线状态失败:', error);
    return '未知状态';  // 获取状态失败时，返回'未知状态'
  }
};
</script>

<template>
  <div class="member-list">
    <div v-for="employee in onlineUsers" :key="employee.employeeId" class="member-item">
      <div class="presence-indicator" :class="{ online: employee.online }"></div>
      <span class="employeename">{{ employee.name }}</span>
      <span class="presence-status">{{ presenceStatus(employee) }}</span>
    </div>
  </div>
</template>

<style scoped>
.member-list {
  list-style-type: none;
  padding: 0;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #ddd;
}

.presence-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: gray;
}

.presence-indicator.online {
  background-color: green;
}

.employeename {
  font-weight: bold;
}

.presence-status {
  color: #666;
}
</style>