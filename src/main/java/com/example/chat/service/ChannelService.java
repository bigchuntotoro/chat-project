package com.example.chat.service;

import com.example.chat.domain.Channel;
import com.example.chat.mapper.ChannelMapper;
import com.example.chat.mapper.ChatMessageMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChannelService {
    private final ChannelMapper channelMapper;
    private final ChatMessageMapper ChatMessageMapper;

    public List<Channel> getChannelList() {
        return channelMapper.findAll();
    }

    @Transactional
    public Channel createChannel(String name) {
        Channel channel = new Channel();
        channel.setName(name);
        channelMapper.insertChannel(channel);
        return channel;
    }

    @Transactional
    public void deleteChannel(String channelId) {
        // 1. 해당 채널의 대화 내용(메시지) 먼저 삭제 (외래 키 제약 조건 에러 방지)
        ChatMessageMapper.deleteMessagesByChannelId(channelId);

        // 2. 채널 삭제
        channelMapper.deleteChannel(channelId);
    }
}
