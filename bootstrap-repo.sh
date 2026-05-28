#!/usr/bin/env bash
# Week 2: bootstrap the ecom-platform mono-repo structure
# Run once after: git clone git@github.com:YOU/ecom-platform.git && cd ecom-platform
set -euo pipefail

echo "==> Creating directory structure..."

# Phase 1 — app source
mkdir -p api/src/routes api/__tests__
mkdir -p frontend/src/pages

# Phase 1 — infrastructure scripts
mkdir -p infra/scripts/cgroup-monitor

# Phase 2 — Terraform
mkdir -p infra/terraform/modules/vpc
mkdir -p infra/terraform/modules/ecs
mkdir -p infra/terraform/modules/rds
mkdir -p infra/terraform/modules/alb
mkdir -p infra/terraform/modules/eks
mkdir -p infra/terraform/envs/dev
mkdir -p infra/terraform/envs/staging
mkdir -p infra/terraform/envs/prod
mkdir -p infra/terraform/backends

# Phase 3 — Ansible
mkdir -p infra/ansible/inventory
mkdir -p infra/ansible/roles/os-hardening/tasks
mkdir -p infra/ansible/roles/os-hardening/molecule/default
mkdir -p infra/ansible/roles/users-and-keys/tasks
mkdir -p infra/ansible/roles/rds-config/tasks
mkdir -p infra/ansible/roles/log-shipper/tasks
mkdir -p infra/ansible/roles/log-shipper/vars
mkdir -p infra/ansible/roles/k8s-node-prep/tasks
mkdir -p infra/ansible/roles/remediate-oom/tasks
mkdir -p infra/ansible/awx/job-templates
mkdir -p infra/ansible/vars

# Phase 4 — Kubernetes
mkdir -p k8s/base
mkdir -p k8s/helm/ecom-api/templates/tests
mkdir -p k8s/helm/ecom-frontend/templates
mkdir -p k8s/policies
mkdir -p k8s/kustomize/base
mkdir -p k8s/kustomize/overlays/dev
mkdir -p k8s/kustomize/overlays/prod

# Phase 4 — ArgoCD + monitoring
mkdir -p argocd/apps
mkdir -p argocd/rollouts
mkdir -p monitoring/grafana
mkdir -p monitoring/chaos

# Phase 5 — Splunk + OTel
mkdir -p splunk/dashboards
mkdir -p splunk/itsi

# Phase 6 — Vault, Falco, Backstage
mkdir -p vault/policies
mkdir -p vault/auth
mkdir -p vault/secrets
mkdir -p falco/rules
mkdir -p backstage/templates/new-microservice/skeleton/.github/workflows
mkdir -p backstage/templates/new-microservice/skeleton/helm
mkdir -p backstage/docs/runbooks

# Project docs
mkdir -p docs
mkdir -p .github/workflows

echo "==> Creating .gitkeep files so empty dirs are tracked..."
find . -type d -empty -not -path './.git/*' | \
  xargs -I{} touch {}/.gitkeep

echo "==> Installing git hooks..."
cp .githooks/commit-msg  .git/hooks/commit-msg
cp .githooks/pre-commit  .git/hooks/pre-commit
chmod +x .git/hooks/commit-msg .git/hooks/pre-commit

echo "==> Creating root files..."
cat > .gitignore << 'EOF'
node_modules/
.env
*.tfstate
*.tfstate.backup
.terraform/
.DS_Store
dist/
coverage/
__pycache__/
*.pyc
.vault_pass
kubeconfig
EOF

cat > README.md << 'EOF'
# ecom-platform

3-tier e-commerce platform (Node API + React + PostgreSQL).
Built progressively across a 7-month DevOps learning spine project.

## Phase map
| Phase | Tools | Weeks |
|-------|-------|-------|
| 1 | Linux, Git, Docker, CI/CD | 1–8 |
| 2 | Terraform | 9–13 |
| 3 | Ansible | 14–17 |
| 4 | Kubernetes, Helm, ArgoCD | 18–24 |
| 5 | Splunk, OpenTelemetry | 25–28 |
| 6 | Vault, Falco, Backstage | 29–32 |
EOF

echo "==> First commit..."
git add -A
git commit -S -m "feat: initial repo scaffold — ecom-platform mono-repo structure"
git push origin main

echo "Done. Run: git log --oneline --show-signature"
