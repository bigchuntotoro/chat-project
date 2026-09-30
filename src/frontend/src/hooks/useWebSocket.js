// src/hooks/useWebSocket.js
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function useWebSocket(channelId, onMessageReceived) {
  const stompClient = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // ★ 핵심: 콜백 함수가 바뀔 때마다 ref에 최신 함수를 동기화하여 클로저 이슈 방지
  const savedCallback = useRef(onMessageReceived);
  useEffect(() => {
    savedCallback.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    if (!channelId) return;

    const socket = new SockJS("/ws");

    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        // console.log(str);
      },
      onConnect: () => {
        setIsConnected(true);
        console.log("WebSocket Connected");

        // 채널별 구독 설정
        client.subscribe(`/topic/channel/${channelId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          // 최신 콜백 호출
          if (savedCallback.current) {
            savedCallback.current(receivedMessage);
          }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log("WebSocket Disconnected");
      },
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, [channelId]);

  const sendMessage = (destination, payload) => {
    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.publish({
        destination: destination,
        body: JSON.stringify(payload),
      });
    } else {
      console.warn("WebSocket이 연결되어 있지 않습니다.");
    }
  };

  return { isConnected, sendMessage };
}
