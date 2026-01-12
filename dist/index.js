"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  OxArchive: () => OxArchive,
  OxArchiveError: () => OxArchiveError,
  OxArchiveWs: () => OxArchiveWs,
  default: () => OxArchive
});
module.exports = __toCommonJS(index_exports);

// src/types.ts
var OxArchiveError = class extends Error {
  code;
  requestId;
  constructor(message, code, requestId) {
    super(message);
    this.name = "OxArchiveError";
    this.code = code;
    this.requestId = requestId;
  }
};

// src/http.ts
var HttpClient = class {
  baseUrl;
  apiKey;
  timeout;
  constructor(options) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.timeout = options.timeout;
  }
  /**
   * Make a GET request to the API
   */
  async get(path, params) {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== void 0 && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "X-API-Key": this.apiKey,
          "Content-Type": "application/json"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (!response.ok) {
        const error = data;
        throw new OxArchiveError(
          error.error || `Request failed with status ${response.status}`,
          response.status,
          data.request_id
        );
      }
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof OxArchiveError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new OxArchiveError(`Request timeout after ${this.timeout}ms`, 408);
      }
      throw new OxArchiveError(
        error instanceof Error ? error.message : "Unknown error",
        500
      );
    }
  }
};

// src/resources/orderbook.ts
var OrderBookResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Get order book snapshot for a coin
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @param params - Optional parameters
   * @returns Order book snapshot
   */
  async get(coin, params) {
    const response = await this.http.get(
      `/v1/orderbook/${coin.toUpperCase()}`,
      params
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
  async history(coin, params) {
    const response = await this.http.get(
      `/v1/orderbook/${coin.toUpperCase()}/history`,
      params
    );
    return response.data;
  }
};

// src/resources/trades.ts
var TradesResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Get trade history for a coin
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @param params - Time range and pagination parameters
   * @returns Array of trades
   */
  async list(coin, params) {
    const response = await this.http.get(
      `/v1/trades/${coin.toUpperCase()}`,
      params
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
  async recent(coin, limit) {
    const response = await this.http.get(
      `/v1/trades/${coin.toUpperCase()}/recent`,
      { limit }
    );
    return response.data;
  }
};

// src/resources/candles.ts
var CandlesResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Get OHLCV candles for a coin
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @param params - Interval, time range, and pagination parameters
   * @returns Array of candles
   */
  async list(coin, params) {
    const response = await this.http.get(
      `/v1/candles/${coin.toUpperCase()}`,
      params
    );
    return response.data;
  }
};

// src/resources/instruments.ts
var InstrumentsResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * List all available trading instruments
   *
   * @returns Array of instruments
   */
  async list() {
    const response = await this.http.get(
      "/v1/instruments"
    );
    return response.data;
  }
  /**
   * Get a specific instrument by coin symbol
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @returns Instrument details
   */
  async get(coin) {
    const response = await this.http.get(
      `/v1/instruments/${coin.toUpperCase()}`
    );
    return response.data;
  }
};

// src/resources/funding.ts
var FundingResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Get funding rate history for a coin
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @param params - Time range and pagination parameters
   * @returns Array of funding rate records
   */
  async history(coin, params) {
    const response = await this.http.get(
      `/v1/funding/${coin.toUpperCase()}`,
      params
    );
    return response.data;
  }
  /**
   * Get current funding rate for a coin
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @returns Current funding rate
   */
  async current(coin) {
    const response = await this.http.get(
      `/v1/funding/${coin.toUpperCase()}/current`
    );
    return response.data;
  }
};

// src/resources/openinterest.ts
var OpenInterestResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Get open interest history for a coin
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @param params - Time range and pagination parameters
   * @returns Array of open interest records
   */
  async history(coin, params) {
    const response = await this.http.get(
      `/v1/openinterest/${coin.toUpperCase()}`,
      params
    );
    return response.data;
  }
  /**
   * Get current open interest for a coin
   *
   * @param coin - The coin symbol (e.g., 'BTC', 'ETH')
   * @returns Current open interest
   */
  async current(coin) {
    const response = await this.http.get(
      `/v1/openinterest/${coin.toUpperCase()}/current`
    );
    return response.data;
  }
};

