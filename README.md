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

The default trading mode is PAPER. Do not enable live trading until exchange credentials, risk limits, reconciliation, and sweep settings have been verified.

See docs/production-architecture.md for the production boundary and operating model.

## Important

Trading is probabilistic and can lose money. No strategy or AI system can guarantee profit.
