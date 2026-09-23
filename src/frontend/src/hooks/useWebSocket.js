import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function useWebSocket(channelId, onMessageReceived) {
  const stompClient = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = new SockJS("/ws");
    //const socket = new SockJS("http://localhost:8086/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        console.log(str);
      },
      onConnect: () => {
        setIsConnected(true);
        console.log("WebSocket Connected");

        // 채널 구독
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
    }
  };

  return { isConnected, sendMessage };
}
