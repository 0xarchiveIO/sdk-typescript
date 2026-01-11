/**
 * WebSocket client for 0xarchive real-time streaming, replay, and bulk download
 *
 * @example Real-time streaming
 * ```typescript
 * const ws = new OxArchiveWs({ apiKey: 'ox_...' });
 * ws.connect({
 *   onMessage: (msg) => console.log(msg)
 * });
 * ws.subscribeOrderbook('BTC');
 * ```
 *
 * @example Historical replay (like Tardis.dev)
 * ```typescript
 * const ws = new OxArchiveWs({ apiKey: 'ox_...' });
 * ws.connect();
 * ws.onHistoricalData((coin, timestamp, data) => {
 *   console.log(`${new Date(timestamp)}: ${data.mid_price}`);
 * });
 * ws.replay('orderbook', 'BTC', {
 *   start: Date.now() - 86400000,
 *   speed: 10 // 10x speed
 * });
 * ```
 *
 * @example Bulk streaming (like Databento)
 * ```typescript
 * const ws = new OxArchiveWs({ apiKey: 'ox_...' });
 * ws.connect();
 * const batches: OrderBook[] = [];
 * ws.onBatch((coin, records) => {
 *   batches.push(...records.map(r => r.data));
 * });
 * ws.onStreamComplete((channel, coin, count) => {
 *   console.log(`Downloaded ${count} records`);
 * });
 * ws.stream('orderbook', 'ETH', {
 *   start: Date.now() - 3600000,
 *   end: Date.now(),
 *   batchSize: 1000
 * });
 * ```
 */

import type {
  WsOptions,
  WsChannel,
  WsClientMessage,
  WsServerMessage,
  WsConnectionState,
  WsEventHandlers,
  OrderBook,
  Trade,
  WsHistoricalData,
  WsHistoricalBatch,
  WsReplayStarted,
  WsReplayCompleted,
  WsStreamStarted,
  WsStreamCompleted,
  WsStreamProgress,
} from './types';

const DEFAULT_WS_URL = 'wss://ws.0xarchive.io';
const DEFAULT_PING_INTERVAL = 30000;
const DEFAULT_RECONNECT_DELAY = 1000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

/**
 * WebSocket client for real-time data streaming
 */
