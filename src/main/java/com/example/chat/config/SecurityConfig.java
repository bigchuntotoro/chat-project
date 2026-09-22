package com.example.chat.config;

import com.example.chat.security.JwtAuthenticationFilter;
import com.example.chat.security.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    // ================================================================
    // 1) API 전용 체인 (/api/**)
    //
    // oauth2Login()을 아예 등록하지 않으므로, 이 체인을 타는 요청은
    // 어떤 경우에도 Naver OAuth로 리다이렉트될 수 없다.
    // 인증 실패 시 항상 401만 반환한다.
    // ================================================================
    @Bean
    @Order(1)
    public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {

        http
                .securityMatcher("/api/**")

                .cors(cors ->
                        cors.configurationSource(corsConfigurationSource())
                )

                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // 인증 API는 인증 없이 접근 가능
                        .requestMatchers("/api/auth/**").permitAll()

                        // 나머지 API는 인증 필요
                        .anyRequest().authenticated()
                )

                // ========================================================
                // 인증 실패 처리: 무조건 401 반환 (리다이렉트 없음)
                // ========================================================
                .exceptionHandling(exception ->
                        exception.authenticationEntryPoint(
                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
                        )
                )

                // ========================================================
                // JWT Filter
                // ========================================================
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    // ================================================================
    // 2) 나머지 체인 (로그인 흐름 + WebSocket 등)
    //
    // 여기에만 oauth2Login()이 적용된다.
    // ================================================================
    @Bean
    @Order(2)
    public SecurityFilterChain webFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors ->
                        cors.configurationSource(corsConfigurationSource())
                )

                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // 기본 페이지
                        .requestMatchers("/").permitAll()

                        // 401 sendError() 등이 내부적으로 forward하는 에러 디스패치 경로.
                        // 이걸 permitAll 하지 않으면 /api 쪽에서 만든 401이
                        // 이 체인의 oauth2Login 엔트리포인트에 다시 걸려 302로 덮어써진다.
                        .requestMatchers("/error").permitAll()

                        // WebSocket
                        .requestMatchers("/ws/**").permitAll()

                        // OAuth2
                        .requestMatchers(
                                "/oauth2/**",
                                "/login/**"
                        ).permitAll()

                        // 나머지도 인증 필요
                        .anyRequest().authenticated()
                )

                // ========================================================
                // OAuth2 Login
                // ========================================================
                .oauth2Login(oauth2 ->
                        oauth2
                                .userInfoEndpoint(userInfo ->
                                        userInfo.userService(
                                                new DefaultOAuth2UserService()
                                        )
                                )
                                .successHandler(oAuth2SuccessHandler)
                )

                // ========================================================
                // JWT Filter (WebSocket 핸드셰이크 등에서 JWT 인증이 필요한 경우 대비)
                // ========================================================
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    // ================================================================
    // CORS
    // ================================================================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of("http://localhost:3000")
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}
