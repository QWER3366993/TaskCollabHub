import { useChatStore } from "@/stores/chat";
import { createToast } from 'mosha-vue-toastify';
import type { ChatMessage } from "@/types/chat";
import type { Employee } from "@/types/team";
import { useTeamStore } from "@/stores/team";

const WS_BASE_URL = import.meta.env.VITE_WS_URL;
const RECONNECT_INTERVAL = 3000; // 重连间隔
const HEARTBEAT_INTERVAL = 15000; // 心跳间隔
const teamStore = useTeamStore();

let webSocket: WebSocket | null = null;
let reconnectAttempts = 0;
let heartbeatTimer: NodeJS.Timeout | null = null;

// 初始化带认证的WebSocket连接
export const initWebSocket = (userId: string, token: string) => {
  const chatStore = useChatStore();
  const connect = () => {
    webSocket = new WebSocket(`${WS_BASE_URL}?userId=${userId}&token=${token}`);
    webSocket.onopen = () => {
      reconnectAttempts = 0;
      chatStore.updateOnlineStatus({employeeId: teamStore.currentEmployee?.employeeId || '', status: true});
      startHeartbeat();
    };
    webSocket.onmessage = (event) => {
      handleMessage(JSON.parse(event.data));
    };
    webSocket.onclose = (event) => {
      chatStore.updateOnlineStatus({employeeId: teamStore.currentEmployee?.employeeId || '', status: false});
      if (!event.wasClean) {
        scheduleReconnect();
      }
    };
    webSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      createToast('连接异常，尝试重连...', { type: 'warning' });
    };
  };

  const handleMessage = (data: ChatMessage) => {
    if (data.system) {
      // 确保 contentArray 是 Employee[] 类型
      const contentArray = Array.isArray(data.content)
        ? data.content.map(item => {
          if (typeof item === 'string') {
            try {
              return JSON.parse(item); // 尝试将字符串解析为 Employee 对象
            } catch (e) {
              console.error('解析 Employee 数据失败:', item, e);
              return null; // 返回 null 表示无效数据
            }
          } else {
            return item; // 如果已经是对象，直接返回
          }
        }).filter(Boolean) as Employee[] // 过滤掉无效数据并断言为 Employee[]
        : [];

      chatStore.updateSystemMessages(contentArray); // 调用方法时确保类型匹配
    } else {
      const message: ChatMessage = {
        ...data,
        timestamp: new Date(data.timestamp).toISOString(),
        mentions: data.mentions?.map(m => ({
          ...m,
        }))
      };
      chatStore.addMessage(message);
    }
  };

  const startHeartbeat = () => {
    heartbeatTimer = setInterval(() => {
      webSocket?.send(JSON.stringify({ type: 'ping' }));
    }, HEARTBEAT_INTERVAL);
  };

  const scheduleReconnect = () => {
    if (reconnectAttempts < 5) {
      setTimeout(() => {
        reconnectAttempts++;
        connect();
      }, RECONNECT_INTERVAL);
    }
  };

  connect();
};

// 带状态检查的消息发送
export const sendMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
  if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
    createToast('消息发送失败，连接未就绪', { type: 'danger' });
    return false;
  }

  const fullMessage: ChatMessage = {
    ...message,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };

  webSocket.send(JSON.stringify(fullMessage));
  return true;
};

// 主动关闭连接
export const closeWebSocket = () => {
  if (webSocket) {
    webSocket.close(1000, '正常关闭');
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  }
};