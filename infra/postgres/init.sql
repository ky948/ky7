CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'INFO', actor TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CANDIDATE', parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(name, version)
);
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), client_order_id TEXT UNIQUE NOT NULL,
  exchange TEXT NOT NULL, symbol TEXT NOT NULL, side TEXT NOT NULL, order_type TEXT NOT NULL,
  price NUMERIC, quantity NUMERIC NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING',
  exchange_order_id TEXT, strategy_id UUID REFERENCES strategies(id),
  risk_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS fills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id),
  exchange_fill_id TEXT, price NUMERIC NOT NULL, quantity NUMERIC NOT NULL, fee NUMERIC NOT NULL DEFAULT 0,
  fee_asset TEXT, filled_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), symbol TEXT NOT NULL, side TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0, average_entry NUMERIC NOT NULL DEFAULT 0,
  realized_pnl NUMERIC NOT NULL DEFAULT 0, unrealized_pnl NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(symbol, side)
);
CREATE TABLE IF NOT EXISTS market_candles (
  symbol TEXT NOT NULL, timeframe TEXT NOT NULL, open_time TIMESTAMPTZ NOT NULL,
  open NUMERIC NOT NULL, high NUMERIC NOT NULL, low NUMERIC NOT NULL, close NUMERIC NOT NULL,
  volume NUMERIC NOT NULL, PRIMARY KEY(symbol, timeframe, open_time)
);
CREATE TABLE IF NOT EXISTS profit_sweeps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), asset TEXT NOT NULL, amount NUMERIC NOT NULL,
  destination_wallet TEXT NOT NULL, network TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING',
  tx_hash TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_type TEXT NOT NULL, symbol TEXT,
  message TEXT NOT NULL, metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_candles_symbol_time ON market_candles(symbol, open_time DESC);
