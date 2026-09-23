// src/components/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/chat.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      alert("사용할 아이디(닉네임)를 입력해주세요.");
      return;
    }

    // 간단히 이름을 로컬스토리지에 저장하고 채팅 페이지로 이동
    localStorage.setItem("chat_username", username.trim());
    navigate("/chat");
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>실시간 채팅 로그인</h2>
        <p>채팅에서 사용할 아이디를 입력해주세요.</p>

        <form onSubmit={handleLogin} style={{ marginTop: "20px" }}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
          <button
            type="submit"
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
        </form>
      </div>
    </div>
  );
}
