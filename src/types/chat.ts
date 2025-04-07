import type { Employee } from "@/types/team"
import type { FileItem } from "@/types/task"

// 消息类型
export type SessionType = "private" | "group" | "system";

// 消息实体
export interface ChatMessage {
  id: string // 消息ID
  sessionId: string; // 会话ID（私聊：senderId_receiverId，群聊：teamId）
  sessionType: SessionType;
  content: string; // 消息内容（文本消息时）
  sender: string // 发送者
  timestamp: string // 消息时间
  mentions?: string[]; // 被@的用户Id
  file?: FileItem; // 附件（文件消息）
  isRead: boolean; // 是否已读
}

// 整个会话的状态
export interface ChatSession {
  id: string;
  type: SessionType;
  name: string;          // 显示名称
  avatar?: string;       // 头像
  members: string[];     // 成员ID列表
  lastMessage?: string;  // 最后消息预览
  unread: number;        // 未读数
  timestamp: string;     // 最后活动时间
}

export interface SystemMessage {
  type: 'online' | 'offline' | 'join' | 'leave';
  userId: string;
  userName: string;
  teamId?: string;
}

