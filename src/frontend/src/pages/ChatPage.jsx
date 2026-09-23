import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useWebSocket from "../hooks/useWebSocket";
import api from "../services/api";
import "../styles/chat.css";

export default function ChatPage() {
  const [user, setUser] = useState(null);

  // 채널 목록 및 현재 선택된 채널 상태
  const [channels, setChannels] = useState([]);
  const [channelId, setChannelId] = useState("general");
  const [newChannelName, setNewChannelName] = useState("");

  // 채널별 메시지 관리 (채널 ID를 키로 하는 객체 형태 권장)
  // 예: { general: [...], channelA: [...] }
  const [messagesMap, setMessagesMap] = useState({});
  const [inputMessage, setInputMessage] = useState("");

  const navigate = useNavigate();

  // ============================================================
  // 사용자 인증 확인 및 채널 목록 로드
  // ============================================================
  useEffect(() => {
    const token = localStorage.getItem("jwt_token");

    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    // 사용자 정보 조회
    api
      .get("/users/me")
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        console.error("인증 실패:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("jwt_token");
          window.location.href =
            "http://localhost:8086/oauth2/authorization/naver";
          return;
        }
      });

    // 채널 목록 조회 API 호출
    api
      .get("/channels")
      .then((res) => {
        setChannels(res.data);
        // 만약 기본 채널이 목록에 있다면 첫 번째 채널을 기본값으로 설정할 수도 있음
        if (res.data && res.data.length > 0) {
          // 필요에 따라 초기 채널 설정 (여기서는 문자열 id 또는 숫자 id 대응)
          // setChannelId(res.data[0].id.toString());
        }
      })
      .catch((err) => {
        console.error("채널 목록 조회 오류:", err);
      });
  }, [navigate]);

  // ============================================================
  // WebSocket 메시지 수신 (현재 선택된 채널 기준)
  // ============================================================
  const handleMessageReceived = (newMessage) => {
    setMessagesMap((prev) => {
      const currentChannelMessages = prev[newMessage.channelId] || [];
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

  // ============================================================
  // 새 채널 생성 핸들러
  // ============================================================
  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    api
      .post("/channels", { name: newChannelName })
      .then((res) => {
        const createdChannel = res.data;
        setChannels((prev) => [createdChannel, ...prev]);
        setNewChannelName("");
      })
      .catch((err) => {
        console.error("채널 생성 실패:", err);
      });
  };

  // ============================================================
  // 메시지 전송
  // ============================================================
  const handleSend = (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;
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

    // 백엔드 STOMP MessageMapping 경로에 맞게 전송
    sendMessage(`/app/chat/${channelId}`, chatMessage);
    setInputMessage("");
  };

  // 현재 선택된 채널의 메시지 목록
  const currentMessages = messagesMap[channelId] || [];

  // ============================================================
  // 화면
  // ============================================================
  return (
    <div className="chat-container">
      <div className="sidebar">
        <h3>채널 목록</h3>

        {/* 채널 생성 폼 */}
        <form onSubmit={handleCreateChannel} className="channel-create-form">
          <input
            type="text"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="새 채널 이름..."
            className="channel-create-input" // 클래스 이름만 변경
          />
          <button type="submit" className="channel-create-button">
            추가
          </button>
        </form>

        <ul>
          {/* 기본 general 채널 */}
          <li
            className={channelId === "general" ? "active" : ""}
            onClick={() => setChannelId("general")}
            style={{ cursor: "pointer" }}
          >
            # general
          </li>

          {/* 서버에서 불러온 동적 채널 목록 */}
          {channels.map((ch) => (
            <li
              key={ch.id}
              className={String(channelId) === String(ch.id) ? "active" : ""}
              onClick={() => setChannelId(String(ch.id))}
              style={{ cursor: "pointer" }}
            >
              # {ch.name}
            </li>
          ))}
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
          {currentMessages.map((msg, index) => (
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
