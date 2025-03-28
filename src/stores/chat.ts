import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { ChatMessage, ChatStatus } from "@/types/chat";

export const useChatStore = defineStore("chat", () => {
    // 定义状态
    const isOnline = ref(false);
    const username = ref("");
    const toName = ref("");
    const historyMessage = ref<ChatMessage[]>([]);
    const friendsList = ref<string[]>([]);
    const systemMessages = ref<string[]>([]);

    // 好友的用户列表
    const filteredFriendsList = computed(() =>
        friendsList.value.filter((name) => name !== username.value)
    );

    // 更新在线状态
    function setOnlineStatus(status: boolean) {
        isOnline.value = status;
    }

    // 设置用户名
    function setUsername(name: string) {
        username.value = name;
    }

    // 更新好友列表 & 系统消息
    function updateSystemMessages(names: string[]) {
        friendsList.value = names;
        systemMessages.value = filteredFriendsList.value;
    }


    // 添加消息
    function addMessage(message: ChatMessage) {
        // 确保 sender 是字符串类型
        const senderKey = typeof message.sender === "string"
            ? message.sender
            : message.sender?.employeeId || message.sender?.name || "";

        if (!senderKey) {
            console.error("Invalid sender in message:", message);
            return;
        }

        historyMessage.value.push(message);
        sessionStorage.setItem(senderKey, JSON.stringify(historyMessage.value));
    }

    // 切换聊天窗口
    function showChat(name: string) {
        if (toName.value === name) return;
        toName.value = name;
        const history = sessionStorage.getItem(name);
        historyMessage.value = history ? JSON.parse(history) : [];
    }

    return {
        isOnline,
        username,
        toName,
        historyMessage,
        friendsList,
        systemMessages,
        setOnlineStatus,
        setUsername,
        updateSystemMessages,
        addMessage,
        showChat,
    };
});
