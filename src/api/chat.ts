import service from '@/utils/request'
import type { ChatMessage } from '@/types/chat'
import type { Employee } from '@/types/team'

export interface GetChatHistoryParams {
    channelId: string
    before?: Date
    limit?: number
}

export interface UpdateOnlineStatusParams {
    employeeId: string;
    status: boolean;
}

interface SendMessageParams {
    message: Omit<ChatMessage, 'id' | 'timestamp'>;
}

// 获取历史消息
export const fetchHistory = async (params: GetChatHistoryParams): Promise<ChatMessage[]> => {
    const response = await service({
        url: '/chat/history',
        method: 'get',
        params,
    });
    return response.data;
};

// 获取在线状态
export const getPresence = async (employeeId: string) => {
    const response = await service({
        url: '/chat/presence',
        method: 'get',
        params: { employeeId },
    });
    return response.data;
};

// 更新在线状态
export const updateOnlineStatus = async (params: UpdateOnlineStatusParams) => {
    const response = await service({
        url: '/chat/status',
        method: 'put',
        data: params,
    });
    return response.data;
};

// 发送消息
export const sendMessage = async (params: SendMessageParams) => {
    const response = await service({
        url: '/chat/send',
        method: 'post',
        data: params.message,
    });
    return response.data;
};

// 获取未读消息数量
export const fetchUnreadCount = async (sessionId: string) => {
    const response = await service({
        url: '/chat/unread',
        method: 'get',
        params: { sessionId },
    });
    return response.data;
};
