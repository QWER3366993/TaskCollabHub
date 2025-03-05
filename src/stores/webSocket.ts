// 管理 WebSocket 连接以及消息处理。
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useWebSocketStore = defineStore('websocket', () => {
  const messages = ref<any[]>([]);
  const ws = ref<WebSocket | null>(null);

  const connect = () => {
    ws.value = new WebSocket('ws://localhost:8080/ws');
    ws.value.onopen = () => {
      console.log
