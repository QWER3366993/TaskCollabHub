<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { fetchMessages, fetchInitialUnread } from '@/api/chat';
import type { ChatMessage } from '@/types/chat';

const messages = ref<ChatMessage[]>([]);  // 用于存储系统通知消息
const unreadCount = ref<number>(0);  // 总未读消息数

// // 获取初始未读消息数
// const loadUnreadCount = async () => {
//   try {
//     const unread = await fetchInitialUnread();
//     unreadCount.value = unread.count;  // 假设返回的是一个包含 count 属性的对象
//   } catch (error) {
//     console.error('获取未读消息数失败:', error);
//   }
// };

// 获取系统通知
const loadSystemNotifications = async () => {
  try {
    // 假设消息接口支持筛选，只获取系统通知
    const systemMessages = await fetchMessages('system');  // 筛选出系统通知
    console.log('系统通知:', systemMessages.value);
    messages.value = systemMessages;
  } catch (error) {
    console.error('获取系统通知失败:', error);
  }
};


// 页面加载时获取初始数据
onMounted(() => {
  // loadUnreadCount();  // 获取未读消息数
  loadSystemNotifications();  // 获取系统通知

});
</script>

<template>
  <div class="message-center">
    <h2>通知中心</h2>

    <!-- 显示总未读消息数 -->
    <div class="unread-count">
      <p>总未读通知: {{ unreadCount }}</p>
    </div>

    <!-- 消息列表 -->
    <div class="message-list" v-if="messages.length > 0">
      <div v-for="message in messages" :key="message.messageId" class="message-item"
        :class="{ unread: !message.isRead }">
        <div class="message-header">
          <span class="sender">{{ message.sender }}</span>
          <span class="timestamp">{{ message.timestamp }}</span>
        </div>
        <div class="message-content">
          {{ message.content }}
        </div>
      </div>
    </div>
    <div v-else>
      <p>没有通知。</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.message-center {
  padding: 20px;
  max-width: 530px;
  margin: 0 auto;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  h2 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 16px;
    text-align: center;
  }

  .unread-count {
    font-size: 16px;
    margin-bottom: 10px;
  }

  .message-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .message-item {
    padding: 10px;
    border-bottom: 1px solid #ddd;
    cursor: pointer;
    transition: background-color 0.3s;

    &.unread {
      background-color: #e3f2fd;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: #555;
    }

    .sender {
      font-weight: bold;
    }

    .timestamp {
      color: #aaa;
    }

    .message-content {
      margin-top: 6px;
      font-size: 16px;
      color: #333;
    }
  }
}
</style>
