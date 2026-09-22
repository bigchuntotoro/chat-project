package com.example.chat.controller;

import com.example.chat.dto.ChatMessage; // 방금 만든 DTO 임포트
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/{channelId}")
    public void handleChatMessage(@DestinationVariable String channelId, ChatMessage chatMessage) {
        System.out.println("정상 수신된 채팅 객체: " + chatMessage);

        // 구독 중인 클라이언트들에게 그대로 브로드캐스트
        messagingTemplate.convertAndSend("/topic/channel/" + channelId, chatMessage);
    }
}