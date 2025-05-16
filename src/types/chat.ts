import type { Employee } from "@/types/team";
import type { FileItem } from "@/types/task";

// 消息类型
export type SessionType = "PRIVATE" | "GROUP" | "SYSTEM";

// 消息实体
export interface ChatMessage {
  messageId: string; // 消息ID
  sessionId: string; // 会话ID（私聊：senderId_receiverId，群聊：teamId）
  sessionType: SessionType; // 会话类型
  content: string; // 消息内容（文本消息时）
  sender: string; // 发送者ID
  timestamp: string; // 消息时间
  isRead: boolean; // 是否已读
}

// 整个会话的状态
export interface ChatSession {
  sessionId: string; // 会话ID
  type: SessionType; // 会话类型（私聊/群聊）
  name: string; // 会话名称（群聊的名称或私聊的对方名称）
  avatar?: string; // 头像（可选）
  members: string[]; // 成员ID列表（每个成员ID对应一个员工）
  lastMessage?: string; // 最后一条消息内容（可选）
  unread: number; // 未读消息数
  isPotential?: boolean // 可选字段，用于类型区分
  isSystem?: boolean // 可选字段，用于类型区分
}

// 系统消息
export interface SystemMessage {
  type: 'online' | 'offline' | 'task_notify' | 'join' | 'leave' | 'project_update';
  id?: string; // 任务通知的ID
  title?: string; // 任务通知的标题
  userId?: string; // 用户ID
  userName?: string; // 用户名
  timestamp?: string
  teamId?: string; // 团队ID（可选）
  content?: string;   // 支持 task_notify、join 时的描述
}
