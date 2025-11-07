#!/bin/bash

# Production Deployment Script with Advanced Features
# Usage: ./deploy-production.sh [backend|frontend] [environment] [docker-image]

set -euo pipefail

# Source the common deployment script
source "$(dirname "$0")/deploy.sh"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Additional production-specific logging
prod_log() {
    echo -e "${GREEN}[PROD-DEPLOY] $1${NC}"
}

prod_error() {
    echo -e "${RED}[PROD-ERROR] $1${NC}" >&2
    exit 1
}

# Production-specific validation
validate_production_deployment() {
    local component=$1
    local environment=$2

    prod_log "Validating production deployment requirements..."

    # Check if deployment is from main branch
    if [[ "${BRANCH_NAME:-}" != "main" ]]; then
        prod_error "Production deployments can only be done from main branch. Current branch: ${BRANCH_NAME:-unknown}"
    fi

    # Check if all required environment variables are set
    local required_vars=(
        "DATABASE_URL_PROD"
        "REDIS_URL_PROD"
        "JWT_SECRET_PROD"
        "STRIPE_SECRET_KEY_PROD"
        "PROXMOX_API_URL"
        "TERRAFORM_API_TOKEN"
    )

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            prod_error "Required environment variable $var is not set"
        fi
    done

    # Check if previous deployment was successful
    local last_deployment_status=$(kubectl get deployment vps-portal-$component -n vps-portal-prod -o jsonpath='{.status.conditions[?(@.type=="Available")].status}' 2>/dev/null || echo "Unknown")

    if [[ "$last_deployment_status" == "False" ]]; then
        prod_error "Previous deployment is in failed state. Please investigate before proceeding."
    fi

    prod_log "Production validation completed successfully"
}

# Blue-Green Deployment Strategy
blue_green_deployment() {
    local component=$1
    local docker_image=$2
    local namespace="vps-portal-prod"

    prod_log "Starting blue-green deployment for $component..."

    # Determine current active deployment
    local current_color=$(kubectl get service vps-portal-$component -n $namespace -o jsonpath='{.spec.selector.color}' 2>/dev/null || echo "blue")
    local new_color="green"
    if [[ "$current_color" == "green" ]]; then
        new_color="blue"
    fi

    prod_log "Current active: $current_color, deploying new: $new_color"

    # Create new deployment with different color label
    envsubst < k8s/${component}-deployment.yaml | \
        sed "s/color: blue/color: $new_color/g" | \
        sed "s/vps-portal-$component/vps-portal-$component-$new_color/g" | \
        kubectl apply -n $namespace -f -

    # Wait for new deployment to be ready
    prod_log "Waiting for $new_color deployment to be ready..."
    kubectl rollout status deployment/vps-portal-$component-$new_color -n $namespace --timeout=600s

    # Run smoke tests against new deployment
    prod_log "Running smoke tests against $new_color deployment..."
    if ! run_smoke_tests "$component" "$new_color"; then
        prod_error "Smoke tests failed for $new_color deployment"
    fi

    # Switch service to new deployment
    prod_log "Switching service to $new_color deployment..."
    kubectl patch service vps-portal-$component -n $namespace -p '{"spec":{"selector":{"color":"'$new_color'"}}}'

    # Wait for traffic to switch
    sleep 30

    # Final health check
    if ! health_check "$component" "production"; then
        prod_error "Health check failed after traffic switch"
    fi

    # Clean up old deployment after successful switch
    prod_log "Cleaning up old $current_color deployment..."
    kubectl delete deployment vps-portal-$component-$current_color -n $namespace --ignore-not-found

    prod_log "Blue-green deployment completed successfully"
}

# Smoke tests for production
run_smoke_tests() {
    local component=$1
    local color=${2:-"blue"}
    local namespace="vps-portal-prod"
    local max_attempts=10
    local attempt=1

    prod_log "Running smoke tests for $component ($color)..."

    while [ $attempt -le $max_attempts ]; do
        if [[ "$component" == "backend" ]]; then
            # Test backend endpoints
            if curl -f -s "https://api-prod.vpsportal.com/health" >/dev/null && \
               curl -f -s "https://api-prod.vpsportal.com/api/health" >/dev/null; then
                prod_log "Backend smoke tests passed"
                return 0
            fi
        else
            # Test frontend
            if curl -f -s "https://prod.vpsportal.com/" >/dev/null && \
               curl -f -s "https://prod.vpsportal.com/configure" >/dev/null; then
                prod_log "Frontend smoke tests passed"
                return 0
            fi
        fi

        prod_log "Smoke test attempt $attempt/$max_attempts failed, retrying..."
        sleep 10
        ((attempt++))
    done

    return 1
}

