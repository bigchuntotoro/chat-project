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

import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    private final ClientRegistrationRepository clientRegistrationRepository;


    // ================================================================
    // Naver OAuth2 Authorization Request Resolver
    //
    // /oauth2/authorization/naver
    //
    // Spring Security가 네이버 로그인 URL을 만들 때
    //
    // auth_type=reauthenticate
    //
    // 를 강제로 추가한다.
    //
    // 네이버 공식 문서상 reauthenticate는
    // 현재 로그인 상태와 관계없이 다시 인증을 요구한다.
    // ================================================================
    @Bean
    public OAuth2AuthorizationRequestResolver
    authorizationRequestResolver() {

        DefaultOAuth2AuthorizationRequestResolver defaultResolver =
                new DefaultOAuth2AuthorizationRequestResolver(
                        clientRegistrationRepository,
                        "/oauth2/authorization"
                );


        return new OAuth2AuthorizationRequestResolver() {


            // ============================================================
            // 기본 resolver
            // ============================================================
            @Override
            public OAuth2AuthorizationRequest resolve(
                    HttpServletRequest request) {

                OAuth2AuthorizationRequest authorizationRequest =
                        defaultResolver.resolve(request);

                return customize(
                        authorizationRequest
                );
            }


            // ============================================================
            // clientRegistrationId를 사용하는 resolver
            // ============================================================
            @Override
            public OAuth2AuthorizationRequest resolve(
                    HttpServletRequest request,
                    String clientRegistrationId) {

                OAuth2AuthorizationRequest authorizationRequest =
                        defaultResolver.resolve(
                                request,
                                clientRegistrationId
                        );

                return customize(
                        authorizationRequest
                );
            }


            // ============================================================
            // 네이버 OAuth 요청 수정
            // ============================================================
            private OAuth2AuthorizationRequest customize(
                    OAuth2AuthorizationRequest authorizationRequest) {

                if (authorizationRequest == null) {
                    return null;
                }


                // --------------------------------------------------------
                // OAuth2 registration id 확인
                // --------------------------------------------------------
                String registrationId =
                        authorizationRequest.getAttribute(
                                "registration_id"
                        );


                // --------------------------------------------------------
                // Naver가 아니면 원래 요청 그대로 사용
                // --------------------------------------------------------
                if (!"naver".equals(registrationId)) {

                    return authorizationRequest;
                }


                // --------------------------------------------------------
                // 기존 additionalParameters 복사
                // --------------------------------------------------------
                Map<String, Object> parameters =
                        new HashMap<>(
                                authorizationRequest
                                        .getAdditionalParameters()
                        );


                // ========================================================
                // 핵심
                //
                // Naver에 강제 재인증 요청
                // ========================================================
                parameters.put(
                        "auth_type",
                        "reauthenticate"
                );


                // --------------------------------------------------------
                // 수정된 OAuth2AuthorizationRequest 생성
                // --------------------------------------------------------
                return OAuth2AuthorizationRequest
                        .from(authorizationRequest)
                        .additionalParameters(
                                parameters
                        )
                        .build();
            }
        };
    }


    // ================================================================
    // 1. API 전용 Security Filter Chain
    //
    // /api/**
    //
    // JWT 기반 Stateless
    // ================================================================
    @Bean
    @Order(1)
    public SecurityFilterChain apiFilterChain(
            HttpSecurity http
    ) throws Exception {


        http

                // --------------------------------------------------------
                // API 요청만 이 체인에서 처리
                // --------------------------------------------------------
                .securityMatcher(
                        "/api/**"
                )


                // --------------------------------------------------------
                // CORS
                // --------------------------------------------------------
                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )


                // --------------------------------------------------------
                // CSRF
                // --------------------------------------------------------
                .csrf(csrf ->
                        csrf.disable()
                )


                // --------------------------------------------------------
                // JWT API는 Stateless
                // --------------------------------------------------------
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )


                // --------------------------------------------------------
                // 인증 설정
                // --------------------------------------------------------
                .authorizeHttpRequests(auth -> auth

                        // 로그인 / 인증 관련 API
                        .requestMatchers(
                                "/api/auth/**"
                        )
                        .permitAll()

                        // 나머지는 JWT 인증 필요
                        .anyRequest()
                        .authenticated()
                )


                // --------------------------------------------------------
                // API 인증 실패
                //
                // OAuth2 로그인으로 redirect하지 않고
                // HTTP 401 반환
                // --------------------------------------------------------
                .exceptionHandling(exception ->
                        exception.authenticationEntryPoint(
                                new HttpStatusEntryPoint(
                                        HttpStatus.UNAUTHORIZED
                                )
                        )
                )


                // --------------------------------------------------------
                // JWT Filter
                // --------------------------------------------------------
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );


        return http.build();
    }


    // ================================================================
    // 2. Web / OAuth2 / WebSocket Security Filter Chain
    // ================================================================
    @Bean
    @Order(2)
    public SecurityFilterChain webFilterChain(
            HttpSecurity http
    ) throws Exception {


        http

                // --------------------------------------------------------
                // CORS
                // --------------------------------------------------------
                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )


                // --------------------------------------------------------
                // CSRF
                // --------------------------------------------------------
                .csrf(csrf ->
                        csrf.disable()
                )


                // --------------------------------------------------------
                // OAuth2 로그인에는 세션 필요
                //
                // STATELESS 사용 금지
                // --------------------------------------------------------
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.IF_REQUIRED
                        )
                )


                // --------------------------------------------------------
                // URL 권한
                // --------------------------------------------------------
                .authorizeHttpRequests(auth -> auth


                        // --------------------------------------------------
                        // 기본 페이지
                        // --------------------------------------------------
                        .requestMatchers("/")
                        .permitAll()


                        // --------------------------------------------------
                        // Spring error
                        // --------------------------------------------------
                        .requestMatchers("/error")
                        .permitAll()


                        // --------------------------------------------------
                        // WebSocket
                        // --------------------------------------------------
                        .requestMatchers("/ws/**")
                        .permitAll()


                        // --------------------------------------------------
                        // OAuth2 시작 URL
                        //
                        // /oauth2/authorization/naver
                        // --------------------------------------------------
                        .requestMatchers(
                                "/oauth2/**"
                        )
                        .permitAll()


                        // --------------------------------------------------
                        // OAuth2 callback
                        //
                        // /login/oauth2/code/naver
                        // --------------------------------------------------
                        .requestMatchers(
                                "/login/**"
                        )
                        .permitAll()


                        // --------------------------------------------------
                        // 그 외 요청
                        // --------------------------------------------------
                        .anyRequest()
                        .authenticated()
                )


                // ========================================================
                // OAuth2 Login
                // ========================================================
                .oauth2Login(oauth2 ->

                        oauth2


                                // ----------------------------------------
                                // OAuth2 Authorization Request Resolver
                                //
                                // 여기에서
                                //
                                // auth_type=reauthenticate
                                //
                                // 를 네이버에 추가한다.
                                // ----------------------------------------
                                .authorizationEndpoint(endpoint ->
                                        endpoint
                                                .authorizationRequestResolver(
                                                        authorizationRequestResolver()
                                                )
                                )


                                // ----------------------------------------
                                // Naver UserInfo
                                // ----------------------------------------
                                .userInfoEndpoint(userInfo ->
                                        userInfo
                                                .userService(
                                                        new DefaultOAuth2UserService()
                                                )
                                )


                                // ----------------------------------------
                                // 로그인 성공
                                // ----------------------------------------
                                .successHandler(
                                        oAuth2SuccessHandler
                                )
                )


                // ========================================================
                // JWT Filter
                //
                // WebSocket 등에서 JWT 인증이 필요한 경우
                // ========================================================
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );


        return http.build();
    }


    // ================================================================
    // CORS Configuration
    // ================================================================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {


        CorsConfiguration configuration =
                new CorsConfiguration();


        // ---------------------------------------------------------------
        // React
        // ---------------------------------------------------------------
        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost:3000"
                )
        );


        // ---------------------------------------------------------------
        // HTTP Methods
        // ---------------------------------------------------------------
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


        // ---------------------------------------------------------------
        // Headers
        // ---------------------------------------------------------------
        configuration.setAllowedHeaders(
                List.of("*")
        );


        // ---------------------------------------------------------------
        // Cookie / Session
        // ---------------------------------------------------------------
        configuration.setAllowCredentials(
                true
        );


        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();


        source.registerCorsConfiguration(
                "/**",
                configuration
        );


        return source;
    }
}
