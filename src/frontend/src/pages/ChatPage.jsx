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
    <div className="chat-container" style={{ flexDirection: "column" }}>
      {/* 상단으로 옮겨진 상태 표시 및 정보 영역 */}
      <div
        className="top-status-bar"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 15px",
          backgroundColor: "#222",
          color: "#fff",
          borderBottom: "1px solid #444",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontWeight: "bold", color: "#4dabf7" }}>
            #{getCurrentChannelName()}
          </span>
          <span className="status-indicator" style={{ fontSize: "13px" }}>
            상태:{" "}
            <span className={isConnected ? "online" : "offline"}>
              {isConnected ? "실시간 연결됨" : "연결 끊김"}
            </span>
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
          }}
        >
          {user && (
            <span>
              <strong>{user.name}</strong>님
            </span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: "4px 8px",
              backgroundColor: "#ff6b6b",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            나가기/변경
          </button>
        </div>

        {/* 참여자 요약 가로 표시 */}
        <div
          style={{
            width: "100%",
            fontSize: "12px",
            color: "#aaa",
            borderTop: "1px solid #333",
            paddingTop: "5px",
          }}
        >
          참여자:{" "}
          {user && !currentChannelParticipants.includes(user.name)
            ? `${user.name}(나), `
            : ""}
          {currentChannelParticipants
            .map((name) => `${name}${name === user?.name ? "(나)" : ""}`)
            .join(", ")}
        </div>
      </div>

      {/* 메인 채팅 영역 (전체 화면 활용) */}
      <div
        className="chat-main"
        style={{
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="chat-messages"
          style={{ flex: 1, overflowY: "auto", padding: "10px" }}
        >
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

        <form
          className="chat-input-box"
          onSubmit={handleSend}
          style={{ display: "flex", padding: "10px", background: "#f8f9fa" }}
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <button
            type="submit"
            style={{ marginLeft: "8px", padding: "8px 16px" }}
          >
            전송
          </button>
        </form>
      </div>
    </div>
  );
}
