package com.example.chat.mapper;

import com.example.chat.domain.Channel;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ChannelMapper {
    List<Channel> findAll();
    void insertChannel(Channel channel);
    Channel findById(Long id);
    void deleteChannel(Long id); // 채널 삭제
}