#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  deploy.sh — Build, Dockerize & Deploy Spring Boot to Local K8s
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ── Config ───────────────────────────────────────────────────────
IMAGE_NAME="helloworld"
IMAGE_TAG="1.0.0"
NAMESPACE="helloworld"
K8S_DIR="../k8s"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ── Helpers ──────────────────────────────────────────────────────
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
step()    { echo -e "\n${BOLD}${BLUE}══ $* ══${NC}"; }

# ── Prerequisite checks ───────────────────────────────────────────
check_prerequisites() {
  step "Checking Prerequisites"
  local missing=0

  for cmd in java mvn docker kubectl; do
    if command -v "$cmd" &>/dev/null; then
      success "$cmd found: $(command -v "$cmd")"
    else
      warn "$cmd NOT found — please install it"
      missing=$((missing + 1))
    fi
  done

  # Check Docker Desktop / Minikube running
  if ! kubectl cluster-info &>/dev/null; then
    error "Kubernetes cluster not reachable. Start Docker Desktop K8s or run: minikube start"
  fi

  success "Kubernetes cluster is reachable"

  # Check if nginx ingress controller is installed
  if ! kubectl get ingressclass nginx &>/dev/null 2>&1; then
    warn "NGINX Ingress Controller not detected. Run the install step or:"
    warn "  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.0/deploy/static/provider/cloud/deploy.yaml"
    warn "Continuing anyway — install it before accessing via localhost"
  else
    success "NGINX Ingress Controller found"
  fi

  [ "$missing" -gt 0 ] && error "Missing $missing prerequisite(s). Please install them."
}

# ── Step 1: Maven Build ────────────────────────────────────────────
build_jar() {
  step "Building Spring Boot JAR (Maven)"
  cd "$PROJECT_DIR"
  mvn clean package -DskipTests -B
  success "JAR built: target/helloworld.jar"
}

# ── Step 2: Docker Image ───────────────────────────────────────────
build_docker() {
  step "Building Docker Image"
  cd "$PROJECT_DIR"
  docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .
  success "Docker image built: ${IMAGE_NAME}:${IMAGE_TAG}"

  # For Minikube: load image into cluster's Docker daemon
  if command -v minikube &>/dev/null && minikube status &>/dev/null 2>&1; then
    info "Minikube detected — loading image into Minikube..."
    minikube image load "${IMAGE_NAME}:${IMAGE_TAG}"
    success "Image loaded into Minikube"
  fi

  # For kind: load image into kind cluster
  if command -v kind &>/dev/null && kind get clusters &>/dev/null 2>&1; then
    CLUSTER=$(kind get clusters | head -1)
    info "kind cluster '${CLUSTER}' detected — loading image..."
    kind load docker-image "${IMAGE_NAME}:${IMAGE_TAG}" --name "$CLUSTER"
    success "Image loaded into kind cluster"
  fi
}

# ── Step 3: Deploy to Kubernetes ────────────────────────────────────
deploy_k8s() {
  step "Deploying to Kubernetes"
  cd "$PROJECT_DIR"

  info "Applying Kubernetes manifests..."
  kubectl apply -f k8s/00-namespace.yaml
  kubectl apply -f k8s/01-deployment.yaml
  kubectl apply -f k8s/02-service.yaml
  kubectl apply -f k8s/03-ingress.yaml
  kubectl apply -f k8s/04-hpa.yaml

  success "Manifests applied to namespace: ${NAMESPACE}"
}

# ── Step 4: Wait for pods ──────────────────────────────────────────
wait_for_pods() {
  step "Waiting for Pods to be Ready"
  info "This may take 30-60 seconds..."
  kubectl rollout status deployment/helloworld-deployment -n "$NAMESPACE" --timeout=120s
  success "All pods are running!"
}

# ── Step 5: Print Summary ──────────────────────────────────────────
print_summary() {
  step "Deployment Summary"

  echo ""
  kubectl get pods -n "$NAMESPACE"
  echo ""
  kubectl get service -n "$NAMESPACE"
  echo ""
  kubectl get ingress -n "$NAMESPACE"
  echo ""

  echo -e "${BOLD}${GREEN}═══════════════════════════════════════════${NC}"
  echo -e "${BOLD}${GREEN}  ✅ Deployment Complete!${NC}"
  echo -e "${BOLD}${GREEN}═══════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${BOLD}API Endpoints (via Ingress):${NC}"
  echo -e "  ${CYAN}GET${NC}  http://localhost/api/v1/hello"
  echo -e "  ${CYAN}GET${NC}  http://localhost/api/v1/hello/{name}"
  echo -e "  ${CYAN}POST${NC} http://localhost/api/v1/hello"
  echo -e "  ${CYAN}GET${NC}  http://localhost/api/v1/info"
  echo -e "  ${CYAN}GET${NC}  http://localhost/actuator/health"
  echo ""
  echo -e "  ${BOLD}Test with curl:${NC}"
  echo -e "  ${YELLOW}curl http://localhost/api/v1/hello${NC}"
  echo -e "  ${YELLOW}curl http://localhost/api/v1/hello/YourName${NC}"
  echo -e "  ${YELLOW}curl -X POST http://localhost/api/v1/hello -H 'Content-Type: application/json' -d '{\"name\":\"K8s\"}'${NC}"
  echo ""
  echo -e "  ${BOLD}Useful kubectl commands:${NC}"
  echo -e "  ${YELLOW}kubectl logs -f deployment/helloworld-deployment -n $NAMESPACE${NC}"
  echo -e "  ${YELLOW}kubectl get pods -n $NAMESPACE${NC}"
  echo ""
}

# ── Main ─────────────────────────────────────────────────────────
main() {
  echo -e "\n${BOLD}${BLUE}╔═══════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${BLUE}║  Spring Boot 4.0.6 → Kubernetes Deploy    ║${NC}"
  echo -e "${BOLD}${BLUE}╚═══════════════════════════════════════════╝${NC}\n"

  check_prerequisites
  build_jar
  build_docker
  deploy_k8s
  wait_for_pods
  print_summary
}

main "$@"
