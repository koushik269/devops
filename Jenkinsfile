pipeline {
    agent any

    environment {
        DEV_IP = "10.69.69.81"
        PROD_IP = "157.250.198.126"
        IMAGE_NAME = "local-web:latest"
        SSH_CRED = "lubuntukey"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-token',
                    url: 'https://github.com/koushik269/devops.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME .'
            }
        }

        stage('Deploy to DEV') {
            steps {
                echo "Deploying to DEV server $DEV_IP ..."
                sshagent(credentials: [SSH_CRED]) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no root@$DEV_IP "
                        docker rm -f web || true &&
                        docker run -d --name web -p 8080:80 $IMAGE_NAME
                    "
                    '''
                }
            }
        }

        stage('Approval for PROD') {
            steps {
                input message: "Approve deployment to PROD?"
            }
        }

        stage('Deploy to PROD') {
            steps {
                echo "Deploying to PROD server $PROD_IP ..."
                sshagent(credentials: [SSH_CRED]) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no root@$PROD_IP "
                        docker rm -f web || true &&
                        docker run -d --name web -p 80:80 $IMAGE_NAME
                    "
                    '''
                }
            }
        }
    }
}
