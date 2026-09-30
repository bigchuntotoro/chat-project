// src/components/LoginPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/chat.css";

export default function LoginPage() {
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);

  const [selectedUsername, setSelectedUsername] = useState("");
  const [customUsername, setCustomUsername] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [newChannelName, setNewChannelName] = useState(""); // 새 채널 입력 상태

  const navigate = useNavigate();

  useEffect(() => {
    // 1. 사용자 목록 조회
    axios
      .get("/api/users")
      .then((res) => {
        setUsers(res.data);
      })
      .catch((err) => {
        console.error("사용자 목록을 불러오는데 실패했습니다.", err);
      });

    // 2. 채널 목록 조회
    axios
      .get("/api/channels")
      .then((res) => {
        setChannels(res.data);
      })
      .catch((err) => {
        console.error("채널 목록을 불러오는데 실패했습니다.", err);
      });
  }, []);

  // 로그인 및 입장 핸들러
  const handleLogin = (e) => {
    e.preventDefault();
    const usernameToUse = selectedUsername || customUsername;

    if (!usernameToUse.trim()) {
      alert("사용자를 선택하거나 아이디를 입력해주세요.");
      return;
    }

    localStorage.setItem("chat_username", usernameToUse.trim());

    const channelToUse = selectedChannelId || "general";
    localStorage.setItem("chat_channelId", channelToUse);

    navigate(`/chat?channelId=${channelToUse}`);
  };

  // 새 채널 생성 핸들러 (로그인 창에서 바로 생성)
  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    axios
      .post("/api/channels", { name: newChannelName })
      .then((res) => {
        const createdChannel = res.data;
        setChannels((prev) => [...prev, createdChannel]); // 목록에 추가
        setSelectedChannelId(String(createdChannel.id)); // 생성한 채널 바로 선택
        setNewChannelName("");
      })
      .catch((err) => {
        console.error("채널 생성 실패:", err);
      });
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>실시간 채팅 로그인</h2>
        <p>사용자와 참여할 채널을 선택해주세요.</p>

        <form onSubmit={handleLogin} style={{ marginTop: "20px" }}>
          {/* 1. 등록된 사용자 리스트 선택 */}
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              등록된 사용자 선택
            </label>
            <select
              value={selectedUsername}
              onChange={(e) => {
                setSelectedUsername(e.target.value);
                if (e.target.value) setCustomUsername("");
              }}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                boxSizing: "border-box",
                borderRadius: "4px",
                border: "1px solid #ddd",
                backgroundColor: "#fff",
              }}
            >
              <option value="">-- 사용자를 선택하세요 --</option>
              {users.map((user) => (
                <option key={user.id || user.name} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              textAlign: "center",
              margin: "5px 0 10px 0",
              color: "#888",
              fontSize: "14px",
            }}
          >
            또는 직접 입력
          </div>

          {/* 2. 직접 입력 Input */}
          <input
            type="text"
            value={customUsername}
            onChange={(e) => {
              setCustomUsername(e.target.value);
              if (e.target.value) setSelectedUsername("");
            }}
            placeholder="아이디 (닉네임)"
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              boxSizing: "border-box",
              marginBottom: "15px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />

          {/* 3. 채널 선택 셀렉트박스 */}
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              참여할 채널 선택
            </label>
            <select
              value={selectedChannelId}
              onChange={(e) => setSelectedChannelId(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                boxSizing: "border-box",
                borderRadius: "4px",
                border: "1px solid #ddd",
                backgroundColor: "#fff",
              }}
            >
              <option value="general"># general (기본 채널)</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  # {channel.name}
                </option>
              ))}
            </select>
          </div>
        </form>

        {/* 4. 새 채널 생성 폼 (로그인 창 하단 영역) */}
        <div
          style={{
            marginTop: "10px",
            marginBottom: "20px",
            borderTop: "1px solid #eee",
            paddingTop: "15px",
          }}
        >
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            새 채널 만들기
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="새 채널 이름..."
              style={{
                flex: 1,
                padding: "10px",
                fontSize: "14px",
                boxSizing: "border-box",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            />
            <button
              type="button"
              onClick={handleCreateChannel}
              style={{
                padding: "10px 16px",
                backgroundColor: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              추가
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          채팅 참여하기
        </button>
      </div>
    </div>
  );
}
