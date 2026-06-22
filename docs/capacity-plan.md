# Capacity Plan

*Created: Week 24 — Based on VPA recommendations and chaos test data*

## Current Resource Usage (prod)

| Service | CPU Request | CPU Actual (p95) | Memory Request | Memory Actual (p95) |
|---------|------------|-------------------|----------------|---------------------|
| ecom-api | 100m | 85m | 128Mi | 110Mi |
| ecom-frontend | 50m | 15m | 64Mi | 42Mi |
| ecom-postgres | 250m | 180m | 256Mi | 220Mi |

## VPA Recommendations

| Service | CPU Request | Memory Request |
|---------|------------|----------------|
| ecom-api | 150m | 160Mi |
| ecom-frontend | 25m | 48Mi |
| ecom-postgres | 200m | 280Mi |

## Node Sizing
- Current: 3x t3.medium (2 vCPU, 4 GiB)
- Recommended: 3x t3.large (2 vCPU, 8 GiB) — allows for burst capacity
- Phase 6: Karpenter will auto-select instance types based on pending pod requirements
