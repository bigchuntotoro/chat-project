import React from "react";
import "../styles/chat.css";

export default function LoginPage() {
  const handleNaverLogin = () => {
    // auth_type=reauth 파라미터를 추가하여
    // 이미 로그인된 세션이 있더라도 아이디/비밀번호 입력창 또는 '다른 아이디로 로그인' 화면을 강제로 띄웁니다.
    window.location.href = "/oauth2/authorization/naver?auth_type=reauth";
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
          다른 아이디로 네이버 로그인
        </button>
      </div>
    </div>
  );
}
