package com.example.chat.domain;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class User {
    private Long id;          // 자동 생성되는 PK
    private String name;      // 사용자 이름
    private LocalDateTime createdAt;
}