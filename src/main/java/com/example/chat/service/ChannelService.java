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
}
