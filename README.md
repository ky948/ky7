# KY7 — Autonomous Crypto Trading Platform

Private single-user crypto trading cockpit with adaptive strategy controls, autonomous-learning UI, risk controls, audit logging, and profit-sweep workflow.

## Quick start

    cp .env.example .env
    npm install
    npm run dev

Open the displayed local URL.

## Production

    cp .env.example .env
    # Set production secrets and infrastructure values.
    docker compose up -d --build

Live mode is exchange-backed: set `TRADING_MODE=LIVE_VAULT` only in the deployment secret store. In live mode the dashboard reads Binance account state rather than the simulator. Autonomous live trading remains opt-in via `LIVE_AUTONOMOUS_ENABLED=true`.

See `docs/production-architecture.md`, `docs/live-operations.md`, and `docs/aws-deployment.md` for the production boundary, funding, withdrawals, and AWS operating model.

## Important

Trading is probabilistic and can lose money. No strategy or AI system can guarantee profit.
