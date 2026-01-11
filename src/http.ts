import type { ApiResponse, ApiError } from './types';
import { OxArchiveError } from './types';

export interface HttpClientOptions {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

/**
 * Internal HTTP client for making API requests
 */
export class HttpClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeout = options.timeout;
  }

  /**
   * Make a GET request to the API
   */
  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const error = data as ApiError;
        throw new OxArchiveError(
          error.error || `Request failed with status ${response.status}`,
          response.status,
          (data as ApiResponse<unknown>).request_id
        );
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof OxArchiveError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new OxArchiveError(`Request timeout after ${this.timeout}ms`, 408);
      }

      throw new OxArchiveError(
        error instanceof Error ? error.message : 'Unknown error',
        500
      );
    }
  }
}
