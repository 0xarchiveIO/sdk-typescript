import type { HttpClient } from '../http';
import type { ApiResponse, Trade, GetTradesParams } from '../types';

/**
 * Trades API resource
 *
 * @example
 * ```typescript
 * // Get recent trades
 * const trades = await client.trades.recent('BTC');
 *
 * // Get trade history with time range
 * const history = await client.trades.list('ETH', {
 *   start: Date.now() - 3600000,
 *   end: Date.now(),
 *   limit: 500
 * });
 * ```
 */
export class TradesResource {
  constructor(private http: HttpClient) {}

  /**
   * Get trade history for a coin
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @param params - Time range and pagination parameters
   * @returns Array of trades
   */
  async list(coin: string, params?: GetTradesParams): Promise<Trade[]> {
    const response = await this.http.get<ApiResponse<Trade[]>>(
      `/v1/trades/${coin.toUpperCase()}`,
      params as Record<string, unknown>
    );
    return response.data;
  }

  /**
   * Get most recent trades for a coin
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @param limit - Number of trades to return (default: 100)
   * @returns Array of recent trades
   */
  async recent(coin: string, limit?: number): Promise<Trade[]> {
    const response = await this.http.get<ApiResponse<Trade[]>>(
      `/v1/trades/${coin.toUpperCase()}/recent`,
      { limit }
    );
    return response.data;
  }
}
