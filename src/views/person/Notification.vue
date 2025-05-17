<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { fetchMessages, fetchInitialUnread } from '@/api/chat';
import type { ChatMessage } from '@/types/chat';
import { useUserStore } from '@/stores/user';

const messages = ref<ChatMessage[]>([]);  // 用于存储系统通知消息
const unreadCount = ref<number>(0);  // 总未读消息数
const userStore = useUserStore();

// // 获取初始未读消息数
// const loadUnreadCount = async () => {
//   try {
//     const unread = await fetchInitialUnread();
//     unreadCount.value = unread.count;  // 假设返回的是一个包含 count 属性的对象
//   } catch (error) {
//     console.error('获取未读消息数失败:', error);
//   }
// };

// 解析系统通知内容
const parseSystemContent = (content: string) => {
  try {
    const data = JSON.parse(content);
    switch (data.type) {
      case 'task_create':
        return `📢 新任务分配：《${data.title}》`;
      case 'task_transfer':
        return `🔄 任务移交：《${data.title}》→ 新负责人 ${data.newOwner}`;
      case 'task_update':
        return `✏️ 任务更新：《${data.title}》变更内容：${data.changes}`;
      default:
        return content;
    }
  } catch {
    return content; // 解析失败时返回原始内容
  }
};

// 格式化时间戳
const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString();
};

// 加载系统通知
const loadSystemNotifications = async () => {
  const employeeId = userStore.employee?.employeeId;
  if (!employeeId) {
    console.error('当前员工ID不存在，无法加载通知');
    return;
  }
  try {
    // 使用当前用户ID作为 sessionId(接收者)，并指定 sessionType=SYSTEM
    const systemMessages = await fetchMessages(employeeId, 'SYSTEM');
    messages.value = systemMessages.map((msg: ChatMessage) => ({
      ...msg,
      content: parseSystemContent(msg.content), // 解析内容
      timestamp: formatTimestamp(msg.timestamp) // 格式化时间
    }));
    unreadCount.value = systemMessages.filter((msg: ChatMessage) => !msg.isRead).length; // 计算未读数
  } catch (error) {
    console.error('获取系统通知失败:', error);
  }
};

// 页面加载时获取初始数据
onMounted(async () => {
    await userStore.getUserInfo();
  // loadUnreadCount();  // 获取未读消息数
  await loadSystemNotifications();  // 获取系统通知
});
</script>

<template>
  <div class="message-center">
    <h2 class="header-title">通知中心 <span class="unread-count">({{ unreadCount }} 未读)</span></h2>

    <div class="message-list" v-if="messages.length > 0">
      <div 
        v-for="message in messages" 
        :key="message.messageId" 
        class="message-item"
        :class="{ unread: !message.isRead }"
      >
        <div class="message-header">
          <span class="sender">{{ message.sender === 'system' ? '系统通知' : message.sender }}</span>
          <span class="timestamp">{{ message.timestamp }}</span>
        </div>
        <div class="message-content">
          {{ message.content }}
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>📭 暂时没有新的通知</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.message-center {
  padding: 24px;
  margin: 20px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .header-title {
    font-size: 20px;
    margin-bottom: 25px;
    border-bottom: 1px solid #eee;
    padding-bottom: 12px;

    .unread-count {
      font-size: 15px;
      color: #797979;
      margin-left: 8px;
      font-weight: normal;
    }
  }

  .message-list {
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 8px;

    .message-item {
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 6px;

      &.unread {
        // 背景颜色
        background: #e7f4fe;
        // 侧边线条
        border-left: 3px solid #2196f3;
      }

      &:last-child {
        margin-bottom: 0;
      }

      .message-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;

        .sender {
          font-size: 14px;
          color: #444;
          font-weight: 500;
        }

        .timestamp {
          font-size: 12px;
          color: #888;
        }
      }

      .message-content {
        font-size: 14px;
        color: #333;
        line-height: 1.5;
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 40px 0;
    color: #666;
    font-size: 14px;
    
    p {
      margin: 0;
    }
  }
}
</style>