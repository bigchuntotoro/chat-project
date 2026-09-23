package com.example.chat.service;

import com.example.chat.domain.Channel;
import com.example.chat.mapper.ChannelMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChannelService {
    private final ChannelMapper channelMapper;

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

    // 채널 삭제 비즈니스 로직 추가
    @Transactional
    public void deleteChannel(Long id) {
        // (선택사항) 삭제하려는 채널이 존재하는지 확인하는 로직 추가 가능
        Channel channel = channelMapper.findById(id);
        if (channel == null) {
            throw new IllegalArgumentException("존재하지 않는 채널입니다.");
        }
        channelMapper.deleteChannel(id);
    }
}
