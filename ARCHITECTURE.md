# Bot Manager - Arquitetura Completa

## 1. Visão Geral

Bot Manager é um sistema completo de gerenciamento de aplicações, licenças e pagamentos via PIX integrado com Discord. Funciona como um gateway centralizado para controlar múltiplas aplicações, renovações de licenças e processamento de pagamentos.

## 2. Stack Tecnológico

- **Runtime**: Node.js (v18+) com TypeScript
- **Framework Bot**: discord.js v14
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Validação**: Zod
- **Logging**: Winston
- **Testing**: Jest
- **CI/CD**: Docker
- **Provedor PIX**: Implementação modular (Manual, Mock, Real)

## 3. Fluxo de Pagamento PIX (Principal)

### 3.1 Fase 1: Processamento
```
[Usuário clica "Pagar com PIX"]
  → Lock: adquire trava de processamento
  → Edita msg: "◔ Aguarde um momento, estamos processando..."
  → Cria Payment no DB (status: PROCESSING)
  → Cria idempotency key
  → Chama provedor: createPixPayment()
    - Retorna: qrCode, pixCode, externalPaymentId
  → Valida retorno
  → Atualiza Payment: status → PENDING
  → Inicia polling
  → Lock: libera
```

### 3.2 Fase 2: Exibição (Tela Única Editável)
```
[QR Code]
  → "Leia as informações abaixo para concluir o pagamento:"
  → "Leia o QR Code abaixo ou use o Código PIX para efetuar o pagamento"
  → "Após o pagamento, aguarde alguns segundos para identificação automática."
  → QR Code (imagem grande)
  → Botões:
    - "Copiar Código PIX"
    - "Cancelar"
  → NÃO exibir: "Verificar pagamento", "Já paguei", etc.
```

### 3.3 Fase 3: Cancelamento
```
[Usuário clica "Cancelar"]
  → Valida proprietário
  → Lock: adquire trava
  → Edita msg: "◔ Aguarde um momento, estamos cancelando..."
  → Chama provedor: cancelPayment()
  → Atualiza Payment: status → CANCELLED
  → Para polling
  → Invalida sessão
  → Edita msg final: "✓ Pagamento cancelado com sucesso!"
  → Lock: libera
```

### 3.4 Fase 4: Confirmação Automática
```
WEBHOOK (Primário)
  → Valida assinatura HMAC-SHA256
  → Valida timestamp
  → Impede replay (eventId)
  → Marca APPROVED

POLLING (Contingência)
  → Inicia para PENDING
  → Intervalo: 3s x 5, depois 10s x 3
  → Máximo: até expiração (30min)
  → Sobrevive restart via job
```

### 3.5 Fase 5: Aprovação
```
[Webhook OU Polling aprova]
  → Transação DB
  → Atualiza Payment: status → APPROVED
  → Cria License
  → Atualiza Subscription
  → Ativa Application
  → Registra AuditLog
  → Edita msg: "✓ Pagamento aprovado com sucesso!"
  → Arquiva tópico após 5min
```

## 4. Entidades Principais

- **User**: Usuário Discord
- **Application**: Aplicação gerenciada
- **ApplicationInstance**: Instância da app em um servidor
- **Plan**: Plano de serviço
- **PlanPrice**: Preço do plano
- **Subscription**: Inscrição ativa
- **License**: Chave de licença
- **Cart**: Carrinho de compra
- **Payment**: Pagamento PIX
- **PaymentEvent**: Auditoria de eventos de pagamento
- **Renewal**: Renovação agendada
- **Notification**: Notificações para usuário
- **AuditLog**: Log de auditoria
- **Transfer**: Transferência de aplicação
- **Deployment**: Deploy da aplicação
- **InteractionSession**: Sessão de interação
- **SystemSetting**: Configurações do sistema

## 5. Segurança

### 5.1 Custom IDs
```
Format: action:entityId:checksum:nonce
Validação: HMAC + timestamp + proprietário
```

### 5.2 Webhook
```
Header: X-Signature = HMAC-SHA256(body, SECRET)
Validação: timing-safe compare + timestamp
```

### 5.3 Interação Cruzada
```
- Nenhuma interação funciona para outro usuário
- Validação em cada clique
- Session expirada = bloqueado
- Pagamento encerrado = bloqueado
```

## 6. Jobs Persistentes

- **Vencimentos**: 1x/hora - notifica e marca vencidas
- **Pagamentos Pendentes**: 1x/hora - expira antigos
- **Polling Recovery**: 1x/5min - retoma após restart
- **Renovações Automáticas**: 1x/dia - processa renovações

## 7. Ordem de Implementação

1. ✓ Fundação (package.json, TypeScript, ESLint)
2. Prisma Schema e Migrations
3. Discord Client e Eventos
4. Comando /apps
5. Carrinho Privado
6. Pagamento PIX Completo
7. Providers Desacoplados
8. Licenças e Renovações
9. Jobs Persistentes
10. Comandos Administrativos
11. Testes
12. Documentação
13. Auditoria Final

---

**Status**: PHASE 1 concluída. Pronto para PHASE 2 (Prisma).
