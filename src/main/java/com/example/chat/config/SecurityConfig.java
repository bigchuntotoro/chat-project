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
    // 요청이 들어오면 Naver authorization URL에
    //
    // auth_type=reauth
    //
    // 를 강제로 추가한다.
    //
    // 따라서 브라우저에 이미 Naver 로그인 세션이 있어도
    // Naver가 다시 인증하도록 요청한다.
    // ================================================================
    @Bean
    public OAuth2AuthorizationRequestResolver authorizationRequestResolver() {

        DefaultOAuth2AuthorizationRequestResolver defaultResolver =
                new DefaultOAuth2AuthorizationRequestResolver(
                        clientRegistrationRepository,
                        "/oauth2/authorization"
                );

        return new OAuth2AuthorizationRequestResolver() {

            @Override
            public OAuth2AuthorizationRequest resolve(
                    HttpServletRequest request
            ) {

                OAuth2AuthorizationRequest authorizationRequest =
                        defaultResolver.resolve(request);

                return customizeAuthorizationRequest(
                        request,
                        authorizationRequest
                );
            }

            @Override
            public OAuth2AuthorizationRequest resolve(
                    HttpServletRequest request,
                    String clientRegistrationId
            ) {

                OAuth2AuthorizationRequest authorizationRequest =
                        defaultResolver.resolve(
                                request,
                                clientRegistrationId
                        );

                return customizeAuthorizationRequest(
                        request,
                        authorizationRequest
                );
            }

            private OAuth2AuthorizationRequest customizeAuthorizationRequest(
                    HttpServletRequest request,
                    OAuth2AuthorizationRequest authorizationRequest
            ) {

                if (authorizationRequest == null) {
                    return null;
                }

                // ========================================================
                // Naver 로그인인 경우에만 reauth 적용
                // ========================================================
                String clientRegistrationId =
                        authorizationRequest
                                .getAttribute(
                                        "registration_id"
                                );

                if (!"naver".equals(clientRegistrationId)) {
                    return authorizationRequest;
                }

                // ========================================================
                // 기존 additionalParameters 복사
                // ========================================================
                Map<String, Object> additionalParameters =
                        new HashMap<>(
                                authorizationRequest
                                        .getAdditionalParameters()
                        );

                // ========================================================
                // Naver에 강제 재인증 요청
                // ========================================================
                additionalParameters.put(
                        "auth_type",
                        "reauth"
                );

                // ========================================================
                // 새 OAuth2AuthorizationRequest 생성
                // ========================================================
                return OAuth2AuthorizationRequest
                        .from(authorizationRequest)
                        .additionalParameters(
                                additionalParameters
                        )
                        .build();
            }
        };
    }

    // ================================================================
    // 1) API 전용 체인 (/api/**)
    // ================================================================
    @Bean
    @Order(1)
    public SecurityFilterChain apiFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .securityMatcher("/api/**")

                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                .csrf(csrf ->
                        csrf.disable()
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()

                        .anyRequest().authenticated()
                )

                .exceptionHandling(exception ->
                        exception.authenticationEntryPoint(
                                new HttpStatusEntryPoint(
                                        HttpStatus.UNAUTHORIZED
                                )
                        )
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    // ================================================================
    // 2) Web / OAuth2 / WebSocket 체인
    // ================================================================
    @Bean
    @Order(2)
    public SecurityFilterChain webFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                .csrf(csrf ->
                        csrf.disable()
                )

                // ========================================================
                // OAuth2 로그인은 세션 사용
                //
                // authorization request / state 등을 Spring Security가
                // 저장할 수 있도록 IF_REQUIRED 사용
                // ========================================================
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.IF_REQUIRED
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // 기본 페이지
                        .requestMatchers("/").permitAll()

                        // 에러
                        .requestMatchers("/error").permitAll()

                        // WebSocket
                        .requestMatchers("/ws/**").permitAll()

                        // OAuth2
                        .requestMatchers(
                                "/oauth2/**",
                                "/login/**"
                        ).permitAll()

                        // 나머지
                        .anyRequest().authenticated()
                )

                // ========================================================
                // OAuth2 Login
                // ========================================================
                .oauth2Login(oauth2 ->
                        oauth2

                                // ==================================================
                                // 핵심
                                //
                                // Naver 인증 URL에
                                // auth_type=reauth
                                // 를 추가한다.
                                // ==================================================
                                .authorizationEndpoint(endpoint ->
                                        endpoint.authorizationRequestResolver(
                                                authorizationRequestResolver()
                                        )
                                )

                                .userInfoEndpoint(userInfo ->
                                        userInfo.userService(
                                                new DefaultOAuth2UserService()
                                        )
                                )

                                .successHandler(
                                        oAuth2SuccessHandler
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
    // CORS
    // ================================================================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost:3000"
                )
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