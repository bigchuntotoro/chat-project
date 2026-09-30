// src/components/ChatPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useWebSocket from "../hooks/useWebSocket";
import api from "../services/api";
import "../styles/chat.css";

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  const getInitialChannel = () => {
    const params = new URLSearchParams(location.search);
    const queryChannelId = params.get("channelId");
    if (queryChannelId) return queryChannelId;

    const savedChannelId = localStorage.getItem("chat_channelId");
    return savedChannelId || "general";
  };

  const [channelId, setChannelId] = useState(getInitialChannel);

  // 채널별 메시지 관리
  const [messagesMap, setMessagesMap] = useState({});
  const [inputMessage, setInputMessage] = useState("");

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesMap, channelId]);

  // 사용자 정보 및 채널 목록 로드
  useEffect(() => {
    const username = localStorage.getItem("chat_username");
    if (!username) {
      navigate("/", { replace: true });
      return;
    }

    api
      .post("/users", { name: username })
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        console.error("사용자 정보 연동 실패:", err);
        setUser({ id: null, name: username });
      });

    api
      .get("/channels")
      .then((res) => {
        setChannels(res.data);
      })
      .catch((err) => {
        console.error("채널 목록 조회 오류:", err);
      });
  }, [navigate]);

  useEffect(() => {
    if (channelId) {
      localStorage.setItem("chat_channelId", channelId);
    }
  }, [channelId]);

  // 과거 메시지 불러오기
  useEffect(() => {
    api
      .get(`/channels/${channelId}/messages`)
      .then((res) => {
        setMessagesMap((prev) => ({
          ...prev,
          [channelId]: res.data,
        }));
      })
      .catch((err) => {
        console.error("과거 메시지 조회 실패:", err);
      });
  }, [channelId]);

  const handleMessageReceived = (newMessage) => {
    setMessagesMap((prev) => {
      const currentChannelMessages = prev[newMessage.channelId] || [];
      if (currentChannelMessages.some((msg) => msg.id === newMessage.id)) {
        return prev;
      }
      return {
        ...prev,
        [newMessage.channelId]: [...currentChannelMessages, newMessage],
      };
    });
  };

  const { isConnected, sendMessage } = useWebSocket(
    channelId,
    handleMessageReceived,
  );

  const handleLogout = () => {
    if (!window.confirm("정말 로그아웃 하시겠습니까?")) return;
    localStorage.removeItem("chat_username");
    localStorage.removeItem("chat_channelId");
    navigate("/", { replace: true });
  };

  const handleSend = (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;
    if (!user) {
      console.error("로그인 사용자 정보가 없습니다.");
      return;
    }

    const chatMessage = {
      channelId: channelId,
      senderId: user.id ? String(user.id) : user.name,
      senderName: user.name,
      content: inputMessage,
    };

    sendMessage(`/app/chat/${channelId}`, chatMessage);
    setInputMessage("");
  };

  const currentMessages = messagesMap[channelId] || [];

  const getCurrentChannelName = () => {
    if (channelId === "general") return "general";
    const found = channels.find((ch) => String(ch.id) === String(channelId));
    return found ? found.name : channelId;
  };

  const currentChannelParticipants = Array.from(
    new Set(currentMessages.map((msg) => msg.senderName)),
  );

  return (
    <div className="chat-container">
      <div className="sidebar">
        <h3>현재 채널</h3>

        {/* 선택된 현재 채널 표시 */}
        <div
          style={{
            padding: "10px",
            backgroundColor: "#333",
            borderRadius: "4px",
            marginBottom: "15px",
            fontWeight: "bold",
            color: "#fff",
          }}
        >
          # {getCurrentChannelName()}
        </div>

        <div
          className="participants-section"
          style={{
            borderTop: "1px solid #444",
            paddingTop: "10px",
          }}
        >
          <h4 style={{ fontSize: "14px", marginBottom: "8px", color: "#ccc" }}>
            채널 참여자
          </h4>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              fontSize: "13px",
            }}
          >
            {user && !currentChannelParticipants.includes(user.name) && (
              <li style={{ padding: "2px 0" }}>• {user.name} (나)</li>
            )}
            {currentChannelParticipants.map((name, idx) => (
              <li key={idx} style={{ padding: "2px 0" }}>
                • {name} {name === user?.name ? "(나)" : ""}
              </li>
            ))}
          </ul>
        </div>

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

          <button
            type="button"
            onClick={handleLogout}
            className="logout-button"
            style={{
              marginTop: "10px",
              width: "100%",
              padding: "8px",
              backgroundColor: "#ff6b6b",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            로그아웃 / 채널 변경
          </button>
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <h2>채널: #{getCurrentChannelName()}</h2>
        </div>

        <div className="chat-messages">
          {currentMessages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`message-item ${
                msg.senderName === user?.name ? "my-message" : ""
              }`}
            >
              <span className="sender">{msg.senderName}</span>
              <p className="content">{msg.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
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
