package com.example.chat.mapper;

import com.example.chat.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserMapper {
    // 닉네임으로 사용자 조회
    User findUserByName(@Param("name") String name);

    // 숫자 ID로 사용자 조회 (필요한 경우)
    User findUserById(@Param("id") Long id);

    // 새 사용자(닉네임) 등록 및 자동 생성된 숫자 id 반환
    void insertUser(User user);

    List<User> findAllUsers();
}