import type { HttpClient } from '../http';
import type {
  ApiResponse,
  OrderBook,
  GetOrderBookParams,
  OrderBookHistoryParams,
} from '../types';

/**
 * Order book API resource
 *
 * @example
 * ```typescript
 * // Get current order book
 * const orderbook = await client.orderbook.get('BTC');
 *
 * // Get order book at specific timestamp
 * const historical = await client.orderbook.get('ETH', {
 *   timestamp: 1704067200000,
 *   depth: 10
 * });
 *
 * // Get order book history
 * const history = await client.orderbook.history('BTC', {
 *   start: Date.now() - 86400000,
 *   end: Date.now(),
 *   limit: 100
 * });
 * ```
 */
export class OrderBookResource {
  constructor(private http: HttpClient) {}

  /**
   * Get order book snapshot for a coin
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @param params - Optional parameters
   * @returns Order book snapshot
   */
  async get(coin: string, params?: GetOrderBookParams): Promise<OrderBook> {
    const response = await this.http.get<ApiResponse<OrderBook>>(
      `/v1/orderbook/${coin.toUpperCase()}`,
      params as Record<string, unknown>
    );
    return response.data;
  }

  /**
   * Get historical order book snapshots
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @param params - Time range and pagination parameters
   * @returns Array of order book snapshots
   */
  async history(
    coin: string,
    params?: OrderBookHistoryParams
  ): Promise<OrderBook[]> {
    const response = await this.http.get<ApiResponse<OrderBook[]>>(
      `/v1/orderbook/${coin.toUpperCase()}/history`,
      params as Record<string, unknown>
    );
    return response.data;
  }
}
