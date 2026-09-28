package com.example.chat.domain;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class User {
    private String id;
    private String name;
    private LocalDateTime createdAt;
}