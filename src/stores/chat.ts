import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Employee } from '@/types/team';
import type { ChatMessage, ChatSession, SessionType, SystemMessage } from '@/types/chat';
import { useTeamStore } from './team';
import { send } from '@/utils/websocket'; // 引入 WebSocket 工具方法
import { useUserStore } from './user';

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

    // 发送消息
    const sendMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        try {
            const fullMessage: ChatMessage = {
                ...message,
                id: crypto.randomUUID(),
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
        const session = sessions.value.find(s => s.id === sessionId);
        if (session) {
            session.unread = 0;
        }
    };

    // 初始化聊天数据
    const initializeChat = async () => {
        const currentTeamId = teamStore.currentEmployee?.teamId; // 获取当前团队ID
        if (!currentTeamId) {
            console.error('无法初始化聊天：缺少团队ID');
            return;
        }
        const [teamData, employeeData] = await Promise.all([
            teamStore.getTeamById(currentTeamId),
            teamStore.getEmployees()
        ]);
        currentTeam.value = teamData;
        employees.value = employeeData;

        // 初始化群聊会话
        if (teamData) {
            sessions.value.push({
                id: teamData.id,
                type: 'group',
                name: teamData.name,
                members: teamData.employees.map(m => m.employeeId),
                unread: 0,
                timestamp: new Date().toISOString()
            });
        }
    };
    // 处理消息接收
    const handleMessage = (message: ChatMessage) => {
        messages.value.push(message);

        // 更新会话状态
        const session = sessions.value.find(s => s.id === message.sessionId);
        if (session) {
            session.lastMessage = message.content;
            session.timestamp = message.timestamp;
            if (session.id !== activeSessionId.value) session.unread++;
        }
    };

    // 生成系统通知内容
    const generateSystemContent = (msg: SystemMessage): string => {
        switch (msg.type) {
            case 'online':
                return `${msg.userName} 已上线`;
            case 'offline':
                return `${msg.userName} 已离线`;
            case 'join':
                return `${msg.userName} 加入了群组 ${msg.teamId}`;
            case 'leave':
                return `${msg.userName} 离开了群组 ${msg.teamId}`;
            default:
                return `系统通知：${JSON.stringify(msg)}`;
        }
    };

    // 处理系统通知
    const handleSystemNotice = (message: SystemMessage) => {
        const content = generateSystemContent(message);
        messages.value.push({
            id: `sys-${Date.now()}`,
            sessionId: 'system',
            sessionType: 'system',
            content,
            sender: 'system',
            timestamp: new Date().toISOString(),
            isRead: false
        });

        // 如果是上下线通知，更新成员状态
        if (['online', 'offline'].includes(message.type)) {
            const user = employees.value.find(e => e.id === message.userId);
            if (user) {
                user.status = message.type === 'online';
            }
        }
    };

    // 切换会话
    const switchSession = (sessionId: string) => {
        activeSessionId.value = sessionId;
        clearUnread(sessionId); // 切换时清除未读
    };

    // 生成私聊会话
    const createPrivateSession = (targetUser: any) => {
        if (!currentUser.value) {
            console.error('无法生成私聊会话：当前用户未定义');
            return null; // 或者抛出异常，根据业务需求决定
        }
        const sessionId = [currentUser.value.employeeId, targetUser.id].sort().join('_');
        if (!sessions.value.some(s => s.id === sessionId)) {
            sessions.value.push({
                id: sessionId,
                type: 'private',
                name: targetUser.name,
                members: [currentUser.value.employeeId, targetUser.id],
                unread: 0,
                timestamp: new Date().toISOString()
            });
        }
        return sessionId;
    };


    return {
        sessions,
        messages,
        activeSessionId,
        employees,
        currentTeam,
        initializeChat,
        handleMessage,
        handleSystemNotice,
        switchSession,
        createPrivateSession,
        sendMessage, 
        clearUnread  
    };
});