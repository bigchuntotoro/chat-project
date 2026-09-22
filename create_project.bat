@echo off
chcp 65001 > nul
echo [INFO] 실시간 협업 툴 프로젝트 구조 생성을 시작합니다...

:: 1. 루트 디렉토리 및 백엔드/프론트엔드 기본 구조 생성
mkdir src\frontend\public
mkdir src\frontend\src\components
mkdir src\frontend\src\pages
mkdir src\frontend\src\hooks
mkdir src\frontend\src\services
mkdir src\frontend\src\store
mkdir src\frontend\src\styles

mkdir src\main\java\com\example\chat\controller
mkdir src\main\java\com\example\chat\service
mkdir src\main\java\com\example\chat\mapper
mkdir src\main\java\com\example\chat\domain
mkdir src\main\java\com\example\chat\config
mkdir src\main\java\com\example\chat\security
mkdir src\main\resources\mapper
mkdir src\test\java\com\example\chat

echo [INFO] 디렉토리 생성 완료. 설정 파일들을 작성합니다...

:: 2. Backend: build.gradle 생성
(
echo plugins {
echo     id 'java'
echo     id 'org.springframework.boot' version '3.2.5'
echo     id 'io.spring.dependency-management' version '1.1.4'
echo }
echo.
echo group = 'com.example'
echo version = '0.0.1-SNAPSHOT'
echo.
echo java {
echo     toolchain {
echo         languageVersion = JavaLanguageVersion.of^(21^)
echo     }
echo }
echo.
echo configurations {
echo     compileOnly {
echo         extendsFrom annotationProcessor
echo     }
echo }
echo.
echo repositories {
echo     mavenCentral^(^)
echo }
echo.
echo dependencies {
echo     implementation 'org.springframework.boot:spring-boot-starter-web'
echo     implementation 'org.springframework.boot:spring-boot-starter-websocket'
echo     implementation 'org.springframework.boot:spring-boot-starter-security'
echo     implementation 'org.springframework.boot:spring-boot-starter-oauth2-client'
echo     implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:3.0.3'
echo     implementation 'io.jsonwebtoken:jjwt-api:0.12.5'
echo     runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.5'
echo     runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.5'
echo     runtimeOnly 'org.mariadb.jdbc:mariadb-java-client'
echo     compileOnly 'org.projectlombok:lombok'
echo     annotationProcessor 'org.projectlombok:lombok'
echo     testImplementation 'org.springframework.boot:spring-boot-starter-test'
echo     testImplementation 'org.springframework.security:spring-security-test'
echo }
echo.
echo tasks.named^('test'^) {
echo     useJUnitPlatform^(^)
echo }
) > build.gradle

:: 3. Backend: application.yml 생성 (8086 포트)
(
echo server:
echo   port: 8086
echo.
echo spring:
echo   datasource:
echo     url: jdbc:mariadb://localhost:3306/chat_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Seoul
echo     username: root
echo     password: your_password
echo     driver-class-name: org.mariadb.jdbc.Driver
echo   security:
echo   .oauth2:
echo   ..client:
echo   ....registration:
echo   ......naver:
echo   ........client-id: YOUR_NAVER_CLIENT_ID
echo   ........client-secret: YOUR_NAVER_CLIENT_SECRET
echo   ........redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
echo   ........authorization-grant-type: authorization_code
echo   ........scope: name,email,profile_image
echo   ........client-name: Naver
echo   ...provider:
echo   .....naver:
echo   .......authorization-uri: https://nid.naver.com/oauth2.0/authorize
echo   .......token-uri: https://nid.naver.com/oauth2.0/token
echo   .......user-info-uri: https://openapi.naver.com/v1/nid/me
echo   .......user-name-attribute: response
echo.
echo mybatis:
echo   mapper-locations: classpath:mapper/**/*.xml
echo   configuration:
echo     map-underscore-to-camel-case: true
echo.
echo jwt:
echo   secret: your_jwt_super_secret_key_which_should_be_long_enough_for_hs512_algorithm
echo   expiration: 86400000
) > src\main\resources\application.yml

:: 4. Frontend: package.json 생성 (포트 87, Node 24 호환)
(
echo {
echo   "name": "chat-frontend",
echo   "version": "1.0.0",
echo   "private": true,
echo   "dependencies": {
echo     "@stomp/stompjs": "^7.0.0",
echo     "axios": "^1.6.8",
echo     "react": "^18.3.1",
echo     "react-dom": "^18.3.1",
echo     "react-router-dom": "^6.23.1",
echo     "sockjs-client": "^1.6.1"
echo   },
echo   "devDependencies": {
echo     "@types/react": "^18.3.3",
echo     "@types/react-dom": "^18.3.0",
echo     "@vitejs/plugin-react": "^4.3.0",
echo     "vite": "^5.2.11"
echo   },
echo   "scripts": {
echo     "dev": "vite --port 87",
echo     "build": "vite build",
echo     "preview": "vite preview"
echo   }
}
) > src\frontend\package.json

:: 5. Frontend: vite.config.js 생성 (백엔드 API Proxy 설정)
(
echo import { defineConfig } from 'vite';
echo import react from '@vitejs/plugin-react';
echo.
echo export default defineConfig({
echo   plugins: [react(^)],
echo   server: {
echo     port: 87,
echo     proxy: {
echo       '/api': {
echo         target: 'http://localhost:8086',
echo         changeOrigin: true
echo       },
echo       '/ws': {
echo         target: 'http://localhost:8086',
echo         ws: true
echo       }
echo     }
echo   }
echo });
) > src\frontend\vite.config.js

echo [INFO] 모든 파일과 폴더가 성공적으로 생성되었습니다!
pause