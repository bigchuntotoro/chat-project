// src/components/LoginPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api"; // ChatPage와 동일한 axios 인스턴스 활용
import "../styles/chat.css";

export default function LoginPage() {
  const [users, setUsers] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [customUsername, setCustomUsername] = useState("");
  const navigate = useNavigate();

  // 컴포넌트 마운트 시 등록된 사용자 목록 조회
  useEffect(() => {
    api
      .get("/users") // 백엔드 사용자 목록 조회 엔드포인트
      .then((res) => {
        setUsers(res.data); // [{ id: 1, name: "사용자1" }, ...] 또는 문자열 배열 형태 대응
      })
      .catch((err) => {
        console.error("사용자 목록을 불러오는데 실패했습니다.", err);
      });
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // 셀렉트 박스에서 선택한 값 또는 직접 입력한 값 사용
    const usernameToUse = selectedUsername || customUsername;

    if (!usernameToUse.trim()) {
      alert("사용자를 선택하거나 아이디(닉네임)를 입력해주세요.");
      return;
    }

    // ChatPage에서 읽어갈 수 있도록 로컬스토리지에 저장
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
              {users.map((user) => {
                // 백엔드 데이터 구조에 따라 name 또는 username 속성 대응
                const nameValue =
                  typeof user === "string" ? user : user.name || user.username;
                return (
                  <option key={user.id || nameValue} value={nameValue}>
                    {nameValue}
                  </option>
                );
              })}
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
            placeholder="새로운 아이디 (닉네임)"
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
