#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  cleanup.sh — Remove all deployed resources
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }

NAMESPACE="helloworld"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${RED}Removing Spring Boot K8s deployment...${NC}"

cd "$PROJECT_DIR"
kubectl delete -f k8s/ --ignore-not-found=true
kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
docker rmi helloworld:1.0.0 --force 2>/dev/null || true

success "Cleanup complete!"
