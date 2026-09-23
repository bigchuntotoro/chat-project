package com.example.chat.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class ChatMessage {
    private String channelId;
    private String senderId; // Long -> String으로 변경
    private String senderName;
    private String content;
}