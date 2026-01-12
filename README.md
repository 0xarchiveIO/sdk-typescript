# @0xarchive/sdk

Official TypeScript/JavaScript SDK for [0xarchive](https://0xarchive.io) - Hyperliquid Historical Data API.

## Installation

```bash
npm install @0xarchive/sdk
# or
yarn add @0xarchive/sdk
# or
pnpm add @0xarchive/sdk
```

## Quick Start

```typescript
import { OxArchive } from '@0xarchive/sdk';

const client = new OxArchive({ apiKey: 'ox_your_api_key' });

// Get current order book
const orderbook = await client.orderbook.get('BTC');
console.log(`BTC mid price: ${orderbook.mid_price}`);

// Get historical order book snapshots
const history = await client.orderbook.history('ETH', {
  start: Date.now() - 86400000, // 24 hours ago
  end: Date.now(),
  limit: 100
});
```

## Configuration

```typescript
const client = new OxArchive({
  apiKey: 'ox_your_api_key',     // Required
  baseUrl: 'https://api.0xarchive.io', // Optional, defaults to production
  timeout: 30000,                 // Optional, request timeout in ms
});
```

## API Reference

### Order Book

```typescript
// Get current order book
const orderbook = await client.orderbook.get('BTC');

// Get order book at specific timestamp
const historical = await client.orderbook.get('BTC', {
  timestamp: 1704067200000,
  depth: 20  // Number of levels per side
});

// Get historical snapshots
const history = await client.orderbook.history('BTC', {
  start: '2024-01-01',
  end: '2024-01-02',
  limit: 1000
});
```

### Trades

```typescript
// Get recent trades
const recent = await client.trades.recent('BTC', 100);

// Get trade history
const trades = await client.trades.list('ETH', {
  start: Date.now() - 3600000,
  end: Date.now(),
  side: 'buy'  // Optional: filter by side
});
```

### Candles (OHLCV)

```typescript
// Get hourly candles
const candles = await client.candles.list('BTC', {
  interval: '1h',
  start: Date.now() - 86400000,
  end: Date.now()
});

// Available intervals: '1m', '5m', '15m', '1h', '4h', '1d'
```

### Instruments

```typescript
// List all instruments
const instruments = await client.instruments.list();

// Get specific instrument
const btc = await client.instruments.get('BTC');
```

### Funding Rates

```typescript
// Get current funding rate
const current = await client.funding.current('BTC');

// Get funding rate history
const history = await client.funding.history('ETH', {
  start: Date.now() - 86400000 * 7,
  end: Date.now()
});
```

### Open Interest

```typescript
// Get current open interest
const current = await client.openInterest.current('BTC');

// Get open interest history
const history = await client.openInterest.history('ETH', {
  start: Date.now() - 86400000,
  end: Date.now()
});
```

## WebSocket Streaming

For real-time data, use the WebSocket client:

```typescript
import { OxArchiveWs } from '@0xarchive/sdk';

const ws = new OxArchiveWs({ apiKey: 'ox_your_api_key' });

// Connect and set up handlers
ws.connect({
  onOpen: () => console.log('Connected'),
  onClose: (code, reason) => console.log(`Disconnected: ${code}`),
  onError: (error) => console.error('Error:', error),
  onMessage: (message) => console.log('Message:', message),
  onStateChange: (state) => console.log('State:', state),
});

// Subscribe to order book updates
ws.subscribeOrderbook('BTC');
ws.subscribeOrderbook('ETH');

// Subscribe to trades
ws.subscribeTrades('BTC');

// Subscribe to all tickers
ws.subscribeAllTickers();

// Typed handlers for specific data
ws.onOrderbook((coin, data) => {
  console.log(`${coin} orderbook: ${data.mid_price}`);
});

ws.onTrades((coin, trades) => {
  console.log(`${coin} new trades: ${trades.length}`);
});

// Unsubscribe
ws.unsubscribeOrderbook('ETH');

// Disconnect when done
ws.disconnect();
```

### Historical Replay (like Tardis.dev)

Replay historical data with timing preserved:

```typescript
const ws = new OxArchiveWs({ apiKey: 'ox_...' });
ws.connect();

// Handle replay data
ws.onHistoricalData((coin, timestamp, data) => {
  console.log(`${new Date(timestamp)}: ${data.mid_price}`);
});

ws.onReplayStart((channel, coin, totalRecords, speed) => {
  console.log(`Starting replay of ${totalRecords} records at ${speed}x`);
});

ws.onReplayComplete((channel, coin, recordsSent) => {
  console.log(`Replay complete: ${recordsSent} records`);
});

// Start replay at 10x speed
ws.replay('orderbook', 'BTC', {
  start: Date.now() - 86400000, // 24 hours ago
  speed: 10
});

// Control playback
ws.replayPause();
ws.replayResume();
ws.replaySeek(1704067200000); // Jump to timestamp
ws.replayStop();
```

### Bulk Streaming (like Databento)

Fast bulk download for data pipelines:

```typescript
const ws = new OxArchiveWs({ apiKey: 'ox_...' });
ws.connect();

const allData: OrderBook[] = [];

// Handle batched data
ws.onBatch((coin, records) => {
  allData.push(...records.map(r => r.data));
});

ws.onStreamProgress((sent, total, pct) => {
  console.log(`Progress: ${pct.toFixed(1)}%`);
});

ws.onStreamComplete((channel, coin, recordsSent) => {
  console.log(`Downloaded ${recordsSent} records`);
});

// Start bulk stream
ws.stream('orderbook', 'ETH', {
  start: Date.now() - 3600000, // 1 hour ago
  end: Date.now(),
  batchSize: 1000
});

// Stop stream if needed
ws.streamStop();
```

### WebSocket Configuration

```typescript
const ws = new OxArchiveWs({
  apiKey: 'ox_your_api_key',
  wsUrl: 'wss://api.0xarchive.io/ws',  // Optional
  autoReconnect: true,             // Auto-reconnect on disconnect
  reconnectDelay: 1000,            // Initial reconnect delay (ms)
  maxReconnectAttempts: 10,        // Max reconnect attempts
  pingInterval: 30000,             // Keep-alive ping interval (ms)
});
```

### Available Channels

| Channel | Description | Requires Coin |
|---------|-------------|---------------|
| `orderbook` | L2 order book updates | Yes |
| `trades` | Trade/fill updates | Yes |
| `ticker` | Price and 24h volume | Yes |
| `all_tickers` | All market tickers | No |

## Error Handling

```typescript
import { OxArchive, OxArchiveError } from '@0xarchive/sdk';

try {
  const orderbook = await client.orderbook.get('INVALID');
} catch (error) {
  if (error instanceof OxArchiveError) {
    console.error(`API Error: ${error.message}`);
    console.error(`Status Code: ${error.code}`);
    console.error(`Request ID: ${error.requestId}`);
  }
}
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  OrderBook,
  Trade,
  Candle,
  Instrument,
  FundingRate,
  OpenInterest
} from '@0xarchive/sdk';
```

## Requirements

- Node.js 18+
- Modern browsers with `fetch` support

## License

MIT
