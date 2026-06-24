export interface SendRequest {
  phone: string;
  message: string;
}

export interface SendResponse {
  success: boolean;
  error?: string;
}

export interface StatusResponse {
  connected: boolean;
}
