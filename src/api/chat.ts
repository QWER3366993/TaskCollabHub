import service from '@/utils/request'
import type { ChatMessage } from '@/types/chat'
import type { Employee } from '@/types/team'

// 获取初始未读消息数
export const fetchInitialUnread = async () => {
  const response = await service({
    url: '/chat/unread',
    method: 'get'
  });
  return response.data;
};

export const fetchChatSessions = async () => {
  const response = await service({
    url: '/chat/sessions',
    method: 'get'
  });
  return response.data;
};

// 获取指定会话的消息内容
export const fetchMessages = async (sessionId: string) => {
  const response = await service({
    url: '/chat/messages',
    method: 'get',
    params: { sessionId }
  });
  return response.data;
};

