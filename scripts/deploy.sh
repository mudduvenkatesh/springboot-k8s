#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  deploy.sh — Build & Deploy Spring Boot + Angular to Local K8s
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
step()    { echo -e "\n${BOLD}${BLUE}══ $* ══${NC}"; }

SB_IMAGE="helloworld"
UI_IMAGE="angular-ui"
IMAGE_TAG="1.0.0"
NAMESPACE="helloworld"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ── Helpers ──────────────────────────────────────────────────────
load_image() {
  local img="$1:$IMAGE_TAG"
  if command -v minikube &>/dev/null && minikube status &>/dev/null 2>&1; then
    info "Minikube: loading $img..."
    minikube image load "$img"
  fi
  if command -v kind &>/dev/null && kind get clusters &>/dev/null 2>&1; then
    local cluster; cluster=$(kind get clusters | head -1)
    info "kind[$cluster]: loading $img..."
    kind load docker-image "$img" --name "$cluster"
  fi
}

# ── Prerequisites ─────────────────────────────────────────────────
check_prerequisites() {
  step "Checking Prerequisites"
  local missing=0
  for cmd in java mvn docker kubectl node npm; do
    if command -v "$cmd" &>/dev/null; then
      success "$cmd: $(command -v "$cmd")"
    else
      warn "$cmd NOT found"
      missing=$((missing + 1))
    fi
  done
  kubectl cluster-info &>/dev/null || error "No K8s cluster reachable. Start Docker Desktop K8s or: minikube start"
  success "K8s cluster reachable"
  if ! kubectl get ingressclass nginx &>/dev/null 2>&1; then
    warn "NGINX Ingress not detected — run: ./scripts/install-ingress.sh"
  else
    success "NGINX Ingress found"
  fi
  [ "$missing" -gt 0 ] && error "Missing $missing prerequisite(s)"
}

# ── Spring Boot ───────────────────────────────────────────────────
build_springboot() {
  step "Building Spring Boot JAR"
  cd "$PROJECT_DIR"
  mvn clean package -DskipTests -B
  success "JAR: target/helloworld.jar"

  step "Building Spring Boot Docker Image"
  docker build -t "${SB_IMAGE}:${IMAGE_TAG}" .
  success "Image: ${SB_IMAGE}:${IMAGE_TAG}"
  load_image "$SB_IMAGE"
}

# ── Angular ───────────────────────────────────────────────────────
build_angular() {
  step "Installing Angular Dependencies"
  cd "$PROJECT_DIR/angular-ui"
  npm ci --legacy-peer-deps
  success "npm packages installed"

  step "Building Angular App (production)"
  npm run build:prod
  success "Angular build: dist/helloworld-ui/"

  step "Building Angular Docker Image"
  docker build -t "${UI_IMAGE}:${IMAGE_TAG}" .
  success "Image: ${UI_IMAGE}:${IMAGE_TAG}"
  load_image "$UI_IMAGE"
}

# ── Deploy ────────────────────────────────────────────────────────
deploy_k8s() {
  step "Deploying to Kubernetes"
  cd "$PROJECT_DIR"
  kubectl apply -f k8s/00-namespace.yaml
  kubectl apply -f k8s/01-deployment.yaml
  kubectl apply -f k8s/02-service.yaml
  kubectl apply -f k8s/03-ingress.yaml
  kubectl apply -f k8s/04-hpa.yaml
  kubectl apply -f k8s/05-angular-deployment.yaml
  kubectl apply -f k8s/06-angular-service.yaml
  success "All manifests applied to namespace: ${NAMESPACE}"
}

# ── Wait ──────────────────────────────────────────────────────────
wait_ready() {
  step "Waiting for Pods to be Ready"
  kubectl rollout status deployment/helloworld-deployment -n "$NAMESPACE" --timeout=120s
  kubectl rollout status deployment/angular-ui-deployment -n "$NAMESPACE" --timeout=120s
  success "All pods running!"
}

# ── Summary ───────────────────────────────────────────────────────
print_summary() {
  step "Deployment Summary"
  kubectl get pods    -n "$NAMESPACE"
  echo ""
  kubectl get service -n "$NAMESPACE"
  echo ""
  kubectl get ingress -n "$NAMESPACE"
  echo ""
  echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${GREEN}  ✅ Full Stack Deployment Complete!${NC}"
  echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${BOLD}Angular UI:${NC}"
  echo -e "  ${CYAN}http://localhost/${NC}                         ← Open in browser"
  echo ""
  echo -e "  ${BOLD}Spring Boot API (via Ingress):${NC}"
  echo -e "  ${CYAN}GET${NC}  http://localhost/api/v1/hello"
  echo -e "  ${CYAN}GET${NC}  http://localhost/api/v1/hello/{name}"
  echo -e "  ${CYAN}POST${NC} http://localhost/api/v1/hello"
  echo -e "  ${CYAN}GET${NC}  http://localhost/api/v1/info"
  echo -e "  ${CYAN}GET${NC}  http://localhost/actuator/health"
  echo ""
  echo -e "  ${BOLD}Local Angular dev (hot-reload):${NC}"
  echo -e "  ${YELLOW}cd angular-ui && npm start${NC}  →  http://localhost:4200"
  echo ""
}

# ── Main ──────────────────────────────────────────────────────────
main() {
  echo -e "\n${BOLD}${BLUE}╔═════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${BLUE}║  Spring Boot 4.0.6 + Angular 21 → Kubernetes   ║${NC}"
  echo -e "${BOLD}${BLUE}╚═════════════════════════════════════════════════╝${NC}\n"

  check_prerequisites
  build_springboot
  build_angular
  deploy_k8s
  wait_ready
  print_summary
}

main "$@"
