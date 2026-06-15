.PHONY: dev test build push clean logs status

# ─── Development ─────────────────────────────────────────────────────
dev:
	docker compose up -d
	@echo "\n✅ Stack running: http://localhost (nginx) | http://localhost:3000 (api) | http://localhost:5173 (vite)"

dev-logs:
	docker compose logs -f

stop:
	docker compose down

# ─── Testing ─────────────────────────────────────────────────────────
test:
	cd api && npm test -- --coverage --forceExit

test-watch:
	cd api && npm test -- --watch

lint:
	cd api && npm run lint
	cd frontend && npm run lint

# ─── Build & Push ────────────────────────────────────────────────────
GIT_SHA := $$(git rev-parse --short HEAD)
REGISTRY := ghcr.io/your-org

build:
	docker build -t $(REGISTRY)/ecom-api:$(GIT_SHA) ./api
	docker build -t $(REGISTRY)/ecom-frontend:$(GIT_SHA) ./frontend
	@echo "\n✅ Built images tagged with $(GIT_SHA)"

push: build
	docker push $(REGISTRY)/ecom-api:$(GIT_SHA)
	docker push $(REGISTRY)/ecom-frontend:$(GIT_SHA)
	@echo "\n✅ Pushed to $(REGISTRY)"

# ─── Utilities ───────────────────────────────────────────────────────
status:
	docker compose ps
	@echo "\nHealth:"
	@curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || echo "API not running"

clean:
	docker compose down -v --rmi local
	@echo "✅ Cleaned up volumes and local images"

# ─── DB ──────────────────────────────────────────────────────────────
db-shell:
	docker compose exec postgres psql -U ecom_user -d ecom

db-reset:
	docker compose down -v
	docker compose up -d postgres
	@echo "✅ Database reset — run 'make dev' to start the full stack"
