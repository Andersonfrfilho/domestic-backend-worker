###############################################################################
# ZOLVE Worker — Makefile
###############################################################################

.PHONY: help infra worker-up down infra-down infra-logs infra-ps \
        dev migrate migrate-show migrate-revert \
        test test-watch test-cov test-e2e test-all \
        lint format flows \
        shell-db shell-mongo shell-rabbit \
        clean

COMPOSE = docker compose -f docker-compose.yml
ENV_FILE = .env
COMPOSE_PROJECT_NAME ?= domestic
LEGACY_COMPOSE_PROJECT_NAME ?= domestic-backend-api
WORKER_CONTAINER_NAME ?= domestic_backend_worker
POSTGRES_CONTAINER_NAME ?= domestic_database_postgres
MONGO_CONTAINER_NAME ?= domestic_database_mongo
RABBITMQ_CONTAINER_NAME ?= domestic_queue_rabbitmq
MAILPIT_CONTAINER_NAME ?= worker_mailpit

# Cria .env a partir do exemplo se ainda não existir
$(ENV_FILE):
	@echo "Criando $(ENV_FILE) a partir de .env.example..."
	cp .env.example .env
	@echo ".env criado. Revise as credenciais antes de continuar."

# ─── Help ─────────────────────────────────────────────────────────────────

help: ## Mostra esta mensagem de ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Infra ────────────────────────────────────────────────────────────────

infra: $(ENV_FILE) ## Sobe postgres, mongo, rabbitmq e mailpit (apenas o que faltar)
	@missing_services=""; \
	for pair in \
		"database_postgres:$(POSTGRES_CONTAINER_NAME)" \
		"database_mongo:$(MONGO_CONTAINER_NAME)" \
		"queue_rabbitmq:$(RABBITMQ_CONTAINER_NAME)" \
		"mailpit:$(MAILPIT_CONTAINER_NAME)"; do \
		service="$${pair%%:*}"; \
		container_name="$${pair#*:}"; \
		container_project="$$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.project" }}' "$$container_name" 2>/dev/null || true)"; \
		container_running="$$(docker inspect -f '{{.State.Running}}' "$$container_name" 2>/dev/null || true)"; \
		if [ "$$container_running" = "true" ] && [ "$$container_project" = "$(COMPOSE_PROJECT_NAME)" ]; then \
			echo "✔ $$service já está no ar em '$$container_name' (project=$(COMPOSE_PROJECT_NAME))"; \
		else \
			if [ -n "$$container_project" ] && [ "$$container_project" != "$(COMPOSE_PROJECT_NAME)" ]; then \
				echo "↻ Migrando '$$container_name' de project=$$container_project para project=$(COMPOSE_PROJECT_NAME)"; \
				docker rm -f "$$container_name" >/dev/null; \
			fi; \
			missing_services="$$missing_services $$service"; \
		fi; \
	done; \
	if [ -n "$$missing_services" ]; then \
		echo "Subindo serviços ausentes:$$missing_services"; \
		COMPOSE_IGNORE_ORPHANS=True \
		POSTGRES_CONTAINER_NAME=$(POSTGRES_CONTAINER_NAME) \
		MONGO_CONTAINER_NAME=$(MONGO_CONTAINER_NAME) \
		RABBITMQ_CONTAINER_NAME=$(RABBITMQ_CONTAINER_NAME) \
		MAILPIT_CONTAINER_NAME=$(MAILPIT_CONTAINER_NAME) \
		COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) $(COMPOSE) up -d $$missing_services; \
	else \
		echo "Todos os serviços já estão no ar (API/worker compartilhando a mesma infra)."; \
	fi
	@echo ""
	@echo "Infra no ar:"
	@echo "  PostgreSQL  → localhost:5432"
	@echo "  MongoDB     → localhost:27017"
	@echo "  RabbitMQ    → localhost:5672  (management: http://localhost:15672)"
	@echo "  Mailpit     → http://localhost:8025"

