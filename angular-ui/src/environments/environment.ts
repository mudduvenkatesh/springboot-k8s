export const environment = {
  production: false,
  // During local dev, Angular CLI proxy forwards /api → localhost:8080
  // During K8s, requests go through NGINX Ingress at same host
  apiBaseUrl: '/api/v1'
};
