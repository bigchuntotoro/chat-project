import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function useWebSocket(channelId, onMessageReceived) {
  const stompClient = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 백엔드 서버 주소를 명확하게 지정 (포트 번호가 다를 경우 백엔드 주소 입력)
    // 예: 백엔드가 8086 포트인 경우 "http://localhost:8086/ws"
    const socket = new SockJS("http://localhost:8086/ws");

    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        console.log(str);
      },
      onConnect: () => {
        setIsConnected(true);
        console.log("WebSocket Connected");

        // 백엔드 ChatController의 브로드캐스트 경로와 일치하는 구독 설정
        client.subscribe(`/topic/channel/${channelId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          onMessageReceived(receivedMessage);
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
