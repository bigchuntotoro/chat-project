package com.example.chat.domain;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class User {
    private Long id;
    private String email;
    private String name;
    private String profileImage;
    private String status; // ONLINE, OFFLINE
    private LocalDateTime createdAt;
}