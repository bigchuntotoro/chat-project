package com.example.chat.security;

import com.example.chat.domain.User;
import com.example.chat.mapper.UserMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider tokenProvider;
    private final UserMapper userMapper;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> responseMap = oAuth2User.getAttribute("response");

        String email = (String) responseMap.get("email");
        String name = (String) responseMap.get("name");
        String profileImage = (String) responseMap.get("profile_image");

        // DB에 유저가 없으면 자동 회원가입
        User user = userMapper.findByEmail(email);
        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setProfileImage(profileImage);
            userMapper.insertUser(user);
        } else {
            userMapper.updateUserStatus(email, "ONLINE");
        }

        // JWT 토큰 생성
        String token = tokenProvider.createToken(email, name);

        // 프론트엔드 콜백 페이지로 JWT 토큰과 함께 리다이렉트 (포트 87)
        String targetUrl = UriComponentsBuilder.fromUriString("http://100.88.187.37:8096/oauth/redirect")
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}