#!/usr/bin/env bash
set -euo pipefail
AWS_REGION="${AWS_REGION:-ap-south-1}"
PREFIX="${KY7_SECRET_PREFIX:-ky7-production}"
read -r -s -p "Gemini API key: " GEMINI_API_KEY; echo
read -r -s -p "Binance API key: " BINANCE_API_KEY; echo
read -r -s -p "Binance API secret: " BINANCE_API_SECRET; echo
read -r -p "Destination wallet (blank while withdrawals are disabled): " DESTINATION_WALLET
read -r -p "Destination network (blank while withdrawals are disabled): " DESTINATION_NETWORK
put_secret(){ local name="$1"; local value="$2"; aws secretsmanager put-secret-value --region "${AWS_REGION}" --secret-id "${PREFIX}/${name}" --secret-string "${value}" >/dev/null; }
put_secret "gemini-api-key" "${GEMINI_API_KEY}"
put_secret "binance-api-key" "${BINANCE_API_KEY}"
put_secret "binance-api-secret" "${BINANCE_API_SECRET}"
put_secret "destination-wallet" "${DESTINATION_WALLET}"
put_secret "destination-network" "${DESTINATION_NETWORK}"
echo "KY7 AWS secrets updated. Autonomous live trading and withdrawals remain disabled."
