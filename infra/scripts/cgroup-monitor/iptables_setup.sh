#!/bin/bash
# Week 1 task: configure iptables for a 3-tier app
# Tiers: frontend (80/443), api (3000), db (5432)
# Run as root on the bastion/EC2 host
set -euo pipefail

FRONTEND_CIDR="0.0.0.0/0"        # public internet → nginx
API_CIDR="10.0.1.0/24"           # private subnet → api
DB_CIDR="10.0.2.0/24"            # db subnet
API_TO_DB="10.0.1.0/24"          # only api subnet reaches db

echo "==> Flushing existing rules"
iptables -F INPUT
iptables -F FORWARD
iptables -F OUTPUT

echo "==> Default: DROP inbound, ACCEPT outbound"
iptables -P INPUT   DROP
iptables -P FORWARD DROP
iptables -P OUTPUT  ACCEPT

echo "==> Allow established/related sessions (stateful)"
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

echo "==> Allow loopback"
iptables -A INPUT -i lo -j ACCEPT

echo "==> Tier 1: Frontend — HTTP/HTTPS from internet"
iptables -A INPUT -p tcp --dport 80  -s "$FRONTEND_CIDR" -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -s "$FRONTEND_CIDR" -j ACCEPT

echo "==> Tier 2: API — only reachable from private subnet"
iptables -A INPUT -p tcp --dport 3000 -s "$API_CIDR" -j ACCEPT

echo "==> Tier 3: DB — only reachable from API subnet"
iptables -A INPUT -p tcp --dport 5432 -s "$API_TO_DB" -j ACCEPT

echo "==> SSH — allow from admin IP only (replace with your IP)"
iptables -A INPUT -p tcp --dport 22 -s "203.0.113.0/24" -j ACCEPT

echo "==> ICMP ping — for health checks"
iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT

echo "==> Saving rules"
# Ubuntu/Debian:
iptables-save > /etc/iptables/rules.v4
echo "Done. Rules:"
iptables -L INPUT -n --line-numbers -v