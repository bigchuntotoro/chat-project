package com.example.chat.mapper;

import com.example.chat.domain.ChatMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ChatMessageMapper {
    void insertMessage(ChatMessage message);
    List<ChatMessage> findMessagesByChannelId(@Param("channelId") String channelId);
    // [추가] 특정 채널의 모든 메시지 삭제
    void deleteMessagesByChannelId(String channelId);
}