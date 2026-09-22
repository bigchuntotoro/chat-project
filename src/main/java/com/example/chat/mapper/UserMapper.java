package com.example.chat.mapper;

import com.example.chat.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {
    User findByEmail(@Param("email") String email);
    void insertUser(User user);
    void updateUserStatus(@Param("email") String email, @Param("status") String status);
}