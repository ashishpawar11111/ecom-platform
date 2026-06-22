#!/bin/bash
# vault/secrets/seed.sh — run once to seed initial secrets
set -euo pipefail

echo "=== Enabling KV secrets engine ==="
vault secrets enable -path=secret kv-v2 || true

echo "=== Seeding DB credentials ==="
vault kv put secret/ecom/db \
  host="prod-ecom-db.xxxx.us-east-1.rds.amazonaws.com" \
  port=5432 \
  username="ecom_admin" \
  password="$(openssl rand -base64 32)" \
  dbname="ecom"

echo "=== Seeding API secrets ==="
vault kv put secret/ecom/api \
  jwt_secret="$(openssl rand -base64 64)" \
  splunk_hec_token="change-me"

echo "=== Enabling K8s auth ==="
vault auth enable kubernetes || true
vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc"

echo "=== Creating role ==="
vault write auth/kubernetes/role/ecom-api \
  bound_service_account_names=ecom-api \
  bound_service_account_namespaces=ecom \
  policies=ecom-api \
  ttl=1h

echo "=== Done ==="