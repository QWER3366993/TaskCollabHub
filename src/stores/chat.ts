import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ChatMessage, ChatStatus } from '@/types/chat';
import type { Employee } from '@/types/team';
import dayjs from 'dayjs';
import { fetchHistory, fetchUnreadCount, updateOnlineStatus, getPresence, sendMessage } from '@/api/chat';
import { useTeamStore } from '@/stores/team';
import { createToast } from 'mosha-vue-toastify';
import type { GetChatHistoryParams ,UpdateOnlineStatusParams } from '@/api/chat';

export const useChatStore = defineStore("chat", () => {
    const teamStore = useTeamStore();
    // 定义状态
    const onlineStatus = ref(false);
    const receiverId = ref('');
    const currentSessionId = ref("team-default") // 当前会话ID
    const currentSessionType = ref<'employee' | 'team'>('team'); // 当前会话类型
    const historyMessage = ref<ChatMessage[]>([]);
    const friendsList = ref<Employee[]>([]);
    const systemMessages = ref<string[]>([]);
    const unreadCount = ref<Record<string, number>>({}); // 记录各个会话的未读消息数
    const socket = ref<WebSocket | null>(null)


    // 连接WebSocket
    function connectWebSocket() {
        socket.value = new WebSocket('ws://your-websocket-url')

        socket.value.onopen = () => {
            console.log('WebSocket connection established')
        }

        socket.value.onmessage = (event) => {
            const message: ChatMessage = JSON.parse(event.data)
            historyMessage.value.push(message)
        }

        socket.value.onerror = (error) => {
            console.error('WebSocket error:', error)
        }

        socket.value.onclose = () => {
            console.log('WebSocket connection closed')
        }
    }

    // 获取历史消息
    const getHistory = async (params: GetChatHistoryParams) => {
        const data = await fetchHistory(params);
        historyMessage.value = data;
    };

    // 发送消息
    const sendMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not open');
            return false;
        }
        const fullMessage: ChatMessage = {
            ...message,
            id: crypto.randomUUID(),
            timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        };
        socket.value.send(JSON.stringify(fullMessage));
        historyMessage.value.push(fullMessage);
        return true;
    };

    // 获取在线状态
    const getOnlineStatus = async (userId: string): Promise<boolean> => {
        try {
            const response = await getPresence(userId);
            onlineStatus.value = response;
            // return !!onlineStatus.value;  // 或者使用这段代码替换if-else,确保返回布尔值
            if (onlineStatus.value) {
                console.log("用户在线");
                return true;
            } else {
                console.log("用户离线");
                return false;
            }
        } catch (error) {
            console.error("获取在线状态失败:", error);
            throw error;
        }
    };

    // 更新在线状态
    const setOnlineStatus = async (params: UpdateOnlineStatusParams) => {
        try {
            const data = await updateOnlineStatus(params);
            onlineStatus.value = params.status;
        } catch (error) {
            console.error("更新在线状态失败:", error);
            createToast("状态更新失败，请重试", { type: "danger" });
        }
    };
   
    // 好友的用户列表（过滤掉当前用户）
    const filteredFriendsList = computed(() => {
        return friendsList.value.filter(friend => friend.employeeId !== teamStore.currentEmployee?.employeeId);
    });


    // 更新好友列表 & 系统消息
    const updateSystemMessages = (employees: Employee[]) => {
        friendsList.value = employees;
        // 将过滤后的好友列表赋值给系统消息
        systemMessages.value = filteredFriendsList.value.map(friend => friend.name);
    };

    // 添加消息
    const addMessage = (message: ChatMessage) => {
        historyMessage.value.push(message);
        sessionStorage.setItem(message.sender, JSON.stringify(historyMessage.value));
    };

    // 切换聊天窗口
    const showChat = (Id: string) => {
        if (receiverId.value === Id) return;
        receiverId.value = Id;
        const history = sessionStorage.getItem(Id);
        historyMessage.value = history ? JSON.parse(history) : [];
    };

    // 获取所有未读消息总数
    const totalUnread = computed(() => {
        return Object.values(unreadCount.value).reduce((sum, count) => sum + count, 0);
    });

    // 加载未读消息数
    const loadUnreadCount = async (sessionId: string) => {
        try {
            const unreadData = await fetchUnreadCount(sessionId); // 获取未读消息数
            if (unreadData && typeof unreadData === 'object') {
                // 合并新数据到现有数据中
                unreadCount.value = { ...unreadCount.value, ...unreadData };
            } else {
                console.error('Invalid unread count data format:', unreadData);
            }
        } catch (error) {
            console.error('Failed to load unread count:', error);
        }
    };

    // 更新未读消息计数
    function setUnreadCount(sessionId: string, count: number) {
        unreadCount.value[sessionId] = count;
    }

    // 增加未读消息数
    function incrementUnread(sessionId: string) {
        unreadCount.value[sessionId] = (unreadCount.value[sessionId] || 0) + 1;
    }

    // 清空未读消息数
    function clearUnread(sessionId: string) {
        unreadCount.value[sessionId] = 0;
    }

    return {
        onlineStatus,
        currentSessionId,
        currentSessionType,
        receiverId,
        historyMessage,
        friendsList,
        systemMessages,
        unreadCount,
        totalUnread,
        socket,
        filteredFriendsList,
        getHistory,
        connectWebSocket,
        sendMessage,
        getOnlineStatus,
        setOnlineStatus,
        setUnreadCount,
        incrementUnread,
        updateOnlineStatus,
        clearUnread,
        loadUnreadCount,
        updateSystemMessages,
        addMessage,
        showChat,
    };
});
