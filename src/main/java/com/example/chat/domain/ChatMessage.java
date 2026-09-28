package com.example.chat.domain;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChatMessage {
    private Long id;
    private String channelId;
    private String content;
    private LocalDateTime createdAt;
}