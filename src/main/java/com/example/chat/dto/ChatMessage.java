package com.example.chat.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    private String channelId;
    private String senderId;   // String 타입 유지 (유저 고유키나 식별자)
    private String senderName; // 유저 닉네임 ("토토로" 등)
    private String content;
}