export class OxArchiveWs {
  private ws: WebSocket | null = null;
  private options: Required<WsOptions>;
  private handlers: WsEventHandlers = {};
  private subscriptions: Set<string> = new Set();
  private state: WsConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: WsOptions) {
    this.options = {
      apiKey: options.apiKey,
      wsUrl: options.wsUrl ?? DEFAULT_WS_URL,
      autoReconnect: options.autoReconnect ?? true,
      reconnectDelay: options.reconnectDelay ?? DEFAULT_RECONNECT_DELAY,
      maxReconnectAttempts: options.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS,
      pingInterval: options.pingInterval ?? DEFAULT_PING_INTERVAL,
    };
  }

  /**
   * Connect to the WebSocket server
   */
  connect(handlers?: WsEventHandlers): void {
    if (handlers) {
      this.handlers = handlers;
    }

    this.setState('connecting');

    const url = `${this.options.wsUrl}?apiKey=${encodeURIComponent(this.options.apiKey)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setState('connected');
      this.startPing();
      this.resubscribe();
      this.handlers.onOpen?.();
    };

    this.ws.onclose = (event) => {
      this.stopPing();
      this.handlers.onClose?.(event.code, event.reason);

      if (this.options.autoReconnect && this.state !== 'disconnected') {
        this.scheduleReconnect();
      } else {
        this.setState('disconnected');
      }
    };

    this.ws.onerror = () => {
      const error = new Error('WebSocket connection error');
      this.handlers.onError?.(error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WsServerMessage;
        this.handlers.onMessage?.(message);
      } catch {
        // Ignore parse errors for malformed messages
      }
    };
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.setState('disconnected');
    this.stopPing();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel: WsChannel, coin?: string): void {
    const key = this.subscriptionKey(channel, coin);
    this.subscriptions.add(key);

    if (this.isConnected()) {
      this.send({ op: 'subscribe', channel, coin });
    }
  }

  /**
   * Subscribe to order book updates for a coin
   */
  subscribeOrderbook(coin: string): void {
    this.subscribe('orderbook', coin);
  }

  /**
   * Subscribe to trades for a coin
   */
  subscribeTrades(coin: string): void {
    this.subscribe('trades', coin);
  }

  /**
   * Subscribe to ticker updates for a coin
   */
  subscribeTicker(coin: string): void {
    this.subscribe('ticker', coin);
  }

  /**
   * Subscribe to all tickers
   */
  subscribeAllTickers(): void {
    this.subscribe('all_tickers');
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: WsChannel, coin?: string): void {
    const key = this.subscriptionKey(channel, coin);
    this.subscriptions.delete(key);

    if (this.isConnected()) {
      this.send({ op: 'unsubscribe', channel, coin });
    }
  }

  /**
   * Unsubscribe from order book updates for a coin
   */
  unsubscribeOrderbook(coin: string): void {
    this.unsubscribe('orderbook', coin);
  }

  /**
   * Unsubscribe from trades for a coin
   */
  unsubscribeTrades(coin: string): void {
    this.unsubscribe('trades', coin);
  }

  /**
   * Unsubscribe from ticker updates for a coin
   */
  unsubscribeTicker(coin: string): void {
    this.unsubscribe('ticker', coin);
  }

  /**
   * Unsubscribe from all tickers
   */
  unsubscribeAllTickers(): void {
    this.unsubscribe('all_tickers');
  }

  // ==========================================================================
  // Historical Replay (Option B) - Like Tardis.dev
  // ==========================================================================

  /**
   * Start historical replay with timing preserved
   *
   * @param channel - Data channel to replay
   * @param coin - Trading pair (e.g., 'BTC', 'ETH')
   * @param options - Replay options
   *
   * @example
   * ```typescript
   * ws.replay('orderbook', 'BTC', {
   *   start: Date.now() - 86400000, // 24 hours ago
   *   speed: 10 // 10x faster than real-time
   * });
   * ```
   */
  replay(
    channel: WsChannel,
    coin: string,
    options: {
      start: number;
      end?: number;
      speed?: number;
    }
  ): void {
    this.send({
      op: 'replay',
      channel,
      coin,
      start: options.start,
      end: options.end,
      speed: options.speed ?? 1,
    });
  }

  /**
   * Pause the current replay
   */
  replayPause(): void {
    this.send({ op: 'replay.pause' });
  }

  /**
   * Resume a paused replay
   */
  replayResume(): void {
    this.send({ op: 'replay.resume' });
  }

  /**
   * Seek to a specific timestamp in the replay
   * @param timestamp - Unix timestamp in milliseconds
   */
  replaySeek(timestamp: number): void {
    this.send({ op: 'replay.seek', timestamp });
  }

  /**
   * Stop the current replay
   */
  replayStop(): void {
    this.send({ op: 'replay.stop' });
  }

  // ==========================================================================
  // Bulk Streaming (Option D) - Like Databento
  // ==========================================================================

  /**
   * Start bulk streaming for fast data download
   *
   * @param channel - Data channel to stream
   * @param coin - Trading pair (e.g., 'BTC', 'ETH')
   * @param options - Stream options
   *
   * @example
   * ```typescript
   * ws.stream('orderbook', 'ETH', {
   *   start: Date.now() - 3600000, // 1 hour ago
   *   end: Date.now(),
   *   batchSize: 1000
   * });
   * ```
   */
  stream(
    channel: WsChannel,
    coin: string,
    options: {
      start: number;
      end: number;
      batchSize?: number;
    }
  ): void {
    this.send({
      op: 'stream',
      channel,
      coin,
      start: options.start,
      end: options.end,
      batch_size: options.batchSize ?? 1000,
    });
  }

  /**
   * Stop the current bulk stream
   */
  streamStop(): void {
    this.send({ op: 'stream.stop' });
  }

  // ==========================================================================
  // Event Handlers for Replay/Stream
  // ==========================================================================

  /**
   * Handle historical data points (replay mode)
   */
  onHistoricalData<T = unknown>(
    handler: (coin: string, timestamp: number, data: T) => void
  ): void {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === 'historical_data') {
        const msg = message as WsHistoricalData<T>;
        handler(msg.coin, msg.timestamp, msg.data);
      }
      originalHandler?.(message);
    };
  }

  /**
   * Handle batched data (bulk stream mode)
   */
  onBatch<T = unknown>(
    handler: (coin: string, records: Array<{ timestamp: number; data: T }>) => void
  ): void {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === 'historical_batch') {
        const msg = message as WsHistoricalBatch<T>;
        handler(msg.coin, msg.records as Array<{ timestamp: number; data: T }>);
      }
      originalHandler?.(message);
    };
  }

  /**
   * Handle replay started event
   */
  onReplayStart(
    handler: (channel: WsChannel, coin: string, totalRecords: number, speed: number) => void
  ): void {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === 'replay_started') {
        const msg = message as WsReplayStarted;
        handler(msg.channel, msg.coin, msg.total_records, msg.speed);
      }
      originalHandler?.(message);
    };
  }

  /**
   * Handle replay completed event
   */
  onReplayComplete(
    handler: (channel: WsChannel, coin: string, recordsSent: number) => void
  ): void {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === 'replay_completed') {
        const msg = message as WsReplayCompleted;
        handler(msg.channel, msg.coin, msg.records_sent);
      }
      originalHandler?.(message);
    };
  }

  /**
   * Handle stream started event
   */
  onStreamStart(
    handler: (channel: WsChannel, coin: string, totalRecords: number) => void
  ): void {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === 'stream_started') {
        const msg = message as WsStreamStarted;
        handler(msg.channel, msg.coin, msg.total_records);
      }
      originalHandler?.(message);
    };
  }

  /**
   * Handle stream progress event
   */
  onStreamProgress(
    handler: (recordsSent: number, totalRecords: number, progressPct: number) => void
  ): void {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === 'stream_progress') {
        const msg = message as WsStreamProgress;
        handler(msg.records_sent, msg.total_records, msg.progress_pct);
      }
      originalHandler?.(message);
    };
  }

  /**
   * Handle stream completed event
   */
  onStreamComplete(
    handler: (channel: WsChannel, coin: string, recordsSent: number) => void
  ): void {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === 'stream_completed') {
        const msg = message as WsStreamCompleted;
        handler(msg.channel, msg.coin, msg.records_sent);
      }
      originalHandler?.(message);
    };
  }

  /**
   * Get current connection state
   */
  getState(): WsConnectionState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Set event handlers after construction
   */
  on<K extends keyof WsEventHandlers>(event: K, handler: WsEventHandlers[K]): void {
    this.handlers[event] = handler;
  }

  /**
   * Helper to handle typed orderbook data
   */
  onOrderbook(handler: (coin: string, data: OrderBook) => void): void {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === 'data' && message.channel === 'orderbook') {
        handler(message.coin, message.data as OrderBook);
      }
      originalHandler?.(message);
    };
  }

  /**
   * Helper to handle typed trade data
   */
  onTrades(handler: (coin: string, data: Trade[]) => void): void {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === 'data' && message.channel === 'trades') {
        handler(message.coin, message.data as Trade[]);
      }
      originalHandler?.(message);
    };
  }

  // Private methods

  private send(message: WsClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private setState(state: WsConnectionState): void {
    this.state = state;
    this.handlers.onStateChange?.(state);
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ op: 'ping' });
    }, this.options.pingInterval);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private subscriptionKey(channel: WsChannel, coin?: string): string {
    return coin ? `${channel}:${coin}` : channel;
  }

  private resubscribe(): void {
    for (const key of this.subscriptions) {
      const [channel, coin] = key.split(':') as [WsChannel, string | undefined];
      this.send({ op: 'subscribe', channel, coin });
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.setState('disconnected');
      return;
    }

    this.setState('reconnecting');
    this.reconnectAttempts++;

    const delay = this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
