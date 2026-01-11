/**
 * Configuration options for the 0xarchive client
 */
interface ClientOptions {
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
interface ApiResponse<T> {
    success: boolean;
    data: T;
    count: number;
    request_id: string;
}
/**
 * Pagination parameters for list endpoints
 */
interface PaginationParams {
    /** Maximum number of results to return */
    limit?: number;
    /** Number of results to skip */
    offset?: number;
}
/**
 * Time range parameters for historical queries
 */
interface TimeRangeParams extends PaginationParams {
    /** Start timestamp (Unix ms or ISO string) */
    start?: number | string;
    /** End timestamp (Unix ms or ISO string) */
    end?: number | string;
}
/** A price level in the order book [price, size] */
type PriceLevel = [string, string];
/**
 * Order book snapshot
 */
interface OrderBook {
    coin: string;
    timestamp: number;
    bids: PriceLevel[];
    asks: PriceLevel[];
    mid_price: string;
    spread: string;
    spread_bps: string;
}
interface GetOrderBookParams {
    /** Timestamp to get order book at (Unix ms or ISO string) */
    timestamp?: number | string;
    /** Number of price levels to return per side */
    depth?: number;
}
interface OrderBookHistoryParams extends TimeRangeParams {
    /** Number of price levels to return per side */
    depth?: number;
}
/**
 * Trade/fill record
 */
interface Trade {
    id: string;
    coin: string;
    side: 'buy' | 'sell';
    price: string;
    size: string;
    value: string;
    timestamp: number;
    trade_type: string;
}
interface GetTradesParams extends TimeRangeParams {
    /** Filter by side */
    side?: 'buy' | 'sell';
}
/**
 * OHLCV candle
 */
interface Candle {
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
type CandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
interface GetCandlesParams extends TimeRangeParams {
    /** Candle interval */
    interval?: CandleInterval;
}
/**
 * Trading instrument metadata
 */
interface Instrument {
    coin: string;
    name: string;
    sz_decimals: number;
    max_leverage: number;
    only_isolated: boolean;
    is_active: boolean;
}
/**
 * Funding rate record
 */
interface FundingRate {
    coin: string;
    funding_rate: string;
    premium: string;
    timestamp: number;
}
/**
 * Open interest record
 */
interface OpenInterest {
    coin: string;
    open_interest: string;
    timestamp: number;
}
/** WebSocket channel types */
type WsChannel = 'orderbook' | 'trades' | 'ticker' | 'all_tickers';
/** Subscribe message from client */
interface WsSubscribe {
    op: 'subscribe';
    channel: WsChannel;
    coin?: string;
}
/** Unsubscribe message from client */
interface WsUnsubscribe {
    op: 'unsubscribe';
    channel: WsChannel;
    coin?: string;
}
/** Ping message from client */
interface WsPing {
    op: 'ping';
}
/** Client message union type */
type WsClientMessage = WsSubscribe | WsUnsubscribe | WsPing;
/** Subscription confirmed from server */
interface WsSubscribed {
    type: 'subscribed';
    channel: WsChannel;
    coin?: string;
}
/** Unsubscription confirmed from server */
interface WsUnsubscribed {
    type: 'unsubscribed';
    channel: WsChannel;
    coin?: string;
}
/** Pong response from server */
interface WsPong {
    type: 'pong';
}
/** Error from server */
interface WsError {
    type: 'error';
    message: string;
}
/** Data message from server */
interface WsData<T = unknown> {
    type: 'data';
    channel: WsChannel;
    coin: string;
    data: T;
}
/** Server message union type */
type WsServerMessage = WsSubscribed | WsUnsubscribed | WsPong | WsError | WsData;
/** WebSocket connection options */
interface WsOptions {
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
type WsConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
/** WebSocket event handlers */
interface WsEventHandlers {
    onOpen?: () => void;
    onClose?: (code: number, reason: string) => void;
    onError?: (error: Error) => void;
    onMessage?: (message: WsServerMessage) => void;
    onStateChange?: (state: WsConnectionState) => void;
}
/**
 * API error response
 */
interface ApiError {
    code: number;
    error: string;
}
/**
 * SDK error class
 */
declare class OxArchiveError extends Error {
    code: number;
    requestId?: string;
    constructor(message: string, code: number, requestId?: string);
}

interface HttpClientOptions {
    baseUrl: string;
    apiKey: string;
    timeout: number;
}
/**
 * Internal HTTP client for making API requests
 */
declare class HttpClient {
    private baseUrl;
    private apiKey;
    private timeout;
    constructor(options: HttpClientOptions);
    /**
     * Make a GET request to the API
     */
    get<T>(path: string, params?: Record<string, unknown>): Promise<T>;
}

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
declare class OrderBookResource {
    private http;
    constructor(http: HttpClient);
    /**
     * Get order book snapshot for a coin
     *
     * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
     * @param params - Optional parameters
     * @returns Order book snapshot
     */
    get(coin: string, params?: GetOrderBookParams): Promise<OrderBook>;
    /**
     * Get historical order book snapshots
     *
     * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
     * @param params - Time range and pagination parameters
     * @returns Array of order book snapshots
     */
    history(coin: string, params?: OrderBookHistoryParams): Promise<OrderBook[]>;
}

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
declare class TradesResource {
    private http;
    constructor(http: HttpClient);
    /**
     * Get trade history for a coin
     *
     * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
     * @param params - Time range and pagination parameters
     * @returns Array of trades
     */
    list(coin: string, params?: GetTradesParams): Promise<Trade[]>;
    /**
     * Get most recent trades for a coin
     *
     * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
     * @param limit - Number of trades to return (default: 100)
     * @returns Array of recent trades
     */
    recent(coin: string, limit?: number): Promise<Trade[]>;
}

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
declare class CandlesResource {
    private http;
    constructor(http: HttpClient);
    /**
     * Get OHLCV candles for a coin
     *
     * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
     * @param params - Interval, time range, and pagination parameters
     * @returns Array of candles
     */
    list(coin: string, params?: GetCandlesParams): Promise<Candle[]>;
}

/**
 * Instruments API resource
 *
 * @example
 * ```typescript
 * // List all instruments
 * const instruments = await client.instruments.list();
 *
 * // Get specific instrument
 * const btc = await client.instruments.get('BTC');
 * ```
 */
declare class InstrumentsResource {
    private http;
    constructor(http: HttpClient);
    /**
     * List all available trading instruments
     *
     * @returns Array of instruments
     */
    list(): Promise<Instrument[]>;
    /**
     * Get a specific instrument by coin symbol
     *
     * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
     * @returns Instrument details
     */
    get(coin: string): Promise<Instrument>;
}

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
declare class FundingResource {
    private http;
    constructor(http: HttpClient);
    /**
     * Get funding rate history for a coin
     *
     * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
     * @param params - Time range and pagination parameters
     * @returns Array of funding rate records
     */
    history(coin: string, params?: TimeRangeParams): Promise<FundingRate[]>;
    /**
     * Get current funding rate for a coin
     *
     * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
     * @returns Current funding rate
     */
    current(coin: string): Promise<FundingRate>;
}

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
declare class OpenInterestResource {
    private http;
    constructor(http: HttpClient);
    /**
     * Get open interest history for a coin
     *
     * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
     * @param params - Time range and pagination parameters
     * @returns Array of open interest records
     */
    history(coin: string, params?: TimeRangeParams): Promise<OpenInterest[]>;
    /**
     * Get current open interest for a coin
     *
     * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
     * @returns Current open interest
     */
    current(coin: string): Promise<OpenInterest>;
}

/**
 * 0xarchive API client
 *
 * @example
 * ```typescript
 * import { OxArchive } from '@0xarchive/sdk';
 *
 * const client = new OxArchive({ apiKey: 'ox_your_api_key' });
 *
 * // Get current order book
 * const orderbook = await client.orderbook.get('BTC');
 * console.log(`BTC mid price: ${orderbook.mid_price}`);
 *
 * // Get historical data
 * const history = await client.orderbook.history('ETH', {
 *   start: Date.now() - 86400000,
 *   end: Date.now(),
 *   limit: 100
 * });
 *
 * // List all instruments
 * const instruments = await client.instruments.list();
 * ```
 */
declare class OxArchive {
    private http;
    /**
     * Order book data (L2 snapshots from April 2023)
     */
    readonly orderbook: OrderBookResource;
    /**
     * Trade/fill history
     */
    readonly trades: TradesResource;
    /**
     * OHLCV candles
     */
    readonly candles: CandlesResource;
    /**
     * Trading instruments metadata
     */
    readonly instruments: InstrumentsResource;
    /**
     * Funding rates
     */
    readonly funding: FundingResource;
    /**
     * Open interest
     */
    readonly openInterest: OpenInterestResource;
    /**
     * Create a new 0xarchive client
     *
     * @param options - Client configuration options
     */
    constructor(options: ClientOptions);
}

/**
 * WebSocket client for 0xarchive real-time streaming
 */

/**
 * WebSocket client for real-time data streaming
 */
declare class OxArchiveWs {
    private ws;
    private options;
    private handlers;
    private subscriptions;
    private state;
    private reconnectAttempts;
    private pingTimer;
    private reconnectTimer;
    constructor(options: WsOptions);
    /**
     * Connect to the WebSocket server
     */
    connect(handlers?: WsEventHandlers): void;
    /**
     * Disconnect from the WebSocket server
     */
    disconnect(): void;
    /**
     * Subscribe to a channel
     */
    subscribe(channel: WsChannel, coin?: string): void;
    /**
     * Subscribe to order book updates for a coin
     */
    subscribeOrderbook(coin: string): void;
    /**
     * Subscribe to trades for a coin
     */
    subscribeTrades(coin: string): void;
    /**
     * Subscribe to ticker updates for a coin
     */
    subscribeTicker(coin: string): void;
    /**
     * Subscribe to all tickers
     */
    subscribeAllTickers(): void;
    /**
     * Unsubscribe from a channel
     */
    unsubscribe(channel: WsChannel, coin?: string): void;
    /**
     * Unsubscribe from order book updates for a coin
     */
    unsubscribeOrderbook(coin: string): void;
    /**
     * Unsubscribe from trades for a coin
     */
    unsubscribeTrades(coin: string): void;
    /**
     * Unsubscribe from ticker updates for a coin
     */
    unsubscribeTicker(coin: string): void;
    /**
     * Unsubscribe from all tickers
     */
    unsubscribeAllTickers(): void;
    /**
     * Get current connection state
     */
    getState(): WsConnectionState;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    /**
     * Set event handlers after construction
     */
    on<K extends keyof WsEventHandlers>(event: K, handler: WsEventHandlers[K]): void;
    /**
     * Helper to handle typed orderbook data
     */
    onOrderbook(handler: (coin: string, data: OrderBook) => void): void;
    /**
     * Helper to handle typed trade data
     */
    onTrades(handler: (coin: string, data: Trade[]) => void): void;
    private send;
    private setState;
    private startPing;
    private stopPing;
    private subscriptionKey;
    private resubscribe;
    private scheduleReconnect;
    private clearReconnectTimer;
}

export { type ApiError, type ApiResponse, type Candle, type CandleInterval, type ClientOptions, type FundingRate, type GetCandlesParams, type GetOrderBookParams, type GetTradesParams, type Instrument, type OpenInterest, type OrderBook, type OrderBookHistoryParams, OxArchive, OxArchiveError, OxArchiveWs, type PaginationParams, type PriceLevel, type TimeRangeParams, type Trade, type WsChannel, type WsClientMessage, type WsConnectionState, type WsData, type WsError, type WsEventHandlers, type WsOptions, type WsPing, type WsPong, type WsServerMessage, type WsSubscribe, type WsSubscribed, type WsUnsubscribe, type WsUnsubscribed, OxArchive as default };
