import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useWebSocket from "../hooks/useWebSocket";
import api from "../services/api";
import "../styles/chat.css";

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [channelId] = useState("general");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const navigate = useNavigate();

  // ============================================================
  // 사용자 인증 확인
  // ============================================================
  useEffect(() => {
    const token = localStorage.getItem("jwt_token");

    // JWT가 아예 없으면 로그인 화면으로 이동
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    api
      .get("/users/me")
      .then((res) => {
        console.log("인증 성공:", res.data);
        setUser(res.data);
      })
      .catch((err) => {
        console.error("인증 실패:", err);

        // --------------------------------------------------------
        // 서버에서 401을 반환한 경우
        // JWT가 만료되었거나 잘못된 토큰
        // --------------------------------------------------------
        if (err.response?.status === 401) {
          localStorage.removeItem("jwt_token");

          // Axios로 OAuth URL을 호출하면 안 됨
          // 브라우저 자체를 OAuth 로그인 URL로 이동
          window.location.href =
            "http://localhost:8086/oauth2/authorization/naver";

          return;
        }

        // --------------------------------------------------------
        // 그 외 오류
        // --------------------------------------------------------
        console.error("사용자 정보 조회 오류:", err);
      });
  }, [navigate]);

  // ============================================================
  // WebSocket 메시지 수신
  // ============================================================
  const handleMessageReceived = (newMessage) => {
    setMessages((prev) => [...prev, newMessage]);
  };

  const { isConnected, sendMessage } = useWebSocket(
    channelId,
    handleMessageReceived,
  );

  // ============================================================
  // 메시지 전송
  // ============================================================
  const handleSend = (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) {
      return;
    }

    if (!user) {
      console.error("로그인 사용자 정보가 없습니다.");
      return;
    }

    const chatMessage = {
      channelId: channelId,
      senderId: user.id,
      senderName: user.name,
      content: inputMessage,
    };

    sendMessage(`/app/chat/${channelId}`, chatMessage);

    setInputMessage("");
  };

  // ============================================================
  // 화면
  // ============================================================
  return (
    <div className="chat-container">
      <div className="sidebar">
        <h3>채널 목록</h3>

        <ul>
          <li className="active"># general</li>
        </ul>

        <div className="user-info">
          {user && (
            <p>
              접속자: <strong>{user.name}</strong>님
            </p>
          )}

          <p className="status-indicator">
            상태:{" "}
            <span className={isConnected ? "online" : "offline"}>
              {isConnected ? "실시간 연결됨" : "연결 끊김"}
            </span>
          </p>
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <h2>채널: #{channelId}</h2>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message-item ${
                msg.senderName === user?.name ? "my-message" : ""
              }`}
            >
              <span className="sender">{msg.senderName}</span>

              <p className="content">{msg.content}</p>
            </div>
          ))}
        </div>

        <form className="chat-input-box" onSubmit={handleSend}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
          />

          <button type="submit">전송</button>
        </form>
      </div>
    </div>
  );
}
