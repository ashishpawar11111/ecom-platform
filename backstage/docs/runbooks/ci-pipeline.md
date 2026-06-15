  "tok-comment"># CI Pipeline Runbook
 
*Created: Week 7*
 
"tok-comment">## Overview
The CI pipeline runs on every push to `main` and on all PRs.
 
"tok-comment">## Pipeline Steps
1. **Lint** — ESLint for code quality
2. **Test** — Jest with coverage (>80% required)
3. **Semgrep** — SAST scanning for vulnerabilities
4. **Build** — Docker multi-stage build
5. **Push** — Push to GitHub Container Registry
6. **Trivy** — Container vulnerability scan
 
"tok-comment">## Troubleshooting
 
"tok-comment">### Tests failing
```bash
"tok-comment"># Run tests locally
cd api && npm test -- --verbose
```
 
"tok-comment">### Docker build failing
```bash
"tok-comment"># Test build locally
docker build --no-cache -t ecom-api:test ./api
```
 
"tok-comment">### Trivy HIGH/CRITICAL findings
1. Check if it's a base image issue: `trivy image node:20-alpine`
2. If app dependency: update in package.json and re-run
3. If false positive: add to `.trivyignore`
 
