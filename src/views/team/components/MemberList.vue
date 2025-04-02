<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import { storeToRefs } from 'pinia'
import type { Employee } from '@/types/team'

const chartStore = useChatStore()
const friendsList = computed(() => chartStore.friendsList);

const onlineUsers = computed(() => {
  return friendsList.value.filter(employee => 
    employee?.online === true // 简化过滤条件
  )
})

const statusMap = ref<Record<string, string>>({})

onMounted(async () => {
  await chartStore.getFriendsList() // 确保 `friendsList` 被正确加载

  console.log('Friends List:', friendsList) // 调试输出
  
  for (const employee of friendsList.value) {
    try {
      const status = await chartStore.getOnlineStatus(employee.employeeId)
      statusMap.value = { ...statusMap.value, [employee.employeeId]: status ? '🟢 在线' : '⚪ 离线' };
    } catch (error) {
      console.error('获取状态失败:', error)
      statusMap.value = { ...statusMap.value, [employee.employeeId]: '未知状态' };
    }
  }
})
</script>

<template>
  <div class="member-list">
    <div v-for="employee in onlineUsers" :key="employee.employeeId" class="member-item">
      <div class="presence-indicator" :class="{ online: employee.online }"></div>
      <span class="employeename">{{ employee.name }}</span>
      <span class="presence-status">{{ statusMap[employee.employeeId] }}</span>
    </div>
  </div>
</template>

<!-- 样式保持不变 -->