package com.example.chat.controller;

import com.example.chat.domain.User;
import com.example.chat.domain.ChatMessage; // 도메인/엔티티형 메시지
import com.example.chat.mapper.ChatMessageMapper;
import com.example.chat.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController // @Controller 대신 @RestController를 사용하면 모든 메서드에 자동으로 @ResponseBody가 적용됩니다.
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageMapper chatMessageMapper;
    private final UserMapper userMapper;

    // [추가] 등록된 전체 사용자 목록 조회 API (GET 요청 처리 -> 405 에러 해결)
    @GetMapping("/api/users")
    public List<User> getAllUsers() {
        return userMapper.findAllUsers();
    }

    // 1. 사용자 로그인 및 DB 등록/확인 API (404 에러 해결)
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

    // 2. 특정 채널의 과거 대화 내역 조회 API (404 에러 해결)
    @GetMapping("/api/channels/{channelId}/messages")
    public List<ChatMessage> getChannelMessages(@PathVariable String channelId) {
        return chatMessageMapper.findMessagesByChannelId(channelId);
    }

    // 3. 실시간 웹소켓 메시지 수신 및 DB 저장 후 브로드캐스트
    @MessageMapping("/chat/{channelId}")
    public void handleChatMessage(@DestinationVariable String channelId, ChatMessage chatMessage) {
        System.out.println("정상 수신된 채팅 객체: " + chatMessage);

        chatMessage.setChannelId(channelId);

        // [중요] 수신한 메시지를 데이터베이스에 저장 (id와 created_at 채워짐)
        chatMessageMapper.insertMessage(chatMessage);

        // 구독 중인 클라이언트들에게 DB에 저장된(id가 포함된) 메시지 객체를 브로드캐스트
        messagingTemplate.convertAndSend("/topic/channel/" + channelId, chatMessage);
    }
}