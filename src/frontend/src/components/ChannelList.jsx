import React, { useEffect, useState } from "react";
import { fetchChannels, createChannel } from "../services/channelService";

export default function ChannelList({ onSelectChannel }) {
  const [channels, setChannels] = useState([]);
  const [newChannelName, setNewChannelName] = useState("");

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const data = await fetchChannels();
      setChannels(data);
    } catch (error) {
      console.error("채널 목록을 불러오지 못했습니다.", error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const created = await createChannel(newChannelName);
      setChannels([created, ...channels]);
      setNewChannelName("");
    } catch (error) {
      console.error("채널 생성 실패", error);
    }
  };

  return (
    <div className="channel-list-container">
      <h3>채팅 채널 목록</h3>
      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="새 채널 이름..."
          value={newChannelName}
          onChange={(e) => setNewChannelName(e.target.value)}
        />
        <button type="submit">생성</button>
      </form>
      <ul>
        {channels.map((channel) => (
          <li key={channel.id} onClick={() => onSelectChannel(channel)}>
            {channel.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
