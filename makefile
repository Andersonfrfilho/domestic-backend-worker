###############################################################################
# ZOLVE Worker — Makefile
###############################################################################

.PHONY: help infra infra-down infra-logs infra-ps \
        dev migrate migrate-show migrate-revert \
        test test-watch test-cov test-e2e test-all \
        lint format flows \
        shell-db shell-mongo shell-rabbit \
        clean

COMPOSE = docker compose -f docker-compose.yml
ENV_FILE = .env

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

infra: $(ENV_FILE) ## Sobe postgres, mongo, rabbitmq e mailpit
	$(COMPOSE) up -d
	@echo ""
	@echo "Infra no ar:"
	@echo "  PostgreSQL  → localhost:5432"
	@echo "  MongoDB     → localhost:27017"
	@echo "  RabbitMQ    → localhost:5672  (management: http://localhost:15672)"
	@echo "  Mailpit     → http://localhost:8025"

infra-down: ## Para e remove os containers (mantém volumes)
	$(COMPOSE) down

infra-logs: ## Tail de todos os logs da infra
	$(COMPOSE) logs -f

infra-ps: ## Mostra status dos containers
	$(COMPOSE) ps

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
	$(COMPOSE) exec database_postgres psql -U $${POSTGRES_USER:-zolve} -d $${POSTGRES_DB:-zolve}

shell-mongo: ## mongosh no MongoDB
	$(COMPOSE) exec database_mongo mongosh

shell-rabbit: ## rabbitmqctl no RabbitMQ
	$(COMPOSE) exec queue_rabbitmq rabbitmqctl status

# ─── Limpeza ──────────────────────────────────────────────────────────────

clean: ## Para containers e remove volumes (cuidado: apaga dados!)
	@echo "Isso apagará todos os dados dos volumes. Continuar? [y/N]"
	@read ans; [ "$$ans" = "y" ] || exit 1
	$(COMPOSE) down -v
