package com.example.chat.domain;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class ChatMessage {
    private Long id;
    private String channelId;
    private Long senderId;
    private String senderName;
    private String content;
    private String fileUrl;
    private LocalDateTime sentAt;
}