# Performance validation
validate_performance() {
    local component=$1
    local environment=$2

    prod_log "Running performance validation for $component on $environment..."

    # Simple performance checks
    case $component in
        "backend")
            # Check response time
            local response_time=$(curl -o /dev/null -s -w '%{time_total}' "https://api-${environment}.vpsportal.com/health")
            if (( $(echo "$response_time > 2.0" | bc -l) )); then
                prod_error "Backend response time too high: ${response_time}s"
            fi
            prod_log "Backend response time: ${response_time}s"
            ;;
        "frontend")
            # Check page load time
            local load_time=$(curl -o /dev/null -s -w '%{time_total}' "https://${environment}.vpsportal.com/")
            if (( $(echo "$load_time > 3.0" | bc -l) )); then
                prod_error "Frontend load time too high: ${load_time}s"
            fi
            prod_log "Frontend load time: ${load_time}s"
            ;;
    esac

    prod_log "Performance validation completed"
}

# Rollback function
rollback_deployment() {
    local component=$1
    local namespace="vps-portal-prod"

    prod_log "Initiating rollback for $component..."

    # Get previous replica set
    local previous_rs=$(kubectl get replicaset -n $namespace -l app=vps-portal-$component -o jsonpath='{range .items[*]}{.metadata.name} {.metadata.creationTimestamp}{"\\n"}{end}' | sort -k2 -r | tail -n +2 | head -n 1 | awk '{print $1}')

    if [[ -z "$previous_rs" ]]; then
        prod_error "No previous replica set found for rollback"
    fi

    prod_log "Rolling back to replica set: $previous_rs"

    # Perform rollback
    kubectl rollout undo deployment/vps-portal-$component -n $namespace

    # Wait for rollback to complete
    kubectl rollout status deployment/vps-portal-$component -n $namespace --timeout=600s

    # Health check after rollback
    if health_check "$component" "production"; then
        prod_log "Rollback completed successfully"
    else
        prod_error "Rollback health check failed"
    fi
}

# Enhanced main function for production
main_production() {
    local component=$1
    local environment=$2
    local docker_image=$3

    prod_log "Starting PRODUCTION deployment of $component to $environment"

    # Production-specific validations
    validate_production_deployment "$component" "$environment"

    # Create backup before deployment
    prod_log "Creating deployment backup..."
    local backup_name="backup-${component}-prod-$(date +%Y%m%d-%H%M%S)"
    kubectl get deployment vps-portal-$component -n vps-portal-prod -o yaml > "${backup_name}.yaml"

    # Set production environment variables
    export NAMESPACE="vps-portal-prod"
    export DOMAIN="prod.vpsportal.com"
    export REPLICA_COUNT="3"
    export DATABASE_URL="${DATABASE_URL_PROD}"
    export REDIS_URL="${REDIS_URL_PROD}"
    export JWT_SECRET="${JWT_SECRET_PROD}"
    export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY_PROD}"
    export PROXMOX_API_URL="${PROXMOX_API_URL}"
    export PROXMOX_TOKEN_ID="${PROXMOX_TOKEN_ID}"
    export PROXMOX_TOKEN_SECRET="${PROXMOX_TOKEN_SECRET}"
    export TERRAFORM_API_TOKEN="${TERRAFORM_API_TOKEN}"

    # Validate Docker image
    if ! docker pull "$docker_image" >/dev/null 2>&1; then
        prod_error "Docker image $docker_image not found or not accessible"
    fi

    # Perform blue-green deployment
    blue_green_deployment "$component" "$docker_image"

    # Performance validation
    validate_performance "$component" "$environment"

    # Send deployment notification
    send_deployment_notification "$component" "$environment" "$docker_image" "success"

    prod_log "Production deployment of $component to $environment completed successfully"
}

# Send deployment notification
send_deployment_notification() {
    local component=$1
    local environment=$2
    local image=$3
    local status=$4

    local message="$status: $component deployed to $environment with image $image"

    # Send to Slack ( webhook URL should be configured)
    if [[ -n "${SLACK_WEBHOOK:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK" || true
    fi

    # Send to PagerDuty for production issues
    if [[ "$status" == "failure" && "$environment" == "production" ]]; then
        # PagerDuty integration code here
        prod_log "PagerDuty alert sent for deployment failure"
    fi
}

# Trap for cleanup and error handling
trap 'catch_error $? $LINENO' ERR

catch_error() {
    local exit_code=$1
    local line_number=$2

    prod_error "Script failed with exit code $exit_code at line $line_number"

    # Attempt rollback if in production
    if [[ "${2:-}" == "production" ]]; then
        prod_log "Attempting automatic rollback..."
        rollback_deployment "$component"
    fi

    send_deployment_notification "$component" "$environment" "$docker_image" "failure"
}

# Execute production main function
main_production "$@"