# Jenkins CI/CD Setup for VPS Seller Portal

## Overview

This document provides comprehensive instructions for setting up Jenkins to build, test, and deploy the VPS Seller Portal using automated CI/CD pipelines.

## Prerequisites

### Required Software/Services
- **Jenkins Server** (version 2.400+)
- **Docker** (with Docker daemon available to Jenkins)
- **Kubernetes Cluster** (for deployment targets)
- **Container Registry** (Docker Hub, AWS ECR, or similar)
- **Git Repository** (GitHub, GitLab, or similar)
- **Slack** (for notifications, optional)
- **Email Server** (for build notifications)

### Jenkins Plugins Required

Install these plugins via **Manage Jenkins → Manage Plugins**:

#### Essential Plugins
- **Pipeline** - Pipeline suite of plugins
- **GitHub Integration** - GitHub integration plugin
- **Docker Pipeline** - Docker build/publish steps
- **Kubernetes CLI** - kubectl command line
- **Configuration as Code** - Jenkins configuration
- **Blue Ocean** - Modern pipeline visualization

#### Quality & Security Plugins
- **SonarQube Scanner** - Code quality analysis
- **OWASP Dependency-Check** - Security vulnerability scanning
- **Trivy** - Container security scanning
- **Checkstyle** - Code style checking

#### Notification Plugins
- **Slack Notification** - Slack integration
- **Email Extension** - Enhanced email notifications
- **Discord Notifier** - Discord notifications (optional)

#### Build & Test Plugins
- **Node.js Plugin** - Node.js installation
- **Junit** - Test result reporting
- **Cobertura** - Code coverage reporting
- **Performance Plugin** - Performance testing

## Setup Instructions

### 1. Jenkins Server Installation

#### Option A: Docker Installation
```bash
# Create Jenkins network
docker network create jenkins

# Create Docker volume for persistence
docker volume create jenkins-data

# Run Jenkins container
docker run --name jenkins --restart=on-failure \
  --network jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins-data:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(which docker):/usr/bin/docker \
  jenkins/jenkins:lts
```

#### Option B: Kubernetes Installation
```yaml
# jenkins-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jenkins
  namespace: jenkins
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jenkins
  template:
    metadata:
      labels:
        app: jenkins
    spec:
      serviceAccountName: jenkins
      containers:
      - name: jenkins
        image: jenkins/jenkins:lts
        ports:
        - containerPort: 8080
        - containerPort: 50000
        env:
        - name: JAVA_OPTS
          value: "-Djenkins.install.runSetupWizard=false"
        volumeMounts:
        - name: jenkins-data
          mountPath: /var/jenkins_home
        - name: docker-socket
          mountPath: /var/run/docker.sock
      volumes:
      - name: jenkins-data
        persistentVolumeClaim:
          claimName: jenkins-pvc
      - name: docker-socket
        hostPath:
          path: /var/run/docker.sock
```

### 2. Initial Jenkins Configuration

1. **Access Jenkins**: Navigate to `http://your-jenkins-server:8080`

2. **Unlock Jenkins**: Get the initial admin password:
   ```bash
   docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
   ```

3. **Install Suggested Plugins**: Select "Install suggested plugins"

4. **Create Admin User**: Create your Jenkins admin account

5. **Configure System Settings**:
   - **Manage Jenkins → Configure System**
   - Set **System Admin e-mail address**
   - Configure **Extended E-mail Notification**
   - Set **Jenkins URL** appropriately

### 3. Configure Global Tools

**Navigate to Manage Jenkins → Global Tool Configuration**

#### Node.js
```
Name: NodeJS 18
Installation method: Install automatically
Version: 18.17.0
```

#### Docker
```
Name: Docker
Installation method: Install from docker.io
Version: latest
```

#### Maven (if needed)
```
Name: Maven 3.8
Installation method: Install automatically
Version: 3.8.6
```

### 4. Configure Credentials

**Navigate to Manage Jenkins → Manage Credentials**

#### Required Credentials
1. **GitHub Credentials** (`github-creds`)
   - Kind: Username with password
   - Username: Your GitHub username
   - Password: GitHub personal access token

