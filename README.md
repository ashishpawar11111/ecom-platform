# ecom-platform

A 3-tier e-commerce application built as a DevOps learning project across 6 phases.

## Architecture

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  React   │───▶│  Express │───▶│ Postgres │
│ Frontend │    │   API    │    │    DB    │
└──────────┘    └──────────┘    └──────────┘
```

## Quick Start

```bash
# Clone and start the full stack
git clone https://github.com/your-org/ecom-platform.git
cd ecom-platform
docker compose up -d

# Verify
curl http://localhost/health
curl http://localhost/api/products
```

## Phase Map

| Phase | Weeks  | Focus                           |
|-------|--------|---------------------------------|
| 1     | 1–7    | Containerised App + CI          |
| 2     | 8–13   | Terraform IaC                   |
| 3     | 14–16  | Ansible Configuration Mgmt      |
| 4     | 17–24  | Kubernetes + GitOps + SRE       |
| 5     | 25–28  | Splunk Observability            |
| 6     | 29–32  | Security, Vault, Backstage IDP  |

## Development

```bash
docker compose up          # uses override for dev mode
npm test --prefix api      # run API tests
```
