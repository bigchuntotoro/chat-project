import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuthRedirectHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // JWT 토큰을 로컬 스토리지에 저장
      localStorage.setItem("jwt_token", token);
      // 채팅 메인 페이지로 이동
      navigate("/chat");
    } else {
      alert("로그인에 실패했습니다.");
      navigate("/");
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h3>로그인 처리 중입니다. 잠시만 기다려주세요...</h3>
    </div>
  );
}