2. **Docker Registry Credentials** (`docker-registry-creds`)
   - Kind: Username with password
   - Username: Docker registry username
   - Password: Docker registry password/token

3. **AWS Credentials** (`aws-creds`) - If using AWS
   - Kind: AWS Credentials
   - Access Key ID: AWS access key
   - Secret Access Key: AWS secret key

4. **Slack Webhook** (`slack-webhook-url`)
   - Kind: Secret text
   - Secret: Slack incoming webhook URL

5. **Kubernetes Config** (`kubeconfig`)
   - Kind: Secret file
   - File: Kubernetes kubeconfig file

### 5. Configure GitHub Integration

1. **Install GitHub Plugin** (if not already installed)

2. **Configure GitHub Server**:
   - **Manage Jenkins → Configure System → GitHub**
   - Add GitHub Server
   - API URL: `https://api.github.com`
   - Credentials: Select `github-creds`

3. **Set up GitHub Webhook**:
   - In your GitHub repository:
     - Go to Settings → Webhooks
     - Add webhook: `http://your-jenkins-server:8080/github-webhook/`
     - Content type: `application/json`
     - Events: "Pushes", "Pull requests"

### 6. Configure Docker Registry

**Navigate to Manage Jenkins → Configure System → Cloud → Docker**

1. **Add Docker Cloud**:
   - Docker Host URI: `unix:///var/run/docker.sock`
   - Enabled: true

2. **Configure Registry**:
   - Registry URL: Your container registry URL
   - Credentials: `docker-registry-creds`

### 7. Kubernetes Configuration

1. **Install Kubernetes Plugin**
2. **Configure Kubernetes Cloud**:
   - **Manage Jenkins → Manage Nodes and Clouds → Configure Clouds → Add a new cloud → Kubernetes**
   - Name: `kubernetes`
   - Kubernetes URL: `https://kubernetes.default.svc.cluster.local`
   - Credentials: `kubeconfig`
   - Jenkins URL: `http://jenkins.jenkins.svc.cluster.local:8080`

### 8. Create Pipeline Job

1. **New Item → Pipeline**
2. **Pipeline Configuration**:
   - Definition: "Pipeline script from SCM"
   - SCM: Git
   - Repository URL: Your GitHub repository URL
   - Credentials: `github-creds`
   - Script Path: `Jenkinsfile`

### 9. Environment Variables Setup

Create environment-specific credentials:

#### Development Environment
```bash
# Set these as secret text credentials
DATABASE_URL_DEV=postgresql://user:pass@dev-db:5432/vps_portal_dev
REDIS_URL_DEV=redis://dev-redis:6379
JWT_SECRET_DEV=dev-jwt-secret-key
STRIPE_SECRET_KEY_DEV=sk_test_dev_key
```

#### Staging Environment
```bash
DATABASE_URL_STAGING=postgresql://user:pass@staging-db:5432/vps_portal_staging
REDIS_URL_STAGING=redis://staging-redis:6379
JWT_SECRET_STAGING=staging-jwt-secret-key
STRIPE_SECRET_KEY_STAGING=sk_test_staging_key
```

#### Production Environment
```bash
DATABASE_URL_PROD=postgresql://user:pass@prod-db:5432/vps_portal_prod
REDIS_URL_PROD=redis://prod-redis:6379
JWT_SECRET_PROD=prod-jwt-secret-key
STRIPE_SECRET_KEY_PROD=sk_live_prod_key
```

### 10. Pipeline Configuration Files

Place these files in your repository root:

- `Jenkinsfile` - Main pipeline definition
- `scripts/deploy.sh` - Deployment script
- `scripts/deploy-production.sh` - Production deployment script
- `k8s/*.yaml` - Kubernetes manifests
- `performance-tests/load-test.js` - Performance testing script
- `e2e-tests/` - End-to-end tests

### 11. Quality Gates Configuration

#### SonarQube Integration
1. **Install SonarQube Scanner Plugin**
2. **Configure SonarQube Server**:
   - **Manage Jenkins → Configure System → SonarQube servers**
   - Name: SonarQube
   - Server URL: `http://your-sonarqube-server:9000`
   - Server authentication token: SonarQube token

