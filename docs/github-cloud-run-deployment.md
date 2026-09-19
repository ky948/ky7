# KY7 GitHub → Cloud Run deployment

## Architecture

GitHub main → GitHub Actions (OIDC) → Artifact Registry → Cloud Run (`ky7`, one instance) → Binance Spot API

Runtime secrets are read from Google Secret Manager. GitHub never stores the Binance/Gemini secret values in source control.

## GitHub configuration

Create these GitHub repository secrets:

- `GCP_PROJECT_ID` — Google Cloud project ID.
- `GCP_WORKLOAD_IDENTITY_PROVIDER` — full Workload Identity Federation provider resource.
- `GCP_SERVICE_ACCOUNT` — deployment service account email.

Create this GitHub repository variable:

- `GCP_REGION` — for example `us-central1`.

The deployment workflow is `.github/workflows/deploy-cloud-run.yml`.

## Google Secret Manager

Create these secrets in the same Google Cloud project:

- `ky7-gemini-api-key`
- `ky7-binance-api-key`
- `ky7-binance-api-secret`

The Cloud Run service account must have `roles/secretmanager.secretAccessor` on those secrets. Google recommends Secret Manager for API keys and other sensitive values rather than ordinary Cloud Run environment variables. urlCloud Run secrets documentationhttps://docs.cloud.google.com/run/docs/configuring/services/secrets

## GitHub OIDC

Use Workload Identity Federation rather than a long-lived Google service-account JSON key. The GitHub Actions job requests an OIDC token and the Google auth action exchanges it for Google credentials.

Google's deployment-pipeline documentation explicitly supports GitHub Actions OIDC with `google-github-actions/auth`. urlWorkload Identity Federation for deployment pipelineshttps://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines

The deployment identity needs permission to push to Artifact Registry and deploy/update Cloud Run. The Cloud Run runtime identity separately needs Secret Manager Secret Accessor.

## First deployment

1. Enable Cloud Run, Artifact Registry, Secret Manager, and IAM/Workload Identity Federation APIs in the Google Cloud project.
2. Create the Artifact Registry repository or let the workflow create it.
3. Create the three Secret Manager secrets above and add their first versions.
4. Configure the GitHub OIDC provider and deployment service account.
5. Add the three GitHub secrets and `GCP_REGION` repository variable.
6. Run `Deploy KY7 Cloud Run` from GitHub Actions.
7. The workflow builds the Docker image, pushes it to Artifact Registry, deploys exactly one Cloud Run instance, and checks `/api/health` and `/api/trading/live-readiness`.

Cloud Run imports the container image from the configured registry when a revision is deployed. urlCloud Run deployment documentationhttps://docs.cloud.google.com/run/docs/deploying

## Live safety defaults

The workflow deliberately deploys with:

`TRADING_MODE=LIVE_VAULT`

`LIVE_AUTONOMOUS_ENABLED=false`

`BINANCE_ENABLE_WITHDRAWALS=false`

`PROFIT_SWEEP_ENABLED=false`

`LIVE_PRINCIPAL_USDT=0`

That means the deployed application can connect to and inspect the Binance account, but deployment itself does not authorize autonomous orders or withdrawals.

After verifying the deployed dashboard, Binance permissions, IP restrictions, and funding balance, autonomous trading can be explicitly enabled through the Cloud Run configuration. Withdrawals require the separate withdrawal gate, destination allowlist, and principal reserve.

## Persistence warning

The current live execution boundary is exchange-backed for balances, prices and open orders, but the app's broader audit/P&L state still contains in-process state. Cloud Run instances can restart. Before treating the service as a fully durable institutional trading system, connect the persistence layer to managed PostgreSQL/Cloud SQL and move Redis-backed worker state out of the container.

Do not use the Docker Compose `postgres`/`redis` hostnames as though Cloud Run creates those services. Compose is for the local/containerized deployment path; Cloud Run requires managed or separately reachable services.

## Funding

KY7 is non-custodial. Fund the connected Binance account using Binance's own eligible USD/fiat funding flow. KY7 does not collect bank/card credentials.

## Production Cloud Run settings

- Minimum instances: 1
- Maximum instances: 1
- CPU throttling: disabled for the always-on trading worker
- Concurrency: 20
- CPU: 2
- Memory: 1 GiB
- Port: 3000

The single-instance limit is intentional so multiple Cloud Run instances do not independently run the trading loop.

## Never commit

Never commit `BINANCE_API_KEY`, `BINANCE_API_SECRET`, `GEMINI_API_KEY`, database passwords, withdrawal addresses with private credentials, or Google service-account JSON keys.