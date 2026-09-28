package com.example.chat.controller;

import com.example.chat.domain.User;
import com.example.chat.dto.ChatMessage; // 방금 만든 DTO 임포트
import com.example.chat.mapper.ChatMessageMapper;
import com.example.chat.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    private final ChatMessageMapper chatMessageMapper;
    private final UserMapper userMapper;

    // 사용자 로그인 및 DB 등록/확인 API
    @PostMapping("/api/users")
    public User loginOrRegisterUser(@RequestBody User user) {
        // 1. 닉네임으로 기존 사용자 검색
        User existingUser = userMapper.findUserByName(user.getName());

        if (existingUser != null) {
            return existingUser; // 이미 존재하면 기존 정보 반환 (자동 생성된 id 포함)
        }

        // 2. 없으면 새로 등록
        userMapper.insertUser(user);
        return user; // useGeneratedKeys로 인해 생성된 id가 user 객체에 담김
    }

    // 특정 채널의 과거 대화 내역 조회 API
    @GetMapping("/api/channels/{channelId}/messages")
    public List<com.example.chat.domain.ChatMessage> getChannelMessages(@PathVariable String channelId) {
        return chatMessageMapper.findMessagesByChannelId(channelId);
    }

    @MessageMapping("/chat/{channelId}")
    public void handleChatMessage(@DestinationVariable String channelId, ChatMessage chatMessage) {
        System.out.println("정상 수신된 채팅 객체: " + chatMessage);

        // 구독 중인 클라이언트들에게 그대로 브로드캐스트
        messagingTemplate.convertAndSend("/topic/channel/" + channelId, chatMessage);
    }
}