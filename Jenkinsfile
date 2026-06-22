// Jenkinsfile — Declarative pipeline mirroring GitHub Actions (Week 5)
pipeline {
    agent any

    environment {
        REGISTRY = 'ghcr.io/your-org'
        IMAGE_NAME = 'ecom-api'
        GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
    }

    stages {
        stage('Parallel Tests') {
            parallel {
                stage('Test Backend') {
                    steps {
                        dir('api') {
                            sh 'npm ci'
                            sh 'npm run lint'
                            sh 'npm test -- --coverage --forceExit'
                        }
                    }
                }
                stage('Test Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run lint'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    docker.withRegistry("https://${REGISTRY}", 'ghcr-credentials') {
                        def apiImage = docker.build("${REGISTRY}/${IMAGE_NAME}:${GIT_SHA}", './api')
                        apiImage.push()
                        apiImage.push('latest')
                    }
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                sh "trivy image --severity HIGH,CRITICAL --exit-code 1 ${REGISTRY}/${IMAGE_NAME}:${GIT_SHA}"
            }
        }

        stage('Update SSM Tag') {
            steps {
                sh "aws ssm put-parameter --name /spine/image-tag --value ${GIT_SHA} --type String --overwrite"
            }
        }

        stage('Ansible Configure (placeholder)') {
            steps {
                echo 'LINK → Phase 3: This stage will call ansible-playbook in Phase 3'
                echo "Image ${GIT_SHA} deployed — Ansible will configure the target host"
            }
        }
    }

    post {
        always {
            junit '**/test-results/*.xml'
            archiveArtifacts artifacts: '**/coverage/**', allowEmptyArchive: true
        }
        failure {
            echo 'Pipeline failed — check logs above'
        }
    }
}