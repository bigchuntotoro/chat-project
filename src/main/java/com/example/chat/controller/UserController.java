package com.example.chat.controller;

import com.example.chat.domain.User;
import com.example.chat.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserMapper userMapper;

    @GetMapping("/me")
    public ResponseEntity<User> getMyInfo(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).build();
        }

        String email = authentication.getName();
        User user = userMapper.findByEmail(email);

        if (user == null) {
            return ResponseEntity.status(404).build();
        }

        return ResponseEntity.ok(user);
    }
}