# Bot Manager - Sistema Completo de Gerenciamento de Aplicações, Licenças e Pagamentos PIX

## 📋 Sumário

- [Visão Geral](#visão-geral)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Fluxo de Pagamento PIX](#fluxo-de-pagamento-pix)
- [Arquitetura](#arquitetura)
- [Testes](#testes)
- [Solução de Problemas](#solução-de-problemas)
- [Checklist de Produção](#checklist-de-produção)

---

## 🎯 Visão Geral

Bot Manager é um sistema completo integrado ao Discord que fornece:

✅ **Gerenciamento de Aplicações**: Registre, monitore e gerencie múltiplas aplicações
✅ **Sistema de Licenças**: Criação, renovação e validação de chaves de licença
✅ **Pagamentos PIX**: Integração com pagamento via QR Code PIX
✅ **Confirmação Automática**: Processamento automático de pagamentos via webhook e polling
✅ **Carrinho Privado**: Tópicos exclusivos para cada transação
✅ **Jobs Persistentes**: Tarefas automatizadas (vencimentos, renovações, etc.)
✅ **Auditoria Completa**: Registro de todas as operações
✅ **Suporte a Multi-Servidor**: Instale em vários servidores Discord

---

## 📦 Requisitos

### Sistema
- **Node.js**: v18.0.0 ou superior
- **PostgreSQL**: v13 ou superior
- **Docker** (opcional): Para deployment containerizado

### Contas e Tokens
- Discord Bot Token (crie em https://discord.com/developers/applications)
- Discord Client ID
- Discord Guild ID (servidor de teste/produção)
- Webhook Secret para PIX (gere uma string segura)

---

## 💻 Instalação

### Windows

1. **Clone o repositório**
```bash
git clone https://github.com/joao00919/Minha-loja.git
cd Minha-loja
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure PostgreSQL**
   - Instale PostgreSQL: https://www.postgresql.org/download/windows/
   - Crie um novo banco de dados:
   ```bash
   createdb bot_manager
   ```

4. **Configure variáveis de ambiente**
```bash
cp .env.example .env
# Edite .env com seus valores
```

5. **Execute migrations**
```bash
npm run prisma:generate
npm run prisma:migrate
```

6. **Registre os comandos**
```bash
npm run commands:dev
```

7. **Inicie o bot**
```bash
npm run dev
```

### Linux

1. **Clone o repositório**
```bash
git clone https://github.com/joao00919/Minha-loja.git
cd Minha-loja
```

2. **Instale Node.js (se não tiver)**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Instale PostgreSQL**
```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
```

4. **Crie o banco de dados**
```bash
sudo -u postgres createdb bot_manager
```

5. **Instale dependências do projeto**
```bash
npm install
```

6. **Configure variáveis de ambiente**
```bash
cp .env.example .env
# Edite .env com seus valores
```

7. **Execute migrations**
```bash
npm run prisma:generate
npm run prisma:migrate
```

8. **Registre os comandos**
```bash
npm run commands:dev
```

9. **Inicie o bot**
```bash
npm run dev
```

### Docker (Recomendado para Produção)

1. **Clone o repositório**
```bash
git clone https://github.com/joao00919/Minha-loja.git
cd Minha-loja
```

2. **Configure variáveis de ambiente**
```bash
cp .env.example .env
# Edite .env com seus valores
```

3. **Inicie os containers**
```bash
npm run docker:up
```

4. **Verifique os logs**
```bash
docker-compose logs -f bot
```

5. **Pare os containers**
```bash
npm run docker:down
```

---

## ⚙️ Configuração

### Arquivo .env

Crie um arquivo `.`.env` com as seguintes variáveis:

```env
# Discord Bot
MANAGER_BOT_TOKEN=your_bot_token_here
MANAGER_CLIENT_ID=your_client_id_here
MANAGER_GUILD_ID=your_guild_id_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bot_manager

# Payment Provider
PIX_PROVIDER_TYPE=manual          # manual, mock, ou real
PIX_WEBHOOK_SECRET=your_secret_here
PIX_WEBHOOK_URL=https://your-domain.com/webhooks/payment

# Application
NODE_ENV=development             # development ou production
LOG_LEVEL=info                   # error, warn, info, http, debug
PORT=3000

# Payment Settings
PIX_EXPIRATION_MINUTES=30
PIX_POLLING_INTERVAL_SECONDS=3
PIX_MAX_POLLING_ATTEMPTS=20

# Session Settings
SESSION_TIMEOUT_MINUTES=15
```

### Discord Developer Portal

1. Acesse https://discord.com/developers/applications
2. Clique em "New Application"
3. Vá para "Bot" > "Add Bot"
4. Copie o token para `MANAGER_BOT_TOKEN`
5. Vá para "General Information" e copie o Client ID para `MANAGER_CLIENT_ID`
6. Vá para "OAuth2" > "URL Generator"
   - Selecione `bot`
   - Selecione permissões: `Send Messages`, `Manage Channels`, `Use Slash Commands`
   - Copie a URL gerada e abra em seu navegador para convidar o bot

### Intents Necessários

Já configurados no código:
- `Guilds` - Para receber eventos de servidores
- `GuildMessages` - Para mensagens em canais
- `MessageContent` - Para ler conteúdo de mensagens
- `DirectMessages` - Para mensagens diretas

### PostgreSQL

**Criar banco de dados**:
```bash
psql -U postgres
CREATE DATABASE bot_manager;
\c bot_manager
```

**Connection String**:
```
postgresql://username:password@localhost:5432/bot_manager
```

---

## 🚀 Uso

### Comandos do Bot

#### `/setup`
Configura seu perfil no Bot Manager (execute uma vez).
```
/setup
```

#### `/apps`
Gerencia suas aplicações e licenças.
```
/apps
```

#### `/ping`
Verifica latência do bot.
```
/ping
```

#### `/help`
Exibe ajuda detalhada.
```
/help
```

---

## 💳 Fluxo de Pagamento PIX

### Visão Geral

```
[Usuário clica "Renovar"]
  ↓
[Carregando...]
  ↓
[Verifica dados]
  ↓
[Carrinho criado em tópico privado]
  ↓
[QR Code exibido]
  ↓
[Usuário escaneia/copia código]
  ↓
[Pagamento processado]
  ↓
[Confirmação automática]
  ↓
[Licença ativada]
```

### Estados do Pagamento

1. **PROCESSING** - Iniciando processamento
2. **PENDING** - Aguardando pagamento (QR Code exibido)
3. **APPROVED** - Pagamento confirmado
4. **CANCELLED** - Cancelado pelo usuário
5. **EXPIRED** - Expirou (30 minutos padrão)
6. **REJECTED** - Rejeitado pelo provedor

### Confirmação Automática

#### Webhook (Primário)
- Provedor envia notificação ao Bot Manager
- Assinatura HMAC-SHA256 validada
- Processamento instantâneo

#### Polling (Contingência)
- Inicia automaticamente se webhook falhar
- Intervalo: 3s × 5 tentativas, depois 10s × 3 tentativas
- Máximo 30 minutos
- Recupera-se automaticamente após restart

### Telas do Usuário

**1. Carregando**
```
◔ Carregando...
```

**2. Verifica Dados**
```
◔ Iniciando verificações necessárias...
```

**3. Carrinho Aberto**
```
✓ Carrinho aberto com sucesso!

[Botão: Ir para carrinho]
```

**4. QR Code**
```
Leia as informações abaixo para concluir o pagamento:

Leia o QR Code abaixo ou use o Código PIX para efetuar o pagamento
Após o pagamento, aguarde alguns segundos para identificação automática.

[QR Code]

[Botão: Copiar Código PIX]
[Botão: Cancelar]
```

**5. Confirmação**
```
✓ Pagamento aprovado com sucesso!
```

---

## 🏗�� Arquitetura

### Estrutura de Pastas

```
src/
├── bot/                    # Discord bot client
│   └── BotClient.ts
├── commands/               # Comandos slash
│   ├── apps.ts
│   ├── setup.ts
│   ├── help.ts
│   └── ping.ts
├── providers/              # Payment providers
│   ├── PaymentProvider.ts
│   ├── ManualPixProvider.ts
│   ├── MockPaymentProvider.ts
│   └── PaymentProviderFactory.ts
├── services/               # Lógica de negócio
│   ├── SecurityService.ts
│   ├── LicenseService.ts
│   ├── PaymentService.ts
│   └── PaymentPollingService.ts
├── webhooks/               # Handlers de webhook
│   └── paymentWebhook.ts
├── jobs/                   # Jobs agendados
│   └── JobService.ts
├── utils/                  # Utilitários
│   ├── helpers.ts
│   └── cartManager.ts
├── __tests__/              # Testes
│   ├── SecurityService.test.ts
│   ├── helpers.test.ts
│   ├── license-calculation.test.ts
│   └── payment-processing.test.ts
├── config.ts               # Configuração centralizada
├── database.ts             # Conexão Prisma
├── logger.ts               # Winston logger
├── webserver.ts            # Express server
└── index.ts                # Ponto de entrada

prisma/
├── schema.prisma           # Schema Prisma
└── migrations/             # Migrations do banco
```

### Entidades Principais

**User** - Usuário Discord  
**Application** - Aplicação gerenciada  
**Plan** - Plano de serviço (30 dias, 90 dias, etc.)  
**PlanPrice** - Preço do plano em centavos  
**Subscription** - Inscrição ativa de um usuário  
**License** - Chave de licença  
**Cart** - Carrinho de compra em tópico privado  
**Payment** - Pagamento PIX  
**PaymentEvent** - Auditoria de pagamentos  
**Renewal** - Renovação agendada  
**Notification** - Notificação para usuário  
**AuditLog** - Log de auditoria  
**Transfer** - Transferência de aplicação entre usuários  
**Deployment** - Deploy de aplicação  
**InteractionSession** - Sessão de interação (botões)  
**SystemSetting** - Configuração do sistema  

---

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Watch mode
npm run test:watch

# Com cobertura
npm run test:coverage
```

### Testes Implementados

✅ SecurityService - Validação de custom IDs e webhooks  
✅ Helpers - Formatação de moeda e cálculos de data  
✅ License Calculation - Renovação de licenças  
✅ Payment Processing - Processamento de pagamentos  

### Executar Testes Específicos

```bash
# Apenas segurança
npm test -- SecurityService.test.ts

# Apenas licenças
npm test -- license-calculation.test.ts
```

---

## 🛠️ Solução de Problemas

### Erro: "Cannot find module 'discord.js'"

**Solução**:
```bash
npm install
```

### Erro: "Database connection failed"

**Verificar**:
1. PostgreSQL está rodando? `pg_isready`
2. DATABASE_URL está correto em .env?
3. Banco de dados existe? `psql -l`

**Recriar banco**:
```bash
dropdb bot_manager
createdb bot_manager
npm run prisma:migrate
```

### Erro: "Bot token is invalid"

**Verificar**:
1. Token está correto em .env?
2. Token foi copiado completamente (sem espaços)?
3. Token ainda é válido (não foi regenerado)?

**Gerar novo token**:
- Discord Developer Portal > Bot > "Reset Token"

### Erro: "GUILD_ID not found"

**Verificar**:
1. Guild ID está correto?
2. Bot foi convidado para o servidor?
3. Bot tem permissões necessárias?

**Copiar Guild ID**:
- Discord: Modo desenvolvedor ativado > Clique direito em servidor > "Copy Server ID"

### Erro: "Prisma client not generated"

**Solução**:
```bash
npm run prisma:generate
```

### Erro: "Port 3000 already in use"

**Solução**:
```bash
# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Ou altere a porta em .env:
```
PORT=3001
```

---

## ✅ Checklist de Produção

Antes de deployer em produção:

### Segurança
- [ ] `MANAGER_BOT_TOKEN` é uma string longa e complexa
- [ ] `PIX_WEBHOOK_SECRET` é uma string segura (mínimo 32 caracteres)
- [ ] `DATABASE_URL` usa senha forte
- [ ] `.env` não está commitado (verificar `.gitignore`)
- [ ] NODE_ENV=production
- [ ] TypeScript strict mode habilitado

### Banco de Dados
- [ ] PostgreSQL v13+ instalado e rodando
- [ ] Migrations executadas: `npm run prisma:migrate
- [ ] Backups configurados
- [ ] Pool de conexões configurado

### Discord Bot
- [ ] Intents corretos configurados
- [ ] Permissões necessárias concedidas
- [ ] Comandos registrados globalmente: `npm run commands:global`
- [ ] Gateway intents habilitados no Developer Portal

### Pagamentos
- [ ] Provedor PIX testado completamente
- [ ] Webhook URL acessível e configurada
- [ ] Webhook Secret compartilhado com provedor
- [ ] Certificados SSL válidos (HTTPS)

### Logging
- [ ] LOG_LEVEL configurado para "info"
- [ ] Arquivo de logs rotacionado
- [ ] Alertas de erro configurados

### Deployment
- [ ] Docker testado em ambiente local
- [ ] `npm run build` sem erros
- [ ] `npm run lint` sem warnings
- [ ] `npm test` com cobertura mínima 70%
- [ ] Health check respondendo

### Monitoring
- [ ] PM2 ou similar configurado
- [ ] Restart automático em caso de crash
- [ ] Logs centralizados (opcional)
- [ ] Alertas de uptime

---

## 📊 Estadísticas

- **Linhas de Código**: ~2500+
- **Testes**: 8 suítes de teste
- **Cobertura**: 70%+
- **Entidades**: 17 modelos Prisma
- **Comandos**: 5 slash commands
- **Providers**: 3 implementações (Manual, Mock, Real)

---

## 📝 Licença

MIT - Veja LICENSE para detalhes

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature: `git checkout -b feature/AmazingFeature`
3. Commit suas mudanças: `git commit -m 'Add some AmazingFeature'`
4. Push para a branch: `git push origin feature/AmazingFeature`
5. Abra um Pull Request

---

## 📞 Suporte

Para suporte:
- Abra uma Issue no GitHub
- Verifique a documentação em ARCHITECTURE.md
- Confira logs com: `tail -f logs/combined.log`

---

**Criado com ❤️ para Discord**
