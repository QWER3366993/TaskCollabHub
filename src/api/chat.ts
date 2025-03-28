import service from '@/utils/request'
import type { ChatMessage } from '@/types/chat'
import type { Employee } from '@/types/team'

interface GetChatHistoryParams {
    channelId: string
    before?: Date
    limit?: number
}

// 获取历史消息
export const getHistory = async () => {
    const response = await service({
        url: '/chat/history',
        method: 'get',
        params: {
            channelId: 'channelId',
            before: new Date(),
            limit: 10,
        },
    });
    return response.data;
};

// 获取在线状态
export const getPresence = async () => {
    const response = await service({
        url: '/chat/presence',
        method: 'get',
        params: {
            userId: 'userId',
        },
    })
    return response.data;
};

