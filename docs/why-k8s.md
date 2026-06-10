"tok-comment"># Why Kubernetes?
 
*Created: Week 6*
 
"tok-comment">## Docker Compose Gaps
 
After running the 3-tier app with Docker Compose, we identified these gaps:
 
1. **No auto-healing** — if a container crashes, Compose restarts it but doesn't reschedule elsewhere
2. **No horizontal scaling** — `docker compose scale` works locally but has no load balancer integration
3. **No rolling updates** — updates cause downtime
4. **No resource limits enforcement** — Compose resource limits are advisory
5. **No network policies** — all containers can talk to all containers
6. **Single-host** — can't survive a host failure
 
"tok-comment">## K8s Addresses These
 
| Gap | K8s Solution |
|-----|-------------|
| Auto-healing | kubelet restarts, ReplicaSet reschedules |
| Scaling | HPA based on CPU/memory/custom metrics |
| Rolling updates | Deployment strategy: RollingUpdate |
| Resource limits | LimitRange + ResourceQuota enforcement |
| Network segmentation | NetworkPolicy (deny-all + explicit allow) |
| Multi-host | Pods scheduled across nodes in multiple AZs |
 
"tok-comment">## Migration Plan
- Phase 4 (weeks 17–24): Migrate from ECS Fargate → EKS
- Helm charts parameterise the base manifests
- ArgoCD provides GitOps-style continuous deployment
 
