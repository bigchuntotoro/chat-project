package com.example.chat.controller;

import com.example.chat.domain.Channel;
import com.example.chat.service.ChannelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class ChannelController {
    private final ChannelService channelService;

    @GetMapping
    public ResponseEntity<List<Channel>> getChannels() {
        return ResponseEntity.ok(channelService.getChannelList());
    }

    @PostMapping
    public ResponseEntity<Channel> createChannel(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        Channel newChannel = channelService.createChannel(name);
        return ResponseEntity.status(HttpStatus.CREATED).body(newChannel);
    }
}