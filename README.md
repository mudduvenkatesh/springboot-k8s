# Spring Boot 4.0.6 → Local Kubernetes

A complete Hello World REST API built with **Spring Boot 4.0.6**, containerized with Docker, and deployed to a local Kubernetes cluster with NGINX Ingress routing — accessible at `http://localhost`.

---

## 🏗️ Architecture

![Spring Boot 4.0.6 — Local Kubernetes Architecture](docs/architecture.png)

> Requests flow from `curl`/browser on port 80 → NGINX Ingress (routing `/api/v1/*`) → ClusterIP Service (80→8080) → Spring Boot pods (Java 21). The HPA automatically scales pods between 2 and 5 replicas based on CPU/memory usage.

---

## 📁 Project Structure

```
springboot-k8s/
├── src/
│   └── main/
│       ├── java/com/example/helloworld/
│       │   ├── HelloWorldApplication.java       ← Main class
│       │   └── controller/
│       │       └── HelloWorldController.java    ← REST endpoints
│       └── resources/
│           └── application.properties          ← App config
├── k8s/
│   ├── 00-namespace.yaml    ← K8s Namespace
│   ├── 01-deployment.yaml   ← K8s Deployment (2 replicas)
│   ├── 02-service.yaml      ← K8s ClusterIP Service
│   ├── 03-ingress.yaml      ← NGINX Ingress (routes localhost)
│   └── 04-hpa.yaml          ← HorizontalPodAutoscaler
├── scripts/
│   ├── deploy.sh            ← Full build + deploy script
│   ├── install-ingress.sh   ← Install NGINX Ingress Controller
│   └── cleanup.sh           ← Remove all resources
├── Dockerfile               ← Multi-stage Docker build
├── pom.xml                  ← Maven build (Spring Boot 4.0.6)
└── README.md
```

---

## ✅ Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Java | 21+ | [adoptium.net](https://adoptium.net) |
| Maven | 3.9+ | [maven.apache.org](https://maven.apache.org) |
| Docker | 24+ | [docker.com](https://www.docker.com) |
| kubectl | 1.28+ | [kubernetes.io](https://kubernetes.io/docs/tasks/tools/) |
| Local K8s | Any | Docker Desktop / Minikube / kind |

---

## 🚀 Quick Start (3 steps)

### Step 1 — Start your local Kubernetes cluster

**Option A: Docker Desktop** (easiest)
```bash
# Open Docker Desktop → Settings → Kubernetes → Enable Kubernetes → Apply
```

**Option B: Minikube**
```bash
minikube start --driver=docker --memory=4096 --cpus=2
```

**Option C: kind**
```bash
# Create cluster with port mappings for ingress:
cat <<EOF | kind create cluster --config=-
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
EOF
```

### Step 2 — Install NGINX Ingress Controller

```bash
chmod +x scripts/install-ingress.sh
./scripts/install-ingress.sh
```

> For **Minikube** only — also run in a **separate terminal** and keep it open:
> ```bash
> minikube tunnel
> ```

### Step 3 — Build & Deploy

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

This script will:
1. Build the Maven JAR
2. Build the Docker image
3. Load image into your cluster (Minikube/kind auto-detected)
4. Apply all Kubernetes manifests
5. Wait for pods to be ready
6. Print the access URLs

---

## 🧪 Test the API

Once deployed, all endpoints are accessible at `http://localhost`:

```bash
# Hello World
curl http://localhost/api/v1/hello

# Personalized greeting
curl http://localhost/api/v1/hello/YourName

# POST with body
curl -X POST http://localhost/api/v1/hello \
  -H "Content-Type: application/json" \
  -d '{"name": "Kubernetes"}'

# Service info
curl http://localhost/api/v1/info

# Health check
curl http://localhost/actuator/health
```

### Expected Response

```json
{
  "message": "Hello, World!",
  "status": "success",
  "timestamp": "2025-06-08T12:00:00",
  "service": "helloworld-service",
  "version": "1.0.0"
}
```

---

## 🔧 Manual Commands

### Build JAR only
```bash
mvn clean package -DskipTests
```

### Build Docker image only
```bash
docker build -t helloworld:1.0.0 .
```

### Apply K8s manifests manually
```bash
kubectl apply -f k8s/
```

### Check deployment status
```bash
kubectl get all -n helloworld
kubectl describe ingress helloworld-ingress -n helloworld
```

### View logs
```bash
kubectl logs -f deployment/helloworld-deployment -n helloworld
```

### Scale manually
```bash
kubectl scale deployment helloworld-deployment --replicas=3 -n helloworld
```

### Port-forward (bypasses ingress, for debugging)
```bash
kubectl port-forward service/helloworld-service 8080:80 -n helloworld
curl http://localhost:8080/api/v1/hello
```

---

## 🗑️ Cleanup

```bash
./scripts/cleanup.sh
```

---

## 🔍 Troubleshooting

| Problem | Fix |
|---------|-----|
| `ImagePullBackOff` | Image not in cluster. Run `deploy.sh` which auto-loads it |
| `curl` returns 404 | Ingress not installed — run `install-ingress.sh` |
| `curl` returns 502/503 | Pods not ready yet — wait 30s and retry |
| Minikube: no route to localhost | Run `minikube tunnel` in separate terminal |
| kind: port 80 in use | Stop other services using port 80 |

---

## 📡 API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/hello` | Hello World |
| `GET` | `/api/v1/hello/{name}` | Personalized greeting |
| `POST` | `/api/v1/hello` | Greeting from request body |
| `GET` | `/api/v1/info` | Service information |
| `GET` | `/actuator/health` | Kubernetes health check |
| `GET` | `/actuator/metrics` | Application metrics |
