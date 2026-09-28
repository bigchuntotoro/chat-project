package com.example.chat.domain;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChatMessage {
    private Long id;
    private String channelId;
    private String senderId;
    private String senderName;
    private String content;
    private LocalDateTime createdAt;
}