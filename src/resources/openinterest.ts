import type { HttpClient } from '../http';
import type { ApiResponse, OpenInterest, TimeRangeParams } from '../types';

/**
 * Open interest API resource
 *
 * @example
 * ```typescript
 * // Get current open interest
 * const current = await client.openInterest.current('BTC');
 *
 * // Get open interest history
 * const history = await client.openInterest.history('ETH', {
 *   start: Date.now() - 86400000,
 *   end: Date.now(),
 *   limit: 100
 * });
 * ```
 */
export class OpenInterestResource {
  constructor(private http: HttpClient) {}

  /**
   * Get open interest history for a coin
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @param params - Time range and pagination parameters
   * @returns Array of open interest records
   */
  async history(coin: string, params?: TimeRangeParams): Promise<OpenInterest[]> {
    const response = await this.http.get<ApiResponse<OpenInterest[]>>(
      `/v1/openinterest/${coin.toUpperCase()}`,
      params as Record<string, unknown>
    );
    return response.data;
  }

  /**
   * Get current open interest for a coin
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @returns Current open interest
   */
  async current(coin: string): Promise<OpenInterest> {
    const response = await this.http.get<ApiResponse<OpenInterest>>(
      `/v1/openinterest/${coin.toUpperCase()}/current`
    );
    return response.data;
  }
}
