import React from "react";
import "../styles/chat.css";

export default function LoginPage() {
  const handleNaverLogin = () => {
    // Spring Boot OAuth2 인증 엔드포인트로 이동
    // (브라우저가 네이버 로그인 페이지로 이동하여 아이디/비밀번호를 입력받습니다)
    window.location.href = "/oauth2/authorization/naver";
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>실시간 협업 툴 로그인</h2>
        <p>팀과의 원활한 소통을 위해 네이버 계정으로 로그인해주세요.</p>

        <button
          className="naver-login-btn"
          onClick={handleNaverLogin}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#03c75a",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          네이버 로그인 (아이디/비밀번호 입력)
        </button>
      </div>
    </div>
  );
}