#### Add to Jenkinsfile:
```groovy
stage('Code Quality') {
    steps {
        withSonarQubeEnv('SonarQube') {
            sh 'npm run sonar-scanner'
        }
    }
}
```

### 12. Security Scanning Setup

#### Trivy Security Scanning
```bash
# Install Trivy on Jenkins agent
sudo apt-get update
sudo apt-get install wget apt-transport-https gnupg lsb-release
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy
```

#### OWASP Dependency-Check
1. **Install OWASP Dependency-Check Plugin**
2. **Configure in Jenkinsfile**:
```groovy
stage('Security Scan') {
    steps {
        dependencyCheckAnalyzer datadir: '/tmp/dependency-check', \
            tool: 'dependency-check', \
            includeVulnerabilitySuppressionFile: false
    }
}
```

### 13. Monitoring and Alerting

#### Build Monitoring
- **Jenkins Build Monitor Plugin**: Real-time build status
- **Metrics Dashboard**: Build success/failure rates
- **Build Time Tracking**: Identify slow builds

#### Alerting Configuration
```groovy
// In Jenkinsfile post section
post {
    failure {
        slackSend(
            channel: '#alerts',
            color: 'danger',
            message: "❌ Build failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        )
        emailext(
            subject: "Build Failure: ${env.JOB_NAME}",
            body: "Build failed. Check ${env.BUILD_URL}",
            to: 'devops-team@company.com'
        )
    }
}
```

### 14. Pipeline Security Best Practices

1. **Use Credential Store**: Never hardcode secrets
2. **Least Privilege**: Jenkins service account with minimal permissions
3. **Agent Isolation**: Use Docker containers for build agents
4. **Audit Trail**: Enable Jenkins audit logging
5. **Regular Updates**: Keep Jenkins and plugins updated

### 15. Backup and Recovery

#### Backup Jenkins Configuration
```bash
# Backup Jenkins home directory
tar -czf jenkins-backup-$(date +%Y%m%d).tar.gz /var/jenkins_home

# Backup plugins
tar -czf jenkins-plugins-backup-$(date +%Y%m%d).tar.gz /var/jenkins_home/plugins
```

#### Restore Jenkins
```bash
# Stop Jenkins
docker stop jenkins

# Restore data
tar -xzf jenkins-backup-YYYYMMDD.tar.gz -C /var/jenkins_home

# Start Jenkins
docker start jenkins
```

### 16. Troubleshooting Common Issues

#### Docker Permission Issues
```bash
# Add jenkins user to docker group
sudo usermod -aG docker jenkins
```

#### Kubernetes Connection Issues
```bash
# Verify kubeconfig
kubectl config view
kubectl cluster-info
```

#### Node.js Installation Issues
- Ensure Node.js plugin is properly configured
- Verify npm cache permissions

#### GitHub Webhook Issues
- Check Jenkins URL configuration
- Verify webhook URL in GitHub repository
- Check Jenkins logs for webhook failures

### 17. Performance Optimization

#### Jenkins Agent Configuration
```groovy
pipeline {
    agent {
        docker {
            image 'node:18-alpine'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
}
```

#### Build Optimization
- **Parallel Stages**: Run independent tasks in parallel
- **Docker Layer Caching**: Use Docker build cache
- **Dependency Caching**: Cache npm dependencies

### 18. Production Deployment Rollback

The production deployment script includes automatic rollback capabilities:

```bash
# Manual rollback
./scripts/deploy-production.sh rollback backend production

# Check rollback status
kubectl rollout status deployment/vps-portal-backend -n vps-portal-prod
```

### 19. Maintenance and Updates

#### Regular Maintenance Tasks
- **Monthly**: Update Jenkins and plugins
- **Quarterly**: Review and rotate credentials
- **As Needed**: Update Docker images and dependencies

#### Pipeline Updates
- Version control your Jenkinsfile
- Use Jenkins Configuration as Code
- Document pipeline changes

This comprehensive setup provides a robust CI/CD pipeline for the VPS Seller Portal with automated testing, security scanning, and production-ready deployment capabilities.