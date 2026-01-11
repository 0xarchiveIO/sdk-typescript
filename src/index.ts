/**
 * @0xarchive/sdk - Official TypeScript SDK for 0xarchive
 *
 * @example
 * ```typescript
 * import { OxArchive } from '@0xarchive/sdk';
 *
 * const client = new OxArchive({ apiKey: 'ox_your_api_key' });
 *
 * // Get current order book
 * const orderbook = await client.orderbook.get('BTC');
 *
 * // Get historical snapshots
 * const history = await client.orderbook.history('ETH', {
 *   start: Date.now() - 86400000,
 *   end: Date.now()
 * });
 * ```
 *
 * @packageDocumentation
 */

// Main client
export { OxArchive } from './client';

// WebSocket client
export { OxArchiveWs } from './websocket';

// Types
export type {
  ClientOptions,
  ApiResponse,
  PaginationParams,
  TimeRangeParams,
  // Order Book
  PriceLevel,
  OrderBook,
  GetOrderBookParams,
  OrderBookHistoryParams,
  // Trades
  Trade,
  GetTradesParams,
  // Candles
  Candle,
  CandleInterval,
  GetCandlesParams,
  // Instruments
  Instrument,
  // Funding
  FundingRate,
  // Open Interest
  OpenInterest,
  // WebSocket
  WsChannel,
  WsOptions,
  WsClientMessage,
  WsServerMessage,
  WsConnectionState,
  WsEventHandlers,
  WsSubscribe,
  WsUnsubscribe,
  WsPing,
  WsSubscribed,
  WsUnsubscribed,
  WsPong,
  WsError,
  WsData,
  // WebSocket Replay (Option B)
  WsReplay,
  WsReplayPause,
  WsReplayResume,
  WsReplaySeek,
  WsReplayStop,
  WsReplayStarted,
  WsReplayPaused,
  WsReplayResumed,
  WsReplayCompleted,
  WsReplayStopped,
  WsHistoricalData,
  // WebSocket Bulk Stream (Option D)
  WsStream,
  WsStreamStop,
  WsStreamStarted,
  WsStreamProgress,
  WsHistoricalBatch,
  WsStreamCompleted,
  WsStreamStopped,
  // Errors
  ApiError,
} from './types';

export { OxArchiveError } from './types';

// Default export for convenience
export { OxArchive as default } from './client';
