import { useChatStore } from '@/stores/chat'
import type { ChatMessage } from "@/types/chat"

let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout>
let heartbeatTimer: ReturnType<typeof setInterval>
let wsReady = false

// 开启 WebSocket 心跳
const startHeartbeat = () => {
  heartbeatTimer = setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'ping' }))
    }
  }, 15000)
}

// 连接 WebSocket
const setupSocket = (username : string, token: string) => {
  const chatStore = useChatStore()
  socket = new WebSocket(`ws://localhost:8080/ws/chat/${username}?token=${token}`)
  console.log("socket",socket)
  console.log(' 正在建立 WebSocket 连接...')

  socket.onopen = () => {
    console.log(' WebSocket 连接成功')
    wsReady = true
    startHeartbeat()
  }

  socket.onmessage = (e) => {
    const raw = e.data
    console.log(' 收到上线通知:', raw)
    const data = JSON.parse(raw)

    if (data.type === 'presence') {
      chatStore.handleSystemNotice({
        type: data.isOnline ? 'online' : 'offline',
        userId: data.userId,
        userName: data.userName,
        timestamp: ''
      })
    } else if (data.type === 'chat') {
      chatStore.handleMessage(data)
    }
  }

  socket.onclose = () => {
    console.warn(' WebSocket 连接关闭')
    wsReady = false
    reconnect(username, token)
  }

  socket.onerror = (err) => {
    console.error(' WebSocket 出错:', err)
    socket?.close()
  }
}

// 外部调用连接入口
export const connect = (username: string, token: string) => {
  setupSocket(username, token)
}

// 自动重连逻辑
const reconnect = (userId: string, token: string) => {
  clearInterval(heartbeatTimer)
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(() => {
    console.log(' 正在尝试重连...')
    setupSocket(userId, token)
  }, 3000)
}

// 标准发送（仅在 readyState 为 OPEN 时使用）
export const send = (message: Omit<ChatMessage, 'id' | 'timestamp'>): boolean => {
  console.log(` 当前 WebSocket 状态: ${socket?.readyState}`)

  if (socket?.readyState === WebSocket.OPEN) {
    const fullMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }
    console.log(' 发送消息:', fullMessage)
    socket.send(JSON.stringify(fullMessage))
    return true
  }
  console.warn(' WebSocket 未连接，不能发送')
  return false
}

// 安全发送：自动等待连接完成
export const safeSend = (
  message: Omit<ChatMessage, 'id' | 'timestamp'>,
  retryInterval = 300,
  maxRetries = 10
): void => {
  let retries = 0

  const trySend = () => {
    if (wsReady && socket?.readyState === WebSocket.OPEN) {
      send(message)
    } else if (retries < maxRetries) {
      retries++
      console.log(`⏳ WebSocket 未就绪，等待重试（第 ${retries} 次）...`)
      setTimeout(trySend, retryInterval)
    } else {
      console.error(' 多次重试后仍无法发送消息')
    }
  }

  trySend()
}

// 主动断开连接
export const disconnect = () => {
  socket?.close()
  wsReady = false
  clearInterval(heartbeatTimer)
  if (reconnectTimer) clearTimeout(reconnectTimer)
}

// 获取当前连接状态
export const getWebSocketState = () => socket?.readyState
export const isWsReady = () => wsReady
