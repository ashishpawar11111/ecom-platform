#!/usr/bin/env bash
# Week 1 task: configure iptables for a 3-tier app
# WEB_IP, APP_IP, DB_IP = the IPs of each tier (use 127.0.0.x for localhost testing)
# This exact logic maps to K8s NetworkPolicy in Week 19.
set -euo pipefail

WEB_IP="10.0.1.10"
APP_IP="10.0.2.10"
DB_IP="10.0.3.10"

log() { echo "[iptables-setup] $*"; }

# ── Flush existing rules (clean state) ──────────────────────
log "Flushing existing rules..."
iptables -F
iptables -X
iptables -Z

# ── Default policy: DROP everything ─────────────────────────
iptables -P INPUT   DROP
iptables -P FORWARD DROP
iptables -P OUTPUT  ACCEPT   # allow outbound by default

# ── Allow established/related connections ───────────────────
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -i lo -j ACCEPT   # loopback always allowed

# ── WEB TIER: accept HTTP/HTTPS from anywhere ────────────────
log "Web tier: allow 80/443 from anywhere"
iptables -A INPUT -d "$WEB_IP" -p tcp --dport 80  -j ACCEPT
iptables -A INPUT -d "$WEB_IP" -p tcp --dport 443 -j ACCEPT

# ── APP TIER: ONLY accept 8080 from web tier ─────────────────
log "App tier: allow 8080 only from web tier ($WEB_IP)"
iptables -A INPUT -d "$APP_IP" -p tcp --dport 8080 \
  -s "$WEB_IP" -j ACCEPT
iptables -A INPUT -d "$APP_IP" -p tcp --dport 8080 -j DROP

# ── DB TIER: ONLY accept 5432 from app tier ──────────────────
log "DB tier: allow 5432 only from app tier ($APP_IP)"
iptables -A INPUT -d "$DB_IP" -p tcp --dport 5432 \
  -s "$APP_IP" -j ACCEPT
iptables -A INPUT -d "$DB_IP" -p tcp --dport 5432 -j DROP

# ── SSH: allow from anywhere (management) ───────────────────
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# ── Verify and save ──────────────────────────────────────────
log "Final rules:"
iptables -L -n -v --line-numbers

# Persist across reboots
iptables-save > /etc/iptables/rules.v4
log "Done. Rules saved to /etc/iptables/rules.v4"