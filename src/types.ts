/**
 * Configuration options for the 0xarchive client
 */
export interface ClientOptions {
  /** Your 0xarchive API key */
  apiKey: string;
  /** Base URL for the API (defaults to https://api.0xarchive.io) */
  baseUrl?: string;
  /** Request timeout in milliseconds (defaults to 30000) */
  timeout?: number;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count: number;
  request_id: string;
}

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  /** Maximum number of results to return */
  limit?: number;
  /** Number of results to skip */
  offset?: number;
}

/**
 * Time range parameters for historical queries
 */
export interface TimeRangeParams extends PaginationParams {
  /** Start timestamp (Unix ms or ISO string) */
  start?: number | string;
  /** End timestamp (Unix ms or ISO string) */
  end?: number | string;
}

// =============================================================================
// Order Book Types
// =============================================================================

/** A price level in the order book [price, size] */
export type PriceLevel = [string, string];

/**
 * Order book snapshot
 */
export interface OrderBook {
  coin: string;
  timestamp: number;
  bids: PriceLevel[];
  asks: PriceLevel[];
  mid_price: string;
  spread: string;
  spread_bps: string;
}

export interface GetOrderBookParams {
  /** Timestamp to get order book at (Unix ms or ISO string) */
  timestamp?: number | string;
  /** Number of price levels to return per side */
  depth?: number;
}

export interface OrderBookHistoryParams extends TimeRangeParams {
  /** Number of price levels to return per side */
  depth?: number;
}

// =============================================================================
// Trades Types
// =============================================================================

/**
 * Trade/fill record
 */
export interface Trade {
  id: string;
  coin: string;
  side: 'buy' | 'sell';
  price: string;
  size: string;
  value: string;
  timestamp: number;
  trade_type: string;
}

export interface GetTradesParams extends TimeRangeParams {
  /** Filter by side */
  side?: 'buy' | 'sell';
}

// =============================================================================
// Candles Types
// =============================================================================

/**
 * OHLCV candle
 */
export interface Candle {
  coin: string;
  interval: string;
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  trades: number;
}

export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface GetCandlesParams extends TimeRangeParams {
  /** Candle interval */
  interval?: CandleInterval;
}

// =============================================================================
// Instruments Types
// =============================================================================

/**
 * Trading instrument metadata
 */
export interface Instrument {
  coin: string;
  name: string;
  sz_decimals: number;
  max_leverage: number;
  only_isolated: boolean;
  is_active: boolean;
}

// =============================================================================
// Funding Types
// =============================================================================

/**
 * Funding rate record
 */
export interface FundingRate {
  coin: string;
  funding_rate: string;
  premium: string;
  timestamp: number;
}

// =============================================================================
// Open Interest Types
// =============================================================================

/**
 * Open interest record
 */
export interface OpenInterest {
  coin: string;
  open_interest: string;
  timestamp: number;
}

// =============================================================================
// WebSocket Types
// =============================================================================

/** WebSocket channel types */
export type WsChannel = 'orderbook' | 'trades' | 'ticker' | 'all_tickers' | 'candles' | 'funding' | 'openinterest';

/** Subscribe message from client */
export interface WsSubscribe {
  op: 'subscribe';
  channel: WsChannel;
  coin?: string;
}

/** Unsubscribe message from client */
export interface WsUnsubscribe {
  op: 'unsubscribe';
  channel: WsChannel;
  coin?: string;
}

/** Ping message from client */
export interface WsPing {
  op: 'ping';
}

/** Replay message from client - replays historical data with timing preserved */
export interface WsReplay {
  op: 'replay';
  channel: WsChannel;
  coin?: string;
  /** Start timestamp (Unix ms) */
  start: number;
  /** End timestamp (Unix ms, defaults to now) */
  end?: number;
  /** Playback speed multiplier (1 = real-time, 10 = 10x faster) */
  speed?: number;
}

/** Replay control messages */
export interface WsReplayPause { op: 'replay.pause'; }
export interface WsReplayResume { op: 'replay.resume'; }
export interface WsReplaySeek { op: 'replay.seek'; timestamp: number; }
export interface WsReplayStop { op: 'replay.stop'; }

/** Stream message from client - bulk download historical data */
export interface WsStream {
  op: 'stream';
  channel: WsChannel;
  coin?: string;
  /** Start timestamp (Unix ms) */
  start: number;
  /** End timestamp (Unix ms) */
  end: number;
  /** Batch size (records per message) */
  batch_size?: number;
}

/** Stream control messages */
export interface WsStreamStop { op: 'stream.stop'; }

/** Client message union type */
export type WsClientMessage =
  | WsSubscribe
  | WsUnsubscribe
  | WsPing
  | WsReplay
  | WsReplayPause
  | WsReplayResume
  | WsReplaySeek
  | WsReplayStop
  | WsStream
  | WsStreamStop;

/** Subscription confirmed from server */
export interface WsSubscribed {
  type: 'subscribed';
  channel: WsChannel;
  coin?: string;
}

/** Unsubscription confirmed from server */
export interface WsUnsubscribed {
  type: 'unsubscribed';
  channel: WsChannel;
  coin?: string;
}

/** Pong response from server */
export interface WsPong {
  type: 'pong';
}

/** Error from server */
export interface WsError {
  type: 'error';
  message: string;
}

/** Data message from server */
export interface WsData<T = unknown> {
  type: 'data';
  channel: WsChannel;
  coin: string;
  data: T;
}

/** Replay started response */
export interface WsReplayStarted {
  type: 'replay_started';
  channel: WsChannel;
  coin: string;
  start: number;
  end: number;
  speed: number;
  total_records: number;
}

/** Replay paused response */
export interface WsReplayPaused {
  type: 'replay_paused';
  current_timestamp: number;
}

/** Replay resumed response */
export interface WsReplayResumed {
  type: 'replay_resumed';
  current_timestamp: number;
}

/** Replay completed response */
export interface WsReplayCompleted {
  type: 'replay_completed';
  channel: WsChannel;
  coin: string;
  records_sent: number;
}

/** Replay stopped response */
export interface WsReplayStopped {
  type: 'replay_stopped';
}

/** Historical data point (replay mode) */
export interface WsHistoricalData<T = unknown> {
  type: 'historical_data';
  channel: WsChannel;
  coin: string;
  timestamp: number;
  data: T;
}

/** Stream started response */
export interface WsStreamStarted {
  type: 'stream_started';
  channel: WsChannel;
  coin: string;
  start: number;
  end: number;
  batch_size: number;
  total_records: number;
}

/** Stream progress response */
export interface WsStreamProgress {
  type: 'stream_progress';
  records_sent: number;
  total_records: number;
  progress_pct: number;
}

/** Stream batch (bulk data) */
export interface WsHistoricalBatch<T = unknown> {
  type: 'historical_batch';
  channel: WsChannel;
  coin: string;
  batch_index: number;
  records: Array<{ timestamp: number; data: T }>;
}

/** Stream completed response */
export interface WsStreamCompleted {
  type: 'stream_completed';
  channel: WsChannel;
  coin: string;
  records_sent: number;
}

/** Stream stopped response */
export interface WsStreamStopped {
  type: 'stream_stopped';
}

/** Server message union type */
export type WsServerMessage =
  | WsSubscribed
  | WsUnsubscribed
  | WsPong
  | WsError
  | WsData
  | WsReplayStarted
  | WsReplayPaused
  | WsReplayResumed
  | WsReplayCompleted
  | WsReplayStopped
  | WsHistoricalData
  | WsStreamStarted
  | WsStreamProgress
  | WsHistoricalBatch
  | WsStreamCompleted
  | WsStreamStopped;

/** WebSocket connection options */
export interface WsOptions {
  /** API key for authentication */
  apiKey: string;
  /** WebSocket URL (defaults to wss://ws.0xarchive.io) */
  wsUrl?: string;
  /** Auto-reconnect on disconnect (defaults to true) */
  autoReconnect?: boolean;
  /** Reconnect delay in ms (defaults to 1000) */
  reconnectDelay?: number;
  /** Maximum reconnect attempts (defaults to 10) */
  maxReconnectAttempts?: number;
  /** Ping interval in ms (defaults to 30000) */
  pingInterval?: number;
}

/** WebSocket connection state */
export type WsConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

/** WebSocket event handlers */
export interface WsEventHandlers {
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (error: Error) => void;
  onMessage?: (message: WsServerMessage) => void;
  onStateChange?: (state: WsConnectionState) => void;
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * API error response
 */
export interface ApiError {
  code: number;
  error: string;
}

/**
 * SDK error class
 */
export class OxArchiveError extends Error {
  code: number;
  requestId?: string;

  constructor(message: string, code: number, requestId?: string) {
    super(message);
    this.name = 'OxArchiveError';
    this.code = code;
    this.requestId = requestId;
  }
}
