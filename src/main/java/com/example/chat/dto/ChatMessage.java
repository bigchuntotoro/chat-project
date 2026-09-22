package com.example.chat.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class ChatMessage {
    private String channelId;
    private Long senderId;
    private String senderName;
    private String content;
}