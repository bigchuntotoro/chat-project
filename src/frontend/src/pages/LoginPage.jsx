import React from "react";
import "../styles/chat.css";

export default function LoginPage() {
  const handleNaverLogin = () => {
    // Spring Boot OAuth2 인증 엔드포인트로 이동
    window.location.href = "/oauth2/authorization/naver";
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>실시간 협업 툴 로그인</h2>
        <p>팀과의 원활한 소통을 위해 로그인해주세요.</p>
        <button className="naver-login-btn" onClick={handleNaverLogin}>
          네이버 로그인
        </button>
      </div>
    </div>
  );
}
