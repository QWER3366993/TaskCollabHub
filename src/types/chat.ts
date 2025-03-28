import type { Employee } from "@/types/team"
import type { FileItem } from "./task"

// 消息类型
export type MessageType = "text" | "file";

// 状态
export interface ChatStatus {
    userId: string; // 读取用户 ID
    read: boolean; // 是否已读
    readTime?: string; // 读取时间
    lastActive: string // 最后活动时间
    friendsList: string[]; // 好友列表
    historyMessage: ChatMessage[]; // 历史消息
    systemMessages: string[]; // 系统消息

  }

// 消息实体
export interface ChatMessage {
    id: string // 消息ID
    sessionId: string; // 会话 ID（群聊 or 私聊）
    type: MessageType; // 消息类型（文本 / 文件）
    content: string; // 消息内容（文本消息时）
    sender: Employee // 发送者
    receiverId?: string; // 私聊接收者 ID（群聊为空）
    receiverType: "employee" | "team"; // 接收者类型（私聊/群聊）
    timestamp: string // 消息时间
    mentions?: Employee[]; // 被@的用户
    file?: FileItem; // 附件（文件消息）
    system?: boolean; // 是否是系统消息
}

