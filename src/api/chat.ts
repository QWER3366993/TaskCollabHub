import service from '@/utils/request';
import type { ChatMessage, SessionType, SystemMessage } from '@/types/chat';
import type { Employee } from '@/types/team';

// 获取初始未读消息数
export const fetchInitialUnread = async ( sessionId: string) => {
  const response = await service({
    url: `/chat/unread/${sessionId}`,
    method: 'get'
  });
  return response.data;
};

// 获取所有会话
export const fetchChatSessions = async () => {
  const response = await service({
    url: '/chat/sessions',
    method: 'get'
  });
  return response.data;
};

// 获取指定会话的消息内容（支持按类型过滤）
export const fetchMessages = async (sessionId: string, sessionType?: 'PRIVATE' | 'GROUP' | 'SYSTEM') => {
  const response = await service({
    url: `/chat/sessions/${sessionId}/messages`,
    method: 'get',
    params: { sessionType } 
  });
  console.log(response.data);
  return response.data;
};

// 创建新会话
export const createChatSession = async (session: { type: SessionType, members: string[] }) => {
  const response = await service({
    url: '/chat/sessions',
    method: 'post',
    data: session
  });
  return response.data;
};