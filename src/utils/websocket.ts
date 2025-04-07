import { useChatStore } from '@/stores/chat';
import { createToast } from 'mosha-vue-toastify';
import type { ChatMessage, SessionType } from "@/types/chat";
import type { Employee } from "@/types/team";
import { useTeamStore } from "@/stores/team";
import type { FileItem } from "@/types/task";

const WS_URL = import.meta.env.VITE_WS_URL;
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout>;
let heartbeatTimer: ReturnType<typeof setInterval>;

export const connect = (userId: string, token: string) => {
  const chatStore = useChatStore();

  const setupSocket = () => {
    socket = new WebSocket(`${WS_URL}?userId=${userId}&token=${token}`);

    socket.onopen = () => {
      console.log('WebSocket connected');
      startHeartbeat();
      chatStore.initializeChat();
    };

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      // 系统状态消息
      if (data.type === 'presence') {
        chatStore.handleSystemNotice({
          type: data.isOnline ? 'online' : 'offline',
          userId: data.userId,
          userName: data.userName
        });
        return;
      }
      // 群组变更消息
      if (data.type === 'group-change') {
        chatStore.handleSystemNotice({
          type: data.changeType, // 'join' 或 'leave'
          userId: data.userId,
          userName: data.userName,
          teamId: data.teamId
        });
        return;
      }
      // 普通聊天消息
      chatStore.handleMessage(data);
    };

    socket.onclose = () => {
      console.log('WebSocket closed');
      reconnect(userId, token);
    };

    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
      socket?.close();
    };
  };

  const startHeartbeat = () => {
    heartbeatTimer = setInterval(() => {
      socket?.send(JSON.stringify({ type: 'ping' }));
    }, 15000);
  };

  const reconnect = (userId: string, token: string) => {
    clearInterval(heartbeatTimer);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => setupSocket(), 3000);
  };

  setupSocket();
};

export const send = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
  if (socket?.readyState === WebSocket.OPEN) {
    const fullMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    socket.send(JSON.stringify(fullMessage));
    return true;
  }
  return false;
};

export const disconnect = () => {
  socket?.close();
  clearInterval(heartbeatTimer);
  if (reconnectTimer) clearTimeout(reconnectTimer);
};