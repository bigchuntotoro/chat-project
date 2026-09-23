pipeline {
    agent any

    environment {
        // =================================================
        // 프로젝트 / 배포 경로 설정
        // =================================================
        TARGET_DIR      = '/home/totoro/Reactproject/chat-project'
        APP_NAME        = 'chat-project'
        SERVICE_NAME    = 'chat-project'

        FRONTEND_DIR    = "${WORKSPACE}/frontend"
        STATIC_OUT_DIR  = "${WORKSPACE}/src/main/resources/static"

        // =================================================
        // 실행 환경
        // =================================================
        JAVA_HOME       = '/usr/lib/jvm/java-21-openjdk-amd64'
        APP_PORT        = '8086'

        PATH            = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
    }

    tools {
        jdk 'JDK21'
        nodejs 'NodeJS24'
    }

    stages {

        // =================================================
        // 1. 소스 체크아웃
        // =================================================
        stage('1. Checkout') {
            steps {
                checkout scm
                sh 'chmod +x gradlew'
            }
        }

        // =================================================
        // 2. React Frontend Build & Nginx 경로 반영 복사
        // =================================================
        stage('2. Build Frontend (React)') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh """
                        set -e
                        echo "==> Checking Node / NPM Version"
                        node -v
                        npm -v

                        echo "==> Installing NPM Dependencies"
                        // package-lock.json이 없어도 동작하는 npm install 사용
                        npm install --prefer-offline

                        echo "==> Building React Frontend"
                        npm run build
                    """
                }

                // Vite 빌드 결과물(dist 등)을 Nginx 배포 위치 및 스프링 정적 리소스로 복사
                sh """
                    set -e
                    echo "==> Copying Frontend build files to Nginx path & Spring static"
                    mkdir -p "${STATIC_OUT_DIR}"
                    mkdir -p "${TARGET_DIR}"

                    if [ -d "${FRONTEND_DIR}/dist" ]; then
                        rm -rf "${TARGET_DIR}/*"
                        cp -r ${FRONTEND_DIR}/dist/* "${TARGET_DIR}/"
                        cp -r ${FRONTEND_DIR}/dist/* "${STATIC_OUT_DIR}/"
                    elif [ -d "${FRONTEND_DIR}/build" ]; then
                        rm -rf "${TARGET_DIR}/*"
                        cp -r ${FRONTEND_DIR}/build/* "${TARGET_DIR}/"
                        cp -r ${FRONTEND_DIR}/build/* "${STATIC_OUT_DIR}/"
                    fi
                """
            }
        }

        // =================================================
        // 3. Spring Boot Gradle Build (통합 JAR 생성)
        // =================================================
        stage('3. Build Backend (Spring Boot / Gradle)') {
            steps {
                sh """
                    set -e
                    echo "==> Building Spring Boot Application with Gradle"
                    ./gradlew clean build -x test
                """
            }
        }

        // =================================================
        // 4. Deploy Backend JAR
        // =================================================
        stage('4. Deploy Backend JAR') {
            steps {
                sh """
                    set -e
                    echo "==> Preparing Spring Boot Deployment"
                    mkdir -p "${TARGET_DIR}/logs"

                    BUILD_JAR=\$(find build/libs \\
                        -maxdepth 1 \\
                        -type f \\
                        -name "*.jar" \\
                        ! -name "*-sources.jar" \\
                        ! -name "*-plain.jar" \\
                        -print \\
                        | head -n 1)

                    if [ -z "\$BUILD_JAR" ]; then
                        echo "ERROR: Spring Boot JAR file not found."
                        exit 1
                    }

                    cp -f "\$BUILD_JAR" "${TARGET_DIR}/${APP_NAME}.jar"
                    chmod 755 "${TARGET_DIR}/${APP_NAME}.jar"
                """
            }
        }

        // =================================================
        // 5. Run Spring Boot via systemd & Health Check
        // =================================================
        stage('5. Run & Verify Application') {
            steps {
                sh """
                    set -e
                    echo "==> Restarting Spring Boot Service via systemd"
                    sudo systemctl restart ${SERVICE_NAME}

                    echo "==> Waiting for Spring Boot response on port ${APP_PORT}..."
                    STARTED=false

                    for i in \$(seq 1 30); do
                        HTTP_CODE=\$(curl \\
                            -s \\
                            -o /dev/null \\
                            -w "%{http_code}" \\
                            --connect-timeout 1 \\
                            "http://127.0.0.1:${APP_PORT}/" \\
                            || true)

                        if [ "\$HTTP_CODE" != "000" ]; then
                            echo "Spring Boot responded with HTTP Status: \${HTTP_CODE}"
                            STARTED=true
                            break
                        fi

                        echo "--> Waiting for server response... \${i}/30"
                        sleep 1
                    done

                    if [ "\$STARTED" != "true" ]; then
                        echo "ERROR: Spring Boot failed to start. Checking systemd logs..."
                        sudo journalctl -u ${SERVICE_NAME} -n 50 --no-pager || true
                        exit 1
                    fi
                """
            }
        }
    }

    post {
        success {
            echo "Successfully deployed and verified ${APP_NAME} on port ${APP_PORT}!"
        }
        failure {
            echo "Deployment FAILED for ${APP_NAME}."
        }
    }
}