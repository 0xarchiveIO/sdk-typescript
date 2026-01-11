import type { HttpClient } from '../http';
import type { ApiResponse, FundingRate, TimeRangeParams } from '../types';

/**
 * Funding rates API resource
 *
 * @example
 * ```typescript
 * // Get current funding rate
 * const current = await client.funding.current('BTC');
 *
 * // Get funding rate history
 * const history = await client.funding.history('ETH', {
 *   start: Date.now() - 86400000 * 7,
 *   end: Date.now()
 * });
 * ```
 */
export class FundingResource {
  constructor(private http: HttpClient) {}

  /**
   * Get funding rate history for a coin
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @param params - Time range and pagination parameters
   * @returns Array of funding rate records
   */
  async history(coin: string, params?: TimeRangeParams): Promise<FundingRate[]> {
    const response = await this.http.get<ApiResponse<FundingRate[]>>(
      `/v1/funding/${coin.toUpperCase()}`,
      params as Record<string, unknown>
    );
    return response.data;
  }

  /**
   * Get current funding rate for a coin
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @returns Current funding rate
   */
  async current(coin: string): Promise<FundingRate> {
    const response = await this.http.get<ApiResponse<FundingRate>>(
      `/v1/funding/${coin.toUpperCase()}/current`
    );
    return response.data;
  }
}
