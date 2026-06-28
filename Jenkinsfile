pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
        skipDefaultCheckout(true)
    }

    environment {
        REGISTRY   = 'ghcr.io'
        IMAGE_NAME = "ghcr.io/${env.GITHUB_REPO_OWNER ?: 'your-org'}/ecom-api"
        AWS_REGION = 'eu-west-2'
        DOCKER_BUILDKIT = '1'
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                checkout scm
                script {
                    env.GIT_SHA        = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    env.GIT_SHORT_SHA  = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.GIT_BRANCH_NAME = env.BRANCH_NAME ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    env.IMAGE_TAG_SHA  = "sha-${env.GIT_SHORT_SHA}"
                    env.IMAGE_TAG_BRANCH = env.GIT_BRANCH_NAME.replaceAll('/', '-')
                }
            }
        }

        stage('Path filter') {
            steps {
                script {
                    def changed = sh(
                        script: '''
                            set +e
                            if git rev-parse HEAD~1 >/dev/null 2>&1; then
                              git diff --name-only HEAD~1 HEAD
                            else
                              git ls-files
                            fi
                        ''',
                        returnStdout: true
                    ).trim().split('\n') as List

                    def apiChanged = changed.any { it.startsWith('api/') }

                    if (!apiChanged) {
                        currentBuild.result = 'NOT_BUILT'
                        error('No changes under api/**, stopping pipeline.')
                    }
                }
            }
        }

        stage('Lint and test matrix') {
            matrix {
                axes {
                    axis {
                        name 'NODE_VERSION'
                        values '18', '20'
                    }
                }

                stages {
                    stage('Use Node') {
                        steps {
                            script {
                                env.NODEJS_HOME = tool name: "nodejs-${NODE_VERSION}", type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation'
                                env.PATH = "${env.NODEJS_HOME}/bin:${env.PATH}"
                            }
                            sh '''
                                set -eux
                                node --version
                                npm --version
                            '''
                        }
                    }

                    stage('Install dependencies') {
                        steps {
                            dir('api') {
                                sh '''
                                    set -eux
                                    npm ci
                                '''
                            }
                        }
                    }

                    stage('Lint') {
                        steps {
                            dir('api') {
                                sh '''
                                    set -eux
                                    npm run lint
                                '''
                            }
                        }
                    }

                    stage('Unit tests + coverage gate') {
                        steps {
                            dir('api') {
                                sh '''
                                    set -eux
                                    npm test -- --coverage --coverageReporters=text
                                '''
                            }
                        }
                    }

                    stage('Archive coverage') {
                        steps {
                            archiveArtifacts artifacts: 'api/coverage/**', allowEmptyArchive: true, fingerprint: true
                        }
                    }
                }
            }
        }

        stage('SAST - Semgrep') {
            steps {
                sh '''
                    set -eux
                    docker run --rm \
                      -v "$PWD:/src" \
                      -w /src \
                      returntocorp/semgrep \
                      semgrep \
                        --config=p/nodejs \
                        --config=p/secrets \
                        --config=p/owasp-top-ten \
                        --error \
                        --json-output=semgrep-report.json \
                        api/src/
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'semgrep-report.json', allowEmptyArchive: true, fingerprint: true
                }
            }
        }

        stage('Build and push image') {
            when {
                allOf {
                    branch 'main'
                    expression { return env.CHANGE_ID == null }
                }
            }
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'ghcr-creds', usernameVariable: 'GHCR_USERNAME', passwordVariable: 'GHCR_PAT')
                ]) {
                    sh '''
                        set -eux

                        echo "$GHCR_PAT" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin

                        docker buildx create --use --name ecom-multiarch-builder || docker buildx use ecom-multiarch-builder
                        docker buildx inspect --bootstrap

                        docker buildx build \
                          --platform linux/amd64,linux/arm64 \
                          --tag "${IMAGE_NAME}:${IMAGE_TAG_SHA}" \
                          --tag "${IMAGE_NAME}:${IMAGE_TAG_BRANCH}" \
                          --file api/Dockerfile \
                          --push \
                          api
                    '''
                }
            }
        }

        stage('Trivy scan') {
            when {
                allOf {
                    branch 'main'
                    expression { return env.CHANGE_ID == null }
                }
            }
            steps {
                sh '''
                    set +e
                    docker run --rm \
                      -v "$PWD:/work" \
                      -w /work \
                      aquasec/trivy:latest image \
                      --severity CRITICAL \
                      --exit-code 1 \
                      --format sarif \
                      --output trivy-results.sarif \
                      "${IMAGE_NAME}:${IMAGE_TAG_SHA}"
                    exit 0
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-results.sarif', allowEmptyArchive: true, fingerprint: true
                }
            }
        }

        stage('Write image tag to SSM') {
            when {
                allOf {
                    branch 'main'
                    expression { return env.CHANGE_ID == null }
                }
            }
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                        set -eux
                        aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
                        aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
                        aws configure set default.region "$AWS_REGION"

                        aws ssm put-parameter \
                          --name /ecom/image-tag \
                          --value "${IMAGE_TAG_SHA}" \
                          --type String \
                          --overwrite
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs(deleteDirs: true, disableDeferredWipeout: true, notFailBuild: true)
        }
    }
}