package com.example.chat.mapper;

import com.example.chat.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {
    void upsertUser(User user);
    User findUserById(@Param("id") String id);
}