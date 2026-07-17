import type { AppConfig } from '../config/index.js';
import type { TransmissionRPCResponse } from '../types/index.js';

export interface TransmissionRepository {
  callRPC<T = unknown>(method: string, args?: Record<string, unknown>): Promise<T>;
}

export class TransmissionRepositoryImpl implements TransmissionRepository {
  private sessionId = '';
  private failedAuthAttempts = 0;
  private lastAuthFailureTime = 0;
  private readonly MAX_AUTH_FAILURES = 3;
  private readonly AUTH_FAILURE_RESET_MS = 60000; // 1 minute

  constructor(private readonly config: AppConfig) {}

  async callRPC<T = unknown>(method: string, args: Record<string, unknown> = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.sessionId) {
      headers['X-Transmission-Session-Id'] = this.sessionId;
    }

    if (this.config.transmissionUsername || this.config.transmissionPassword) {
      const creds = Buffer.from(
        `${this.config.transmissionUsername}:${this.config.transmissionPassword}`,
      ).toString('base64');
      headers['Authorization'] = `Basic ${creds}`;
    }

    const makeRequest = async (): Promise<Response> => {
      return fetch(this.config.transmissionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ method, arguments: args }),
      });
    };

    let response = await makeRequest();

    if (response.status === 409) {
      const newSessionId = response.headers.get('X-Transmission-Session-Id');
      if (!newSessionId) {
        throw new Error(
          'Transmission RPC 409 response was missing X-Transmission-Session-Id header',
        );
      }
      this.sessionId = newSessionId;
      headers['X-Transmission-Session-Id'] = this.sessionId;
      response = await makeRequest();
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        const now = Date.now();
        if (now - this.lastAuthFailureTime > this.AUTH_FAILURE_RESET_MS) {
          this.failedAuthAttempts = 0;
        }
        this.failedAuthAttempts += 1;
        this.lastAuthFailureTime = now;

        if (this.failedAuthAttempts >= this.MAX_AUTH_FAILURES) {
          throw new Error(
            `[认证失败] 已连续失败 ${this.MAX_AUTH_FAILURES} 次，请检查 Transmission 认证配置。`,
          );
        }

        throw new Error(
          `[认证失败 ${response.status}] 第 ${this.failedAuthAttempts}/${this.MAX_AUTH_FAILURES} 次失败。`,
        );
      }

      const text = await response.text();
      throw new Error(`Transmission RPC error (${response.status}): ${text}`);
    }

    const data = (await response.json()) as TransmissionRPCResponse<T>;
    if (data.result !== 'success') {
      throw new Error(`Transmission RPC error: ${data.result}`);
    }

    return data.arguments as T;
  }
}
