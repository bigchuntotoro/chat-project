import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";

// 네이버 로그인 성공 후 리다이렉트 처리 컴포넌트
function OAuthRedirectHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("jwt_token", token);
      navigate("/chat", { replace: true });
    } else {
      alert("로그인에 실패했습니다.");
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      로그인 처리 중입니다...
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/oauth/redirect" element={<OAuthRedirectHandler />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}
