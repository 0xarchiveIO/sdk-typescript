import type { HttpClient } from '../http';
import type { ApiResponse, Candle, GetCandlesParams } from '../types';

/**
 * Candles (OHLCV) API resource
 *
 * @example
 * ```typescript
 * // Get hourly candles
 * const candles = await client.candles.list('BTC', {
 *   interval: '1h',
 *   start: Date.now() - 86400000,
 *   end: Date.now()
 * });
 *
 * // Get daily candles
 * const daily = await client.candles.list('ETH', {
 *   interval: '1d',
 *   limit: 30
 * });
 * ```
 */
export class CandlesResource {
  constructor(private http: HttpClient) {}

  /**
   * Get OHLCV candles for a coin
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @param params - Interval, time range, and pagination parameters
   * @returns Array of candles
   */
  async list(coin: string, params?: GetCandlesParams): Promise<Candle[]> {
    const response = await this.http.get<ApiResponse<Candle[]>>(
      `/v1/candles/${coin.toUpperCase()}`,
      params as Record<string, unknown>
    );
    return response.data;
  }
}
