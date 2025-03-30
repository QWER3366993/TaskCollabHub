import type { Employee } from "@/types/team"
import type { FileItem } from "@/types/task"

// 消息类型
export type MessageType = "text" | "file" | "system";

// 整个会话的状态
export interface ChatStatus {
    employeeId: string; // 读取用户 ID
    unreadCount: number; // 未读消息数量
    readTime?: string; // 读取时间
    lastActive: string // 最后活动时间
    friendsList: Employee[]; // 好友列表
    historyMessage: ChatMessage[]; // 历史消息
    systemMessages: string[]; // 系统消息
  }

// 消息实体
export interface ChatMessage {
    id: string // 消息ID
    sessionId: string; // 会话 ID（群聊 or 私聊）
    type: MessageType; // 消息类型（文本 / 文件）
    content: string; // 消息内容（文本消息时）
    sender: string // 发送者
    receiverId?: string; // 私聊接收者 ID（群聊为空）
    receiverType: "employee" | "team"; // 接收者类型（私聊/群聊）
    timestamp: string // 消息时间
    mentions?: Employee[]; // 被@的用户
    file?: FileItem; // 附件（文件消息）
    system?: boolean; // 是否是系统消息
    isRead: boolean; // 是否已读
}