// src/client.ts
var DEFAULT_BASE_URL = "https://api.0xarchive.io";
var DEFAULT_TIMEOUT = 3e4;
var OxArchive = class {
  http;
  /**
   * Order book data (L2 snapshots from April 2023)
   */
  orderbook;
  /**
   * Trade/fill history
   */
  trades;
  /**
   * OHLCV candles
   */
  candles;
  /**
   * Trading instruments metadata
   */
  instruments;
  /**
   * Funding rates
   */
  funding;
  /**
   * Open interest
   */
  openInterest;
  /**
   * Create a new 0xarchive client
   *
   * @param options - Client configuration options
   */
  constructor(options) {
    if (!options.apiKey) {
      throw new Error("API key is required. Get one at https://0xarchive.io/signup");
    }
    this.http = new HttpClient({
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      apiKey: options.apiKey,
      timeout: options.timeout ?? DEFAULT_TIMEOUT
    });
    this.orderbook = new OrderBookResource(this.http);
    this.trades = new TradesResource(this.http);
    this.candles = new CandlesResource(this.http);
    this.instruments = new InstrumentsResource(this.http);
    this.funding = new FundingResource(this.http);
    this.openInterest = new OpenInterestResource(this.http);
  }
};

// src/websocket.ts
var DEFAULT_WS_URL = "wss://api.0xarchive.io/ws";
var DEFAULT_PING_INTERVAL = 3e4;
var DEFAULT_RECONNECT_DELAY = 1e3;
var DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;
var OxArchiveWs = class {
  ws = null;
  options;
  handlers = {};
  subscriptions = /* @__PURE__ */ new Set();
  state = "disconnected";
  reconnectAttempts = 0;
  pingTimer = null;
  reconnectTimer = null;
  constructor(options) {
    this.options = {
      apiKey: options.apiKey,
      wsUrl: options.wsUrl ?? DEFAULT_WS_URL,
      autoReconnect: options.autoReconnect ?? true,
      reconnectDelay: options.reconnectDelay ?? DEFAULT_RECONNECT_DELAY,
      maxReconnectAttempts: options.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS,
      pingInterval: options.pingInterval ?? DEFAULT_PING_INTERVAL
    };
  }
  /**
   * Connect to the WebSocket server
   */
  connect(handlers) {
    if (handlers) {
      this.handlers = handlers;
    }
    this.setState("connecting");
    const url = `${this.options.wsUrl}?apiKey=${encodeURIComponent(this.options.apiKey)}`;
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setState("connected");
      this.startPing();
      this.resubscribe();
      this.handlers.onOpen?.();
    };
    this.ws.onclose = (event) => {
      this.stopPing();
      this.handlers.onClose?.(event.code, event.reason);
      if (this.options.autoReconnect && this.state !== "disconnected") {
        this.scheduleReconnect();
      } else {
        this.setState("disconnected");
      }
    };
    this.ws.onerror = () => {
      const error = new Error("WebSocket connection error");
      this.handlers.onError?.(error);
    };
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handlers.onMessage?.(message);
      } catch {
      }
    };
  }
  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    this.setState("disconnected");
    this.stopPing();
    this.clearReconnectTimer();
    if (this.ws) {
      this.ws.close(1e3, "Client disconnect");
      this.ws = null;
    }
  }
  /**
   * Subscribe to a channel
   */
  subscribe(channel, coin) {
    const key = this.subscriptionKey(channel, coin);
    this.subscriptions.add(key);
    if (this.isConnected()) {
      this.send({ op: "subscribe", channel, coin });
    }
  }
  /**
   * Subscribe to order book updates for a coin
   */
  subscribeOrderbook(coin) {
    this.subscribe("orderbook", coin);
  }
  /**
   * Subscribe to trades for a coin
   */
  subscribeTrades(coin) {
    this.subscribe("trades", coin);
  }
  /**
   * Subscribe to ticker updates for a coin
   */
  subscribeTicker(coin) {
    this.subscribe("ticker", coin);
  }
  /**
   * Subscribe to all tickers
   */
  subscribeAllTickers() {
    this.subscribe("all_tickers");
  }
  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel, coin) {
    const key = this.subscriptionKey(channel, coin);
    this.subscriptions.delete(key);
    if (this.isConnected()) {
      this.send({ op: "unsubscribe", channel, coin });
    }
  }
  /**
   * Unsubscribe from order book updates for a coin
   */
  unsubscribeOrderbook(coin) {
    this.unsubscribe("orderbook", coin);
  }
  /**
   * Unsubscribe from trades for a coin
   */
  unsubscribeTrades(coin) {
    this.unsubscribe("trades", coin);
  }
  /**
   * Unsubscribe from ticker updates for a coin
   */
  unsubscribeTicker(coin) {
    this.unsubscribe("ticker", coin);
  }
  /**
   * Unsubscribe from all tickers
   */
  unsubscribeAllTickers() {
    this.unsubscribe("all_tickers");
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
  replay(channel, coin, options) {
    this.send({
      op: "replay",
      channel,
      coin,
      start: options.start,
      end: options.end,
      speed: options.speed ?? 1
    });
  }
  /**
   * Pause the current replay
   */
  replayPause() {
    this.send({ op: "replay.pause" });
  }
  /**
   * Resume a paused replay
   */
  replayResume() {
    this.send({ op: "replay.resume" });
  }
  /**
   * Seek to a specific timestamp in the replay
   * @param timestamp - Unix timestamp in milliseconds
   */
  replaySeek(timestamp) {
    this.send({ op: "replay.seek", timestamp });
  }
  /**
   * Stop the current replay
   */
  replayStop() {
    this.send({ op: "replay.stop" });
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
  stream(channel, coin, options) {
    this.send({
      op: "stream",
      channel,
      coin,
      start: options.start,
      end: options.end,
      batch_size: options.batchSize ?? 1e3
    });
  }
  /**
   * Stop the current bulk stream
   */
  streamStop() {
    this.send({ op: "stream.stop" });
  }
  // ==========================================================================
  // Event Handlers for Replay/Stream
  // ==========================================================================
  /**
   * Handle historical data points (replay mode)
   */
  onHistoricalData(handler) {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === "historical_data") {
        const msg = message;
        handler(msg.coin, msg.timestamp, msg.data);
      }
      originalHandler?.(message);
    };
  }
  /**
   * Handle batched data (bulk stream mode)
   */
  onBatch(handler) {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === "historical_batch") {
        const msg = message;
        handler(msg.coin, msg.records);
      }
      originalHandler?.(message);
    };
  }
  /**
   * Handle replay started event
   */
  onReplayStart(handler) {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === "replay_started") {
        const msg = message;
        handler(msg.channel, msg.coin, msg.total_records, msg.speed);
      }
      originalHandler?.(message);
    };
  }
  /**
   * Handle replay completed event
   */
  onReplayComplete(handler) {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === "replay_completed") {
        const msg = message;
        handler(msg.channel, msg.coin, msg.records_sent);
      }
      originalHandler?.(message);
    };
  }
  /**
   * Handle stream started event
   */
  onStreamStart(handler) {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === "stream_started") {
        const msg = message;
        handler(msg.channel, msg.coin, msg.total_records);
      }
      originalHandler?.(message);
    };
  }
  /**
   * Handle stream progress event
   */
  onStreamProgress(handler) {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === "stream_progress") {
        const msg = message;
        handler(msg.records_sent, msg.total_records, msg.progress_pct);
      }
      originalHandler?.(message);
    };
  }
  /**
   * Handle stream completed event
   */
  onStreamComplete(handler) {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === "stream_completed") {
        const msg = message;
        handler(msg.channel, msg.coin, msg.records_sent);
      }
      originalHandler?.(message);
    };
  }
  /**
   * Get current connection state
   */
  getState() {
    return this.state;
  }
  /**
   * Check if connected
   */
  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  /**
   * Set event handlers after construction
   */
  on(event, handler) {
    this.handlers[event] = handler;
  }
  /**
   * Helper to handle typed orderbook data
   */
  onOrderbook(handler) {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === "data" && message.channel === "orderbook") {
        handler(message.coin, message.data);
      }
      originalHandler?.(message);
    };
  }
  /**
   * Helper to handle typed trade data
   */
  onTrades(handler) {
    const originalHandler = this.handlers.onMessage;
    this.handlers.onMessage = (message) => {
      if (message.type === "data" && message.channel === "trades") {
        handler(message.coin, message.data);
      }
      originalHandler?.(message);
    };
  }
  // Private methods
  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  setState(state) {
    this.state = state;
    this.handlers.onStateChange?.(state);
  }
  startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ op: "ping" });
    }, this.options.pingInterval);
  }
  stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
  subscriptionKey(channel, coin) {
    return coin ? `${channel}:${coin}` : channel;
  }
  resubscribe() {
    for (const key of this.subscriptions) {
      const [channel, coin] = key.split(":");
      this.send({ op: "subscribe", channel, coin });
    }
  }
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.setState("disconnected");
      return;
    }
    this.setState("reconnecting");
    this.reconnectAttempts++;
    const delay = this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OxArchive,
  OxArchiveError,
  OxArchiveWs
});
//# sourceMappingURL=index.js.map