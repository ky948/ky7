# KY7 Production Architecture

KY7 is a private single-user autonomous crypto trading control plane. The current web UI and API remain the operator surface; this repository now also contains the production deployment boundary, persistence schema, CI, and operational safety defaults.

## Runtime

- React + Vite UI
- Express/TypeScript API
- PostgreSQL for durable orders, fills, positions, strategies, market data, audit logs, risk events, and sweep records
- Redis for queues/cache/coordination
- Docker Compose for repeatable deployment
- GitHub Actions for build/type validation

## Autonomous loop

1. Ingest market data.
2. Calculate indicators/features and market regime.
3. Generate candidate grid/strategy parameters.
4. Backtest and walk-forward validate candidates.
5. Stress test fees, slippage, latency, and adverse moves.
6. Paper trade before live promotion.
7. Compare champion vs challenger.
8. Apply risk checks before every order.
9. Reconcile exchange state and fills.
10. Record realized P&L and sweep eligibility.
11. Promote only verified candidates and retain rollback checkpoints.

AI-generated ideas are advisory inputs. The risk engine and order manager remain authoritative.

## Live-trading boundary

The repository defaults to PAPER mode. Live trading must be explicitly enabled through deployment configuration after exchange credentials, symbol limits, risk limits, and wallet settings have been reviewed.

Never commit exchange API keys, withdrawal keys, seed phrases, private keys, or wallet secrets.

## Profit sweeps

A sweep must remain subject to reserve balance, minimum realized-profit threshold, destination wallet allow-list, network/asset validation, idempotency, audit logging, kill-switch state, and exchange withdrawal permissions. No sweep should be inferred from unrealized P&L.

## Operational safety

The kill switch must stop new orders before any flatten/cancel workflow. Strategy promotion, dependency updates, and autonomous changes should be reversible and auditable.

## Production checklist

- Set a strong PostgreSQL password.
- Set application secrets through the deployment environment.
- Keep PAPER mode during validation.
- Use minimum exchange API permissions.
- Verify IP allow-listing where supported.
- Configure and verify a wallet allow-list before enabling sweeps.
- Run CI and a paper-trading soak test.
- Review audit logs and reconciliation behavior.
- Enable live execution only with conservative limits.
