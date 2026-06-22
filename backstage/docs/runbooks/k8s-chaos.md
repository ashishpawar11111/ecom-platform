# Kubernetes Chaos Testing Results

*Created: Week 24*

## Experiments Run

### 1. Node Failure
- **Tool**: Chaos Mesh PhysicalMachineChaos
- **Result**: PDB held — at least 1 pod always available
- **RTO**: 47 seconds (pod rescheduled to healthy node)

### 2. Random Pod Kill
- **Tool**: Chaos Mesh PodChaos
- **Result**: New pod ready in 12 seconds
- **RTO**: 12 seconds

### 3. Network Partition (API ↔ Postgres)
- **Tool**: Chaos Mesh NetworkChaos
- **Result**: /health/db returned 503, orders failed with clear error message
- **Recovery**: Automatic when partition removed (0s manual intervention)
- **Alert fired**: Yes — EcomHighErrorBurnRate within 2 min

## Recommendations
- Current HPA min=2 is sufficient for single-node failure
- Consider increasing to min=3 for multi-AZ resilience
- Add VPA recommendations to right-size pods (see capacity-plan.md)
