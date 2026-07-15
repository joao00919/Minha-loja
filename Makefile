.PHONY: help install dev build test lint format clean docker-up docker-down migrate

help:
	@echo "📦 Bot Manager - Comandos Disponíveis"
	@echo ""
	@echo "Desenvolvimento:"
	@echo "  make install       - Instalar dependências"
	@echo "  make dev           - Iniciar em modo desenvolvimento"
	@echo "  make build         - Compilar TypeScript"
	@echo "  make lint          - Verificar código"
	@echo "  make format        - Formatar código"
	@echo ""
	@echo "Testes:"
	@echo "  make test          - Executar testes"
	@echo "  make test-watch    - Testes em watch mode"
	@echo "  make test-coverage - Testes com cobertura"
	@echo ""
	@echo "Banco de Dados:"
	@echo "  make migrate       - Executar migrations"
	@echo "  make migrate-dev   - Migrations em modo dev"
	@echo "  make prisma-studio - Abrir Prisma Studio"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up     - Iniciar containers"
	@echo "  make docker-down   - Parar containers"
	@echo "  make docker-logs   - Ver logs"
	@echo ""
	@echo "Utilidades:"
	@echo "  make clean         - Limpar arquivos gerados"
	@echo "  make register-dev  - Registrar comandos (dev)"
	@echo "  make register-global - Registrar comandos (global)"

install:
	npm install

npm run prisma:generate

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

lint-fix:
	npm run lint:fix

format:
	npm run format

test:
	npm test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

clean:
	rm -rf dist node_modules .prisma

migrate:
	npm run prisma:migrate

migrate-dev:
	npm run prisma:migrate

prisma-studio:
	npm run prisma:studio

docker-up:
	npm run docker:up

docker-down:
	npm run docker:down

docker-logs:
	docker-compose logs -f bot

register-dev:
	npm run commands:dev

register-global:
	npm run commands:global

start:
	npm start

validate:
	npm run prisma:validate
	typescript --noEmit
	tsc --noEmit
