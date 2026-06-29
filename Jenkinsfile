pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
        skipDefaultCheckout(true)
    }

    parameters {
        booleanParam(
            name: 'RUN_IMAGE_RELEASE_STAGES',
            defaultValue: true,
            description: 'Run build/push, Trivy scan, and SSM tag update even when this is not a main branch push.'
        )
    }

    environment {
        REGISTRY = 'ghcr.io'
        AWS_REGION = 'eu-west-2'
        DOCKER_BUILDKIT = '1'
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                checkout scm
                script {
                    env.GIT_SHA = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    env.GIT_SHORT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.GIT_BRANCH_NAME = env.BRANCH_NAME ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    env.GIT_REMOTE_URL = sh(script: 'git config --get remote.origin.url', returnStdout: true).trim()
                    env.REPOSITORY_OWNER = sh(script: '''
                        set -eu
                        url="$(git config --get remote.origin.url)"
                        url="${url%.git}"
                        case "$url" in
                          git@github.com:*) repo="${url#git@github.com:}" ;;
                          https://github.com/*) repo="${url#https://github.com/}" ;;
                          http://github.com/*) repo="${url#http://github.com/}" ;;
                          *) repo="" ;;
                        esac
                        printf '%s' "${repo%%/*}"
                    ''', returnStdout: true).trim()
                    if (!env.REPOSITORY_OWNER) {
                        error 'Unable to derive GitHub repository owner from origin URL for GHCR image name.'
                    }
                    env.IMAGE_NAME = "${env.REGISTRY}/${env.REPOSITORY_OWNER}/ecom-api"
                    env.IMAGE_TAG_SHA = "sha-${env.GIT_SHORT_SHA}"
                    env.IMAGE_TAG_FULL_SHA = "sha-${env.GIT_SHA}"
                    env.IMAGE_TAG_BRANCH = env.GIT_BRANCH_NAME.replaceAll('/', '-')
                }
                stash name: 'source', includes: '**/*', excludes: '**/node_modules/**,**/.git/**,**/coverage/**'
            }
        }

        stage('Quality gates') {
            parallel {
                stage('Lint and test (Node 18)') {
                    tools {
                        nodejs 'node18'
                    }

                    stages {
                        stage('Prepare workspace') {
                            steps {
                                dir('ci-node-18') {
                                    deleteDir()
                                    unstash 'source'
                                }
                            }
                        }

                        stage('Use Node 18') {
                            steps {
                                sh '''
                                    set -eux
                                    node --version
                                    npm --version
                                '''
                            }
                        }

                        stage('Install dependencies') {
                            steps {
                                dir('ci-node-18/api') {
                                    sh '''
                                        set -eux
                                        npm ci
                                    '''
                                }
                            }
                        }

                        stage('Lint') {
                            steps {
                                dir('ci-node-18/api') {
                                    sh '''
                                        set -eux
                                        npm run lint
                                    '''
                                }
                            }
                        }

                        stage('Unit tests + coverage gate') {
                            steps {
                                dir('ci-node-18/api') {
                                    sh '''
                                        set -eux
                                        npm test -- --coverage --coverageReporters=text
                                    '''
                                }
                            }
                        }

                        stage('Archive coverage') {
                            steps {
                                script {
                                    if (fileExists('ci-node-18/api/coverage')) {
                                        archiveArtifacts artifacts: 'ci-node-18/api/coverage/**', fingerprint: true
                                    } else {
                                        echo 'No Node 18 coverage directory found to archive.'
                                    }
                                }
                            }
                        }
                    }
                }

                stage('Lint and test (Node 20)') {
                    tools {
                        nodejs 'node20'
                    }

                    stages {
                        stage('Prepare workspace') {
                            steps {
                                dir('ci-node-20') {
                                    deleteDir()
                                    unstash 'source'
                                }
                            }
                        }

                        stage('Use Node 20') {
                            steps {
                                sh '''
                                    set -eux
                                    node --version
                                    npm --version
                                '''
                            }
                        }

                        stage('Install dependencies') {
                            steps {
                                dir('ci-node-20/api') {
                                    sh '''
                                        set -eux
                                        npm ci
                                    '''
                                }
                            }
                        }

                        stage('Lint') {
                            steps {
                                dir('ci-node-20/api') {
                                    sh '''
                                        set -eux
                                        npm run lint
                                    '''
                                }
                            }
                        }

                        stage('Unit tests + coverage gate') {
                            steps {
                                dir('ci-node-20/api') {
                                    sh '''
                                        set -eux
                                        npm test -- --coverage --coverageReporters=text
                                    '''
                                }
                            }
                        }

                        stage('Archive coverage') {
                            steps {
                                script {
                                    if (fileExists('ci-node-20/api/coverage')) {
                                        archiveArtifacts artifacts: 'ci-node-20/api/coverage/**', fingerprint: true
                                    } else {
                                        echo 'No Node 20 coverage directory found to archive.'
                                    }
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
            }
        }

        stage('Build and push image') {
            when {
                allOf {
                    expression { return env.CHANGE_ID == null }
                    anyOf {
                        branch 'main'
                        expression { return params.RUN_IMAGE_RELEASE_STAGES }
                    }
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
                          --tag "${IMAGE_NAME}:${IMAGE_TAG_FULL_SHA}" \
                          --tag "${IMAGE_NAME}:${IMAGE_TAG_BRANCH}" \
                          --label "org.opencontainers.image.revision=${GIT_SHA}" \
                          --label "org.opencontainers.image.source=${GIT_REMOTE_URL}" \
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
                    expression { return env.CHANGE_ID == null }
                    anyOf {
                        branch 'main'
                        expression { return params.RUN_IMAGE_RELEASE_STAGES }
                    }
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
                    expression { return env.CHANGE_ID == null }
                    anyOf {
                        branch 'main'
                        expression { return params.RUN_IMAGE_RELEASE_STAGES }
                    }
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
                          --value "${IMAGE_TAG_FULL_SHA}" \
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
