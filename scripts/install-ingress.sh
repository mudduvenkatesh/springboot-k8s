#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  install-ingress.sh — Install NGINX Ingress Controller locally
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }

# ── Detect cluster type ─────────────────────────────────────────
detect_and_install() {
  if command -v minikube &>/dev/null && minikube status &>/dev/null 2>&1; then
    echo -e "${BOLD}Minikube detected — enabling ingress addon...${NC}"
    minikube addons enable ingress
    success "Ingress addon enabled for Minikube"
    echo ""
    warn "For Minikube, use 'minikube tunnel' in a separate terminal:"
    echo "  minikube tunnel"

  elif kubectl config current-context | grep -q "docker-desktop" 2>/dev/null; then
    echo -e "${BOLD}Docker Desktop Kubernetes detected...${NC}"
    install_nginx_ingress

  elif command -v kind &>/dev/null && kind get clusters &>/dev/null 2>&1; then
    echo -e "${BOLD}kind cluster detected...${NC}"
    install_kind_ingress

  else
    echo -e "${BOLD}Generic Kubernetes — installing NGINX Ingress...${NC}"
    install_nginx_ingress
  fi
}

# ── Install NGINX Ingress (standard) ───────────────────────────
install_nginx_ingress() {
  info "Installing NGINX Ingress Controller..."
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.0/deploy/static/provider/cloud/deploy.yaml

  info "Waiting for ingress controller pods..."
  kubectl wait --namespace ingress-nginx \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=120s

  success "NGINX Ingress Controller installed and ready!"
  echo ""
  echo "  Access your API at: http://localhost/api/v1/hello"
}

# ── Install for kind ─────────────────────────────────────────────
install_kind_ingress() {
  info "Installing NGINX Ingress for kind..."
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

  info "Waiting for ingress controller pods..."
  kubectl wait --namespace ingress-nginx \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=120s

  success "NGINX Ingress installed for kind!"
  warn "For kind, make sure your cluster was created with extraPortMappings:"
  echo ""
  cat << 'EOF'
  # kind-config.yaml (use this when creating kind cluster):
  kind: Cluster
  apiVersion: kind.x-k8s.io/v1alpha4
  nodes:
    - role: control-plane
      kubeadmConfigPatches:
        - |
          kind: InitConfiguration
          nodeRegistration:
            kubeletExtraArgs:
              node-labels: "ingress-ready=true"
      extraPortMappings:
        - containerPort: 80
          hostPort: 80
          protocol: TCP
        - containerPort: 443
          hostPort: 443
          protocol: TCP
EOF
}

detect_and_install
