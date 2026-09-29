import React, { useState, useEffect, useRef } from "react";
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

  // 채널별 메시지 관리
  const [messagesMap, setMessagesMap] = useState({});
  const [inputMessage, setInputMessage] = useState("");

  // [추가] 자동 스크롤을 위한 Ref 선언
  const messagesEndRef = useRef(null);

  const navigate = useNavigate();

  // ============================================================
  // 스크롤을 맨 아래로 내리는 함수
  // ============================================================
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지가 추가되거나 채널이 변경될 때 자동으로 맨 아래로 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messagesMap, channelId]);

  // ============================================================
  // 사용자 인증 확인 및 DB 연동, 채널 목록 로드
  // ============================================================
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

  // ============================================================
  // 채널 변경 시 해당 채널의 과거 대화 내역(DB) 불러오기
  // ============================================================
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

  // ============================================================
  // WebSocket 실시간 메시지 수신 (현재 선택된 채널 기준)
  // ============================================================
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

  // ============================================================
  // 로그아웃 핸들러
  // ============================================================
  const handleLogout = () => {
    if (!window.confirm("정말 로그아웃 하시겠습니까?")) return;
    localStorage.removeItem("chat_username");
    navigate("/", { replace: true });
  };

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
  // 채널 삭제 핸들러
  // ============================================================
  const handleDeleteChannel = (e, targetId) => {
    e.stopPropagation();

    if (!window.confirm("정말 이 채널을 삭제하시겠습니까?")) return;

    api
      .delete(`/channels/${targetId}`)
      .then(() => {
        setChannels((prev) =>
          prev.filter((ch) => String(ch.id) !== String(targetId)),
        );

        if (String(channelId) === String(targetId)) {
          setChannelId("general");
        }
      })
      .catch((err) => {
        console.error("채널 삭제 실패:", err);
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
      senderId: user.id ? String(user.id) : user.name,
      senderName: user.name,
      content: inputMessage,
    };

    sendMessage(`/app/chat/${channelId}`, chatMessage);
    setInputMessage("");
  };

  // 현재 선택된 채널의 메시지 목록
  const currentMessages = messagesMap[channelId] || [];

  // 현재 선택된 채널의 제목 찾기
  const getCurrentChannelName = () => {
    if (channelId === "general") return "general";
    const found = channels.find((ch) => String(ch.id) === String(channelId));
    return found ? found.name : channelId;
  };

  // 현재 채널 참여자 목록 추출
  const currentChannelParticipants = Array.from(
    new Set(currentMessages.map((msg) => msg.senderName)),
  );

  // ============================================================
  // 화면 렌더링
  // ============================================================
  return (
    <div className="chat-container">
      {/* 좌측 사이드바 (채널 목록 + 채널 참여자 목록 통합) */}
      <div className="sidebar">
        <h3>채널 목록</h3>

        {/* 새 채널 생성 폼 */}
        <form onSubmit={handleCreateChannel} className="channel-create-form">
          <input
            type="text"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="채널 이름..."
            className="channel-create-input"
          />
          <button type="submit" className="channel-create-button">
            추가
          </button>
        </form>

        <ul>
          <li
            className={channelId === "general" ? "active" : ""}
            onClick={() => setChannelId("general")}
          >
            # general
          </li>

          {channels.map((ch) => (
            <li
              key={ch.id}
              className={String(channelId) === String(ch.id) ? "active" : ""}
              onClick={() => setChannelId(String(ch.id))}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span># {ch.name}</span>
              <button
                type="button"
                onClick={(e) => handleDeleteChannel(e, ch.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ff6b6b",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>

        {/* 채널 참여자 목록 영역 */}
        <div
          className="participants-section"
          style={{
            marginTop: "15px",
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
            로그아웃
          </button>
        </div>
      </div>

      {/* 메인 채팅 영역 */}
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
          {/* [추가] 스크롤 위치를 잡아주는 빈 div */}
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
