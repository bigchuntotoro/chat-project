pipeline {
    agent any

    environment {
        // =================================================
        // 프로젝트 / 배포 경로
        // =================================================
        TARGET_DIR   = '/home/totoro/Reactproject/chat-project'
        APP_NAME     = 'chat-project'
        SERVICE_NAME = 'chat-project'

        FRONTEND_DIR = "${WORKSPACE}/src/frontend"

        // =================================================
        // Spring Boot 실행 환경
        // =================================================
        JAVA_HOME = '/usr/lib/jvm/java-21-openjdk-amd64'
        APP_PORT  = '8086'

        PATH = "/usr/local/bin:/usr/bin:/bin:${env.PATH}"
    }

    tools {
        jdk 'JDK21'
        nodejs 'NodeJS24'
    }

    stages {

        // =================================================
        // 1. Checkout
        // =================================================
        stage('1. Checkout') {
            steps {
                checkout scm

                sh '''
                    set -e

                    echo "========================================"
                    echo " Git Checkout"
                    echo "========================================"

                    chmod +x gradlew

                    echo "Java Version:"
                    java -version

                    echo "Node Version:"
                    node -v

                    echo "NPM Version:"
                    npm -v
                '''
            }
        }

        // =================================================
        // 2. React Frontend Build
        // =================================================
        stage('2. Build Frontend') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh '''
                        set -e

                        echo "========================================"
                        echo " React Frontend Build"
                        echo "========================================"

                        echo "Node:"
                        node -v

                        echo "NPM:"
                        npm -v

                        echo "----------------------------------------"
                        echo "Installing dependencies..."
                        echo "----------------------------------------"

                        npm install --prefer-offline

                        echo "----------------------------------------"
                        echo "Building React..."
                        echo "----------------------------------------"

                        npm run build

                        echo "----------------------------------------"
                        echo "Checking build result..."
                        echo "----------------------------------------"

                        if [ -d "dist" ]; then
                            echo "Vite dist directory detected."
                            ls -lah dist
                        elif [ -d "build" ]; then
                            echo "React build directory detected."
                            ls -lah build
                        else
                            echo "ERROR: React build output directory not found."
                            exit 1
                        fi
                    '''
                }
            }
        }

        // =================================================
        // 3. Deploy React → Nginx
        // =================================================
        stage('3. Deploy Frontend to Nginx') {
            steps {
                sh '''
                    set -e

                    echo "========================================"
                    echo " Deploy React to Nginx"
                    echo "========================================"

                    mkdir -p "${TARGET_DIR}"

                    echo "Cleaning Nginx React directory..."
                    find "${TARGET_DIR}" \
                        -mindepth 1 \
                        -maxdepth 1 \
                        ! -name "logs" \
                        ! -name "${APP_NAME}.jar" \
                        ! -name "${APP_NAME}.jar.backup" \
                        -exec rm -rf {} +

                    if [ -d "${FRONTEND_DIR}/dist" ]; then
                        echo "Copying Vite dist to Nginx..."
                        cp -a "${FRONTEND_DIR}/dist/." "${TARGET_DIR}/"
                    elif [ -d "${FRONTEND_DIR}/build" ]; then
                        echo "Copying React build to Nginx..."
                        cp -a "${FRONTEND_DIR}/build/." "${TARGET_DIR}/"
                    else
                        echo "ERROR: React build output not found."
                        exit 1
                    fi

                    echo "========================================"
                    echo " Nginx React Deployment Complete"
                    echo "========================================"
                    echo "Nginx Root: ${TARGET_DIR}"
                    ls -lah "${TARGET_DIR}"
                '''
            }
        }

        // =================================================
        // 4. Spring Boot Gradle Build
        // =================================================
        stage('4. Build Backend') {
            steps {
                sh '''
                    set -e

                    echo "========================================"
                    echo " Spring Boot Gradle Build"
                    echo "========================================"

                    ./gradlew clean build -x test

                    echo "----------------------------------------"
                    echo "Gradle build completed."
                    echo "----------------------------------------"

                    ls -lah build/libs
                '''
            }
        }

        // =================================================
        // 5. Deploy Spring Boot JAR
        // =================================================
        stage('5. Deploy Backend JAR') {
            steps {
                sh '''
                    set -e

                    echo "========================================"
                    echo " Deploy Spring Boot JAR"
                    echo "========================================"

                    mkdir -p "${TARGET_DIR}/logs"

                    BUILD_JAR=$(find build/libs \
                        -maxdepth 1 \
                        -type f \
                        -name "*.jar" \
                        ! -name "*-sources.jar" \
                        ! -name "*-plain.jar" \
                        -print \
                        | head -n 1)

                    if [ -z "${BUILD_JAR}" ]; then
                        echo "ERROR: Spring Boot JAR file not found."
                        exit 1
                    fi

                    echo "Build JAR: ${BUILD_JAR}"

                    if [ -f "${TARGET_DIR}/${APP_NAME}.jar" ]; then
                        echo "Backing up existing JAR..."
                        cp -f "${TARGET_DIR}/${APP_NAME}.jar" "${TARGET_DIR}/${APP_NAME}.jar.backup"
                    fi

                    echo "Copying new JAR..."
                    cp -f "${BUILD_JAR}" "${TARGET_DIR}/${APP_NAME}.jar"
                    chmod 755 "${TARGET_DIR}/${APP_NAME}.jar"

                    echo "========================================"
                    echo " JAR Deployment Complete"
                    echo "========================================"
                    ls -lh "${TARGET_DIR}/${APP_NAME}.jar"
                '''
            }
        }

        // =================================================
        // 6. Restart Spring Boot
        // =================================================
        stage('6. Restart Backend') {
            steps {
                sh '''
                    set -e

                    echo "========================================"
                    echo " Restart Spring Boot"
                    echo "========================================"

                    sudo systemctl restart "${SERVICE_NAME}"

                    echo "Waiting for systemd..."
                    sleep 2

                    echo "----------------------------------------"
                    echo "Systemd Status"
                    echo "----------------------------------------"
                    sudo systemctl --no-pager --full status "${SERVICE_NAME}" || true
                '''
            }
        }

        // =================================================
        // 7. Backend Health Check
        // =================================================
        stage('7. Backend Health Check') {
            steps {
                sh '''
                    set -e

                    echo "========================================"
                    echo " Spring Boot Health Check"
                    echo "========================================"

                    STARTED=false

                    for i in $(seq 1 30); do
                        HTTP_CODE=$(curl \
                            -s \
                            -o /dev/null \
                            -w "%{http_code}" \
                            --connect-timeout 1 \
                            "[http://127.0.0.1](http://127.0.0.1):${APP_PORT}/" \
                            || true)

                        if [ "${HTTP_CODE}" != "000" ]; then
                            echo ""
                            echo "========================================"
                            echo " Spring Boot is running"
                            echo " HTTP Status: ${HTTP_CODE}"
                            echo " Attempt: ${i}/30"
                            echo "========================================"
                            STARTED=true
                            break
                        fi

                        echo "Waiting for Spring Boot... ${i}/30"
                        sleep 1
                    done

                    if [ "${STARTED}" != "true" ]; then
                        echo ""
                        echo "========================================"
                        echo " ERROR: Spring Boot failed to start"
                        echo "========================================"

                        echo "----- systemd status -----"
                        sudo systemctl --no-pager --full status "${SERVICE_NAME}" || true

                        echo "----- systemd logs -----"
                        sudo journalctl -u "${SERVICE_NAME}" -n 100 --no-pager || true

                        exit 1
                    fi
                '''
            }
        }
    }

    // =================================================
    // POST
    // =================================================
    post {
        success {
            echo """
========================================
DEPLOYMENT SUCCESS
========================================
Application : ${APP_NAME}
Frontend    : Nginx
Backend     : Spring Boot
Backend Port: ${APP_PORT}
Nginx Root  : ${TARGET_DIR}
========================================
"""
        }
        failure {
            echo """
========================================
DEPLOYMENT FAILED
========================================
Application : ${APP_NAME}
Frontend    : Nginx
Backend     : Spring Boot
Backend Port: ${APP_PORT}
========================================
"""
        }
        always {
            echo "Jenkins build finished."
        }
    }
}