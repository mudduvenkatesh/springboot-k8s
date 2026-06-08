export interface HelloResponse {
  message: string;
  status: string;
  timestamp: string;
  service: string;
  version: string;
  echo?: Record<string, string>;
}

export interface InfoResponse {
  application: string;
  framework: string;
  javaVersion: string;
  endpoints: string[];
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