worker-up: $(ENV_FILE) ## Sobe o container do worker (apenas se faltar)
	@container_project="$$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.project" }}' "$(WORKER_CONTAINER_NAME)" 2>/dev/null || true)"; \
	container_running="$$(docker inspect -f '{{.State.Running}}' "$(WORKER_CONTAINER_NAME)" 2>/dev/null || true)"; \
	if [ "$$container_running" = "true" ] && [ "$$container_project" = "$(COMPOSE_PROJECT_NAME)" ]; then \
		echo "✔ backend_worker já está no ar em '$(WORKER_CONTAINER_NAME)' (project=$(COMPOSE_PROJECT_NAME))"; \
	else \
		if [ -n "$$container_project" ] && [ "$$container_project" != "$(COMPOSE_PROJECT_NAME)" ]; then \
			echo "↻ Migrando '$(WORKER_CONTAINER_NAME)' de project=$$container_project para project=$(COMPOSE_PROJECT_NAME)"; \
			docker rm -f "$(WORKER_CONTAINER_NAME)" >/dev/null; \
		fi; \
		echo "Subindo backend_worker..."; \
		COMPOSE_IGNORE_ORPHANS=True \
		WORKER_CONTAINER_NAME=$(WORKER_CONTAINER_NAME) \
		POSTGRES_CONTAINER_NAME=$(POSTGRES_CONTAINER_NAME) \
		MONGO_CONTAINER_NAME=$(MONGO_CONTAINER_NAME) \
		RABBITMQ_CONTAINER_NAME=$(RABBITMQ_CONTAINER_NAME) \
		MAILPIT_CONTAINER_NAME=$(MAILPIT_CONTAINER_NAME) \
		COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) $(COMPOSE) up -d backend_worker; \
	fi

down: ## Para e remove os containers (mantém volumes)
	COMPOSE_IGNORE_ORPHANS=True COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) $(COMPOSE) down

infra-down: down ## Alias legado para down

infra-logs: ## Tail de todos os logs da infra
	COMPOSE_IGNORE_ORPHANS=True COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) $(COMPOSE) logs -f

infra-ps: ## Mostra status dos containers
	COMPOSE_IGNORE_ORPHANS=True COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) $(COMPOSE) ps

# ─── Desenvolvimento ──────────────────────────────────────────────────────

dev: $(ENV_FILE) ## Inicia o worker em modo watch (requer infra no ar)
	npm run start:dev

# ─── Migrations ───────────────────────────────────────────────────────────

migrate: ## Aplica as migrations pendentes
	npm run migration:run

migrate-show: ## Mostra status das migrations
	npm run migration:show

migrate-revert: ## Reverte a última migration
	npm run migration:revert

migrate-generate: ## Gera nova migration a partir das entidades
	npm run migration:generate

# ─── Testes ───────────────────────────────────────────────────────────────

test: ## Roda os testes unitários
	npm run test:unit

test-watch: ## Roda testes unitários em modo watch
	npm run test:unit:watch

test-cov: ## Roda testes unitários com cobertura
	npm run test:unit:cov

test-e2e: ## Roda os testes E2E (requer infra no ar)
	npm run test:e2e:migration && npm run test:e2e

test-all: ## Roda todos os testes (unit + e2e)
	npm run test:all

# ─── Qualidade de código ──────────────────────────────────────────────────

lint: ## Corrige problemas de lint e ordem de imports
	npm run lint

format: ## Formata com Prettier e corrige lint
	npm run format:all

# ─── Flow tests ───────────────────────────────────────────────────────────

flows: ## Roda todos os flow tests (requer ambiente rodando)
	npm run flows

flows-worker: ## Roda apenas o flow test do worker
	npm run flows:worker

# ─── Shells ───────────────────────────────────────────────────────────────

shell-db: ## psql no banco postgres
	COMPOSE_IGNORE_ORPHANS=True COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) $(COMPOSE) exec database_postgres psql -U $${POSTGRES_USER:-zolve} -d $${POSTGRES_DB:-zolve}

shell-mongo: ## mongosh no MongoDB
	COMPOSE_IGNORE_ORPHANS=True COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) $(COMPOSE) exec database_mongo mongosh

shell-rabbit: ## rabbitmqctl no RabbitMQ
	COMPOSE_IGNORE_ORPHANS=True COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) $(COMPOSE) exec queue_rabbitmq rabbitmqctl status

# ─── Limpeza ──────────────────────────────────────────────────────────────

clean: ## Remove volumes da stack (use após `make down`)
	COMPOSE_IGNORE_ORPHANS=True COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) $(COMPOSE) down -v
	@if docker network inspect "$(LEGACY_COMPOSE_PROJECT_NAME)_default" >/dev/null 2>&1; then \
		if [ "$$(docker network inspect "$(LEGACY_COMPOSE_PROJECT_NAME)_default" --format '{{len .Containers}}')" = "0" ]; then \
			echo "Removendo rede legada: $(LEGACY_COMPOSE_PROJECT_NAME)_default"; \
			docker network rm "$(LEGACY_COMPOSE_PROJECT_NAME)_default" >/dev/null; \
		fi; \
	fi

all: infra worker-up ## Sobe infra + backend_worker de forma segura (apenas o que faltar)
	@echo "✅ Stack do Worker verificada com sucesso!"

