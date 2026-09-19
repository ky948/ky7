# KY7 AWS deployment runbook

AWS is now the intended production deployment platform.

## Topology

Internet -> Route 53 -> ACM HTTPS -> AWS WAF -> Application Load Balancer -> Cognito -> ECS Fargate private task.

The private task connects to RDS PostgreSQL and ElastiCache Redis, and outbound Binance traffic goes through a NAT Gateway with a fixed Elastic IP.

## GitHub OIDC

Create a GitHub Actions IAM role restricted to repository ky948/ky7 and the production deployment environment. Store its ARN as AWS_DEPLOY_ROLE_ARN in the GitHub production environment. Set AWS_REGION to ap-south-1 unless another AWS region is desired.

Do not store long-lived AWS access keys in GitHub.

## Domain

Provide a Route 53 hosted zone and a hostname such as trade.example.com. Set domain_name and route53_zone_id in local Terraform variables.

## Secrets

Terraform creates:
- ky7-production/gemini-api-key
- ky7-production/binance-api-key
- ky7-production/binance-api-secret
- ky7-production/destination-wallet
- ky7-production/destination-network

Populate them with scripts/bootstrap-aws-secrets.sh. The script never writes secret values into Git.

## Binance networking

After infrastructure creation:

terraform -chdir=infra/aws output -json nat_public_ips

Add every returned IP to the Binance API-key allowlist. Keep withdrawals disabled.

## Owner login

Cognito is configured for administrator-created users and MFA. Create the owner with AWS CLI after the first infrastructure apply.

## Safety defaults

- ECS task count: 1
- autonomous live trading: OFF
- withdrawals: OFF
- profit sweep: OFF
- max capital allocation: 25%
- max position size: 10%
- daily-loss circuit breaker: 3%
- drawdown circuit breaker: 10%
- WAF: ON
- deployment rollback: ON
- RDS deletion protection: ON

## Persistence gate

The current server still has significant in-memory portfolio, audit, and strategy state. RDS and Redis are provisioned, but the application must be wired to persist orders, fills, balances/NAV, P&L, strategy versions, risk state, audit events, and withdrawals before unattended live trading.

On restart, reconcile Binance balances/open orders/fills before resuming autonomous execution.

No deployment architecture guarantees trading profit.
