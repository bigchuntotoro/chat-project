// src/components/LoginPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/chat.css";

export default function LoginPage() {
  const [users, setUsers] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [customUsername, setCustomUsername] = useState("");
  const navigate = useNavigate();

  // 컴포넌트 마운트 시 등록된 사용자 목록 조회
  useEffect(() => {
    axios
      .get("/api/users")
      .then((res) => {
        setUsers(res.data); // 백엔드에서 반환하는 User 객체 리스트 ([{ id: 1, name: "홍길동" }, ...])
      })
      .catch((err) => {
        console.error("사용자 목록을 불러오는데 실패했습니다.", err);
      });
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // 셀렉트박스에서 선택했거나 직접 입력한 값 사용
    const usernameToUse = selectedUsername || customUsername;

    if (!usernameToUse.trim()) {
      alert("사용자를 선택하거나 아이디를 입력해주세요.");
      return;
    }

    // 로컬스토리지에 저장하고 채팅 페이지로 이동
    localStorage.setItem("chat_username", usernameToUse.trim());
    navigate("/chat");
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>실시간 채팅 로그인</h2>
        <p>등록된 사용자를 선택하거나 아이디를 입력해주세요.</p>

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
                if (e.target.value) setCustomUsername(""); // 셀렉트 선택 시 직접 입력 초기화
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
                // DB 엔티티 필드명인 user.name을 기준으로 key와 value 지정
                <option key={user.id || user.name} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              textAlign: "center",
              margin: "10px 0",
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
              if (e.target.value) setSelectedUsername(""); // 직접 입력 시 셀렉트 초기화
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
