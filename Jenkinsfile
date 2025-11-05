pipeline {
  agent any

  environment {
    APP_IMAGE        = 'web-nginx'                 // local image name
    APP_TAG          = "build-${env.BUILD_NUMBER}" // unique tag per build
    DEV_SERVER_IP    = '10.69.69.81'
    PROD_SERVER_IP   = '157.250.198.126'
    SSH_CRED_ID      = 'lubuntukey'                // your saved key ID
    DEV_CONTAINER    = 'web-dev'
    PROD_CONTAINER   = 'web-prod'
    TAR_FILE         = "image-${env.BUILD_NUMBER}.tar"
    DOCKERFILE_PATH  = 'Dockerfile'
  }

  options {
    skipDefaultCheckout(false)
    timestamps()
  }

  stages {

    stage('Checkout') {
      steps {
        // IMPORTANT: In your Jenkins job, set Branch Specifier to */main (not refs/heads/**)
        checkout scm
      }
    }

    stage('Test HTML') {
      steps {
        sh '''
          docker run --rm -v "$PWD":/app -w /app node:18-alpine \
            sh -c "npm i -g htmlhint@0.16.3 && htmlhint index.html"
        '''
      }
    }

    stage('Build Docker Image') {
      steps {
        sh '''
          if [ ! -f "$DOCKERFILE_PATH" ]; then
            echo "Dockerfile not found at $DOCKERFILE_PATH"; exit 1
          fi
          docker build -t ${APP_IMAGE}:${APP_TAG} .
        '''
      }
    }

    stage('Deploy to DEV') {
      steps {
        sshagent(credentials: [env.SSH_CRED_ID]) {
          sh '''
            set -e
            # save image and copy to DEV
            docker save ${APP_IMAGE}:${APP_TAG} -o ${TAR_FILE}
            scp -o StrictHostKeyChecking=no ${TAR_FILE} root@${DEV_SERVER_IP}:/root/${TAR_FILE}

            # load & run on DEV
            ssh -o StrictHostKeyChecking=no root@${DEV_SERVER_IP} "
              set -e
              docker load -i /root/${TAR_FILE} &&
              docker rm -f ${DEV_CONTAINER} || true &&
              docker run -d --name ${DEV_CONTAINER} -p 80:80 ${APP_IMAGE}:${APP_TAG}
            "
          '''
        }
      }
      post {
        always {
          sh 'rm -f ${TAR_FILE} || true'
        }
      }
    }

    stage('Approval for PROD') {
      steps {
        input message: 'Deploy this build to PROD?', ok: 'Deploy'
      }
    }

    stage('Deploy to PROD') {
      steps {
        sshagent(credentials: [env.SSH_CRED_ID]) {
          sh '''
            set -e
            # save image again (fresh tar) and copy to PROD
            docker save ${APP_IMAGE}:${APP_TAG} -o ${TAR_FILE}
            scp -o StrictHostKeyChecking=no ${TAR_FILE} root@${PROD_SERVER_IP}:/root/${TAR_FILE}

            # load & run on PROD
            ssh -o StrictHostKeyChecking=no root@${PROD_SERVER_IP} "
              set -e
              docker load -i /root/${TAR_FILE} &&
              docker rm -f ${PROD_CONTAINER} || true &&
              docker run -d --name ${PROD_CONTAINER} -p 80:80 ${APP_IMAGE}:${APP_TAG}
            "
          '''
        }
      }
      post {
        always {
          sh 'rm -f ${TAR_FILE} || true'
        }
      }
    }
  }

  post {
    always {
      echo "Build ${env.BUILD_NUMBER} finished with status: ${currentBuild.currentResult}"
    }
  }
}
