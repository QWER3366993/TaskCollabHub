import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Notification {
  id: string
  message: string
  type: 'info' | 'warning' | 'error'
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])

  // 添加通知
  function addNotification(message: string, type: 'info' | 'warning' | 'error') {
    const id = new Date().getTime().toString()
    notifications.value.push({ id, message, type })
  }

  // 删除通知
  function removeNotification(id: string) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return {
    notifications,
    addNotification,
    removeNotification
  }
})
