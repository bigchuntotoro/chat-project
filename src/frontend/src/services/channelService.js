import axios from "axios";

// Vite Proxy 설정으로 인해 '/api' 요청은 http://localhost:8086/api 로 포워딩됩니다.
export const fetchChannels = async () => {
  const response = await axios.get("/api/channels");
  return response.data;
};

export const createChannel = async (name) => {
  const response = await axios.post("/api/channels", { name });
  return response.data;
};
