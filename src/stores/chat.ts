import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import service from '@/utils/request'
import type { ChatMessage, ChatSession, SessionType, SystemMessage } from '@/types/chat';
import { useTeamStore } from './team';
import { send } from '@/utils/websocket'; // 引入 WebSocket 工具方法
import { useUserStore } from './user';
import { fetchChatSessions, fetchMessages, createChatSession, fetchInitialUnread } from '@/api/chat';
import dayjs from 'dayjs';

export const useChatStore = defineStore("chat", () => {
    const teamStore = useTeamStore();
    const userStore = useUserStore();
    // 定义状态
    const sessions = ref<ChatSession[]>([]);
    const messages = ref<ChatMessage[]>([]);
    const activeSessionId = ref<string>("");
    const employees = ref<any[]>([]);
    const currentTeam = ref<any>(null);
    const currentUser = computed(() => teamStore.currentEmployee);
    const wsReady = ref(false);
    // 临时存储上线通知
    const onlineNotices = ref<string[]>([])
    const notifications = ref<SystemMessage[]>([]) // 通知中心

    // WebSocket连接成功后设置为true
    const setWsReady = (ready: boolean) => {
        wsReady.value = ready;
    };

    const isWsReady = computed(() => wsReady.value);

    // 初始化聊天（在登录或切换用户后调用）
    const initializeChat = async () => {
        // 清空旧数据
        sessions.value = [];
        messages.value = [];
        activeSessionId.value = '';
        employees.value = [];
        currentTeam.value = null;

        // 加载会话列表
        await loadSessions();
    };


    // 发送消息
    const sendMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        try {
            const fullMessage: ChatMessage = {
                ...message,
                messageId: crypto.randomUUID(),
                timestamp: new Date().toISOString()
            };

            // 使用 WebSocket 发送
            const success = send(fullMessage);
            if (success) {
                messages.value.push(fullMessage);
            }
            return success;
        } catch (error) {
            console.error("发送消息失败:", error);
            return false;
        }
    };


    // 新增方法：清除未读
    const clearUnread = (sessionId: string) => {
        const session = sessions.value.find(s => s.sessionId === sessionId);
        if (session) {
            session.unread = 0;
        }
    };

    const loadAllPossibleSessions = async () => {
        const [sessionsRes, employeesRes] = await Promise.all([
            fetchChatSessions(),
            teamStore.getEmployees()
        ])

        sessions.value = sessionsRes
        employees.value = employeesRes

    }


    // 处理消息接收
    const handleMessage = (message: ChatMessage) => {
        messages.value.push(message);
        messages.value.sort((a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix());

        const session = sessions.value.find(s => s.sessionId === message.sessionId);
        if (session) {
            session.lastMessage = message.content;
            if (session.sessionId !== activeSessionId.value) session.unread++;
        }
    };


    // 处理上下线提醒消息
    const handlePresenceMessage = (message: SystemMessage) => {
        const content = message.type === 'online'
            ? `${message.userName} 已上线`
            : `${message.userName} 已离线`;

        messages.value.push({
            messageId: `sys-${Date.now()}`,
            sessionId: 'system',
            sessionType: 'SYSTEM',
            content,
            sender: 'system',
            timestamp: new Date().toISOString(),
            isRead: false
        });

        const user = employees.value.find(e => e.userId === message.userId);
        if (user) {
            user.status = message.type === 'online';
        }

        if (message.type === 'online') {
            const notice = `${message.userName} 上线了`;
            onlineNotices.value.push(notice);
            // 10秒后移除
            // setTimeout(() => { ... }, 10000)
        }
    };

    // 处理任务发布通知
    const handleTaskNotifyMessage = (message: SystemMessage) => {
        // 确保消息类型为 task_notify
        if (message.type === 'task_notify') {
            // 生成任务通知内容
            const taskNotifyMessage: SystemMessage = {
                ...message,
                id: message.id || `task-${Date.now()}`, // 使用默认的生成ID
                title: message.title || '任务发布通知', // 设置默认任务标题
                content: message.content || '您有一个新任务' // 设置默认任务内容
            };

            // 将任务通知添加到通知中心
            notifications.value.push(taskNotifyMessage);
        }
    };




    const handleSystemNotice = (message: SystemMessage) => {
        switch (message.type) {
            case 'online':
            case 'offline':
                handlePresenceMessage(message);
                break;

            case 'task_notify':
                handleTaskNotifyMessage(message);
                break;

            default:
                console.warn('未知的系统消息类型:', message);
        }
    };



    // 切换会话
    const switchSession = (sessionId: string) => {
        activeSessionId.value = sessionId;
        clearUnread(sessionId); // 切换时清除未读
    };

    // 生成私聊会话
    const createPrivateSession = async (targetUserId: string): Promise<string> => {
        // 1. 检查是否已存在会话
        const existing = sessions.value.find(s =>
            s.type === 'PRIVATE' &&
            s.members.includes(targetUserId)
        );

        if (existing) return existing.sessionId;

        // 2. 异步获取目标用户信息
        const targetEmployee = await teamStore.getEmployeeById(targetUserId);
        const name = targetEmployee?.name || '新会话';

        // 3. 创建新会话
        const newSession: ChatSession = {
            sessionId: `${[userStore.user?.userId, targetUserId].sort().join('_')}`,
            type: 'PRIVATE' as const,
            name,
            members: [userStore.user?.userId!, targetUserId],
            unread: 0
        };

        // 4. 保存到后端
        const savedSession = await createChatSession(newSession);
        sessions.value.push(savedSession);

        return savedSession.sessionId;
    };


    // 加载会话
    const loadSessions = async () => {
        try {
            const res = await service.get('/chat/sessions');
            sessions.value = await res.data;
        } catch (error) {
            console.error('获取聊天会话失败:', error);
            throw error;
        }
    };


    const receiveMessage = (message: ChatMessage): void => {
        const session = sessions.value.find(s => s.sessionId === message.sessionId);
        if (!session) {
            sessions.value.push({
                sessionId: message.sessionId,
                name: '新会话',
                type: message.sessionType as SessionType, // 确保类型安全
                members: [message.sender],
                lastMessage: message.content,
                unread: 1,
            });
        } else {
            session.lastMessage = message.content;
            if (message.sessionId !== activeSessionId.value) {
                session.unread += 1;
            }
        }
        // 处理发送者名称
        if (!message.sender) {
            const sender = employees.value.find(e => e.userId === message.sender)
            message.sender = sender?.name || '未知用户'
        }
        messages.value.push(message);
    };

    const getters = {
        // 获取当前会话消息 (核心方法)
        getSessionMessages: computed(() => (sessionId: string) => {
            return messages.value
                .filter(m => m.sessionId === sessionId)
                .sort((a, b) => dayjs(a.timestamp).diff(dayjs(b.timestamp)));
        }),

        // 获取当前活动会话
        getActiveSession: computed(() => {
            return sessions.value.find(s => s.sessionId === activeSessionId.value);
        }),

        // 获取会话未读数量
        getUnreadCountBySession: computed(() => (sessionId: string) => {
            const session = sessions.value.find(s => s.sessionId === sessionId);
            return session?.unread || 0;
        }),

    };

    const loadMessages = async (
        sessionId: string,
        sessionType: 'PRIVATE' | 'GROUP' | 'SYSTEM' // sessionType 参数
    ) => {
        try {
            const msgs = await fetchMessages(sessionId, sessionType); // 传递 sessionType
            messages.value = msgs;
        } catch (error) {
            console.error('加载消息失败:', error);
        }
    };

    return {
        sessions,
        messages,
        activeSessionId,
        employees,
        currentTeam,
        ...getters,
        onlineNotices,
        notifications,
        initializeChat,
        loadAllPossibleSessions,
        setWsReady,
        loadSessions,
        loadMessages,
        receiveMessage,
        handleMessage,
        handleSystemNotice,
        switchSession,
        createPrivateSession,
        sendMessage,
        clearUnread
    };
});