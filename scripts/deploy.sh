#!/bin/bash

# Jenkins Deployment Script for VPS Seller Portal
# Usage: ./deploy.sh [backend|frontend] [environment] [docker-image]

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validate required tools
check_requirements() {
    log "Checking required tools..."

    command_exists docker || error "Docker is not installed"
    command_exists docker-compose || error "Docker Compose is not installed"
    command_exists kubectl || error "kubectl is not installed"
    command_exists envsubst || error "envsubst is not installed"

    success "All required tools are available"
}

# Validate input parameters
validate_input() {
    if [ $# -ne 3 ]; then
        error "Usage: $0 [backend|frontend] [environment] [docker-image]"
    fi

    local component=$1
    local environment=$2
    local docker_image=$3

    if [[ ! "$component" =~ ^(backend|frontend)$ ]]; then
        error "Component must be 'backend' or 'frontend'"
    fi

    if [[ ! "$environment" =~ ^(development|staging)$ ]]; then
        error "Environment must be 'development' or 'staging'"
    fi

    if [[ -z "$docker_image" ]]; then
        error "Docker image cannot be empty"
    fi

    log "Deploying $component to $environment with image $docker_image"
}

# Set environment-specific variables
set_environment_vars() {
    local environment=$1

    log "Setting environment variables for $environment"

    case $environment in
        "development")
            export NAMESPACE="vps-portal-dev"
            export DOMAIN="dev.vpsportal.com"
            export REPLICA_COUNT="1"
            export DATABASE_URL="${DATABASE_URL_DEV}"
            export REDIS_URL="${REDIS_URL_DEV}"
            export JWT_SECRET="${JWT_SECRET_DEV}"
            export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY_DEV}"
            ;;
        "staging")
            export NAMESPACE="vps-portal-staging"
            export DOMAIN="staging.vpsportal.com"
            export REPLICA_COUNT="2"
            export DATABASE_URL="${DATABASE_URL_STAGING}"
            export REDIS_URL="${REDIS_URL_STAGING}"
            export JWT_SECRET="${JWT_SECRET_STAGING}"
            export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY_STAGING}"
            ;;
        *)
            error "Unknown environment: $environment"
            ;;
    esac

    log "Namespace: $NAMESPACE"
    log "Domain: $DOMAIN"
    log "Replica Count: $REPLICA_COUNT"
}

# Deploy backend component
deploy_backend() {
    local environment=$1
    local docker_image=$2

    log "Deploying backend to $environment..."

    # Create namespace if it doesn't exist
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

    # Deploy Kubernetes manifests
    envsubst < k8s/backend-deployment.yaml | kubectl apply -n $NAMESPACE -f -
    envsubst < k8s/backend-service.yaml | kubectl apply -n $NAMESPACE -f -
    envsubst < k8s/backend-configmap.yaml | kubectl apply -n $NAMESPACE -f -
    envsubst < k8s/backend-secret.yaml | kubectl apply -n $NAMESPACE -f -

    # Wait for deployment to be ready
    log "Waiting for backend deployment to be ready..."
    kubectl rollout status deployment/vps-portal-backend -n $NAMESPACE --timeout=300s

    # Run database migrations
    log "Running database migrations..."
    kubectl run migration-job --image=$docker_image --restart=Never \
        --env="DATABASE_URL=$DATABASE_URL" \
        --env="NODE_ENV=$environment" \
        -n $NAMESPACE \
        -- npm run prisma:migrate

    # Clean up migration job
    kubectl delete job migration-job -n $NAMESPACE --ignore-not-found

    success "Backend deployment completed"
}

# Deploy frontend component
deploy_frontend() {
    local environment=$1
    local docker_image=$2

    log "Deploying frontend to $environment..."

    # Create namespace if it doesn't exist
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

    # Deploy Kubernetes manifests
    envsubst < k8s/frontend-deployment.yaml | kubectl apply -n $NAMESPACE -f -
    envsubst < k8s/frontend-service.yaml | kubectl apply -n $NAMESPACE -f -
    envsubst < k8s/frontend-ingress.yaml | kubectl apply -n $NAMESPACE -f -

    # Wait for deployment to be ready
    log "Waiting for frontend deployment to be ready..."
    kubectl rollout status deployment/vps-portal-frontend -n $NAMESPACE --timeout=300s

    success "Frontend deployment completed"
}

# Health check function
health_check() {
    local component=$1
    local environment=$2
    local max_attempts=30
    local attempt=1

    log "Running health check for $component on $environment..."

    while [ $attempt -le $max_attempts ]; do
        if [[ "$component" == "backend" ]]; then
            if curl -f -s "https://api.$DOMAIN/health" >/dev/null; then
                success "Backend health check passed"
                return 0
            fi
        else
            if curl -f -s "https://$DOMAIN/" >/dev/null; then
                success "Frontend health check passed"
                return 0
            fi
        fi

        log "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done

    error "Health check failed after $max_attempts attempts"
}

# Main deployment function
main() {
    local component=$1
    local environment=$2
    local docker_image=$3

    log "Starting deployment of $component to $environment"

    # Pre-deployment checks
    check_requirements
    validate_input "$component" "$environment" "$docker_image"
    set_environment_vars "$environment"

    # Validate Docker image exists
    if ! docker pull "$docker_image" >/dev/null 2>&1; then
        error "Docker image $docker_image not found or not accessible"
    fi

    # Backup current deployment (optional)
    if [[ "$environment" != "development" ]]; then
        log "Creating backup of current deployment..."
        kubectl get deployment vps-portal-$component -n $NAMESPACE -o yaml > "backup-${component}-deployment-$(date +%Y%m%d-%H%M%S).yaml" || warning "Could not create backup"
    fi

    # Perform deployment
    case $component in
        "backend")
            deploy_backend "$environment" "$docker_image"
            ;;
        "frontend")
            deploy_frontend "$environment" "$docker_image"
            ;;
    esac

    # Post-deployment health check
    sleep 30 # Give deployment time to initialize
    health_check "$component" "$environment"

    # Cleanup old images
    log "Cleaning up old Docker images..."
    docker image prune -f

    success "Deployment of $component to $environment completed successfully"
}

# Execute main function with all arguments
main "$@"