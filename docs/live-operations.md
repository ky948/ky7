# KY7 live operations

## Funding
KY7 is non-custodial. It does not accept or hold fiat itself. Fund the connected Binance account, then KY7 reads the exchange balance and trades only through the permissions granted to the API key.

Binance currently exposes fiat deposit/withdrawal flows only where the user's account and region are eligible. The web app should link to the exchange funding flow rather than collect bank credentials or card data itself.

## Live trading
`TRADING_MODE=LIVE_VAULT` makes Binance the source of truth for balances, market prices, open orders and live order execution. The simulator is explicitly bypassed in this mode.

Live managed market orders are capped by `MAX_CAPITAL_ALLOCATION` and `MAX_POSITION_SIZE`. The default template keeps autonomous live trading disabled until the operator explicitly enables `LIVE_AUTONOMOUS_ENABLED=true`.

## Profit withdrawals
Real withdrawals require `BINANCE_ENABLE_WITHDRAWALS=true`, an exact allow-listed destination, and `LIVE_PRINCIPAL_USDT` greater than zero. The withdrawal UI only treats free USDT above the principal reserve as eligible profit. This is a conservative principal-protection rule; it is not a complete realized-P&L ledger.

## Cloud Run
Google AI Studio apps deploy as Cloud Run containers. Docker Compose service names such as `postgres` and `redis` are not automatically created by Cloud Run, so those hostnames only work in the Compose deployment. For an always-on background worker, configure at least one minimum instance and instance-based billing/CPU allocation.

## Security
Use a Binance API key with only the permissions required for this app. Prefer a dedicated key with IP restriction and keep withdrawal permission off until the destination and network have been independently verified. Never commit API keys or secrets to Git.

## Important
Trading is probabilistic. No strategy or AI system can guarantee profit. A live exchange adapter does not eliminate market, execution, liquidity, outage or infrastructure risk.