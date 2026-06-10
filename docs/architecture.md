# Architecture

`ecom-platform` separates application delivery, infrastructure provisioning, cluster operations, and observability into explicit monorepo domains.

The API and frontend can run locally with Docker Compose, then graduate to Kubernetes through Helm, Kustomize, and Argo CD.
