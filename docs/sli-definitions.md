"tok-comment"># SLI Definitions
 
*Created: Week 8 — This document is the connecting thread across phases 1 → 4 → 5*
 
"tok-comment">## SLI 1: Availability
- **Definition**: Ratio of successful HTTP requests (non-5xx) to total requests
- **Target SLO**: 99.9% over 30 days
- **Measurement**: `sum(rate(http_requests_total{status!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`
- **Phase 4**: Implemented as Prometheus recording rule
- **Phase 5**: Splunk SPL query in SLI dashboard
 
"tok-comment">## SLI 2: Latency
- **Definition**: p99 HTTP response time
- **Target SLO**: < 500ms
- **Measurement**: `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
- **Phase 4**: Prometheus recording rule + alert
- **Phase 5**: Splunk p99 panel
 
"tok-comment">## SLI 3: Correctness
- **Definition**: Ratio of successfully confirmed orders to total order attempts
- **Target SLO**: 99.5%
- **Measurement**: `sum(rate(orders_total{status="confirmed"}[5m])) / sum(rate(orders_total[5m]))`
- **Phase 4**: Prometheus recording rule
- **Phase 5**: Splunk single-value panel
 
"tok-comment">## Alerting Strategy
- Multi-window burn rate (see monitoring/alerts.yaml)
- Fast burn: 1h window, fires in 2 min
- Slow burn: 6h window, fires in 15 min
 
