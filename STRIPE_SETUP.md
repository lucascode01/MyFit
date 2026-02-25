# Passo a passo: integrar a API da Stripe para cobrança dos professores

O sistema usa **pagamento único** (não recorrência): o profissional (professor) paga **R$ 39,70** uma vez para liberar o acesso (enviar vídeos, categorias, alunos). O checkout aceita **cartão**; **PIX** pode ser habilitado quando a Stripe disponibilizar na sua conta (veja seção PIX abaixo). O backend e o frontend já estão implementados; basta configurar a Stripe e as variáveis de ambiente.

---

## Passo a passo resumido

| # | O que fazer | Onde |
|---|-------------|------|
| 1 | Criar conta na Stripe | [dashboard.stripe.com/register](https://dashboard.stripe.com/register) |
| 2 | Copiar **Secret key** e **Publishable key** | Dashboard → Developers → API keys |
| 3 | Criar **Webhook** com URL `https://SEU_BACKEND/api/webhooks/stripe/` e evento `checkout.session.completed`; copiar **Signing secret** | Dashboard → Developers → Webhooks |
| 4 | Configurar variáveis no backend: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL` | `.env` ou painel do host (Railway, etc.) |
| 5 | Em desenvolvimento local: usar **ngrok** (ou similar) para expor o backend e usar essa URL no webhook | Terminal: `ngrok http 8000` |
| 6 | Testar: login como profissional → "Pagar R$ 39,70" → cartão teste `4242 4242 4242 4242` | Frontend + Stripe Dashboard → Payments / Webhooks |

---

## 1. Criar conta na Stripe

1. Acesse [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register) e crie uma conta.
2. Faça login no [Dashboard Stripe](https://dashboard.stripe.com).
3. **Modo teste**: por padrão a conta começa em modo teste. Use as chaves de teste para desenvolvimento. Quando for receber pagamentos reais, ative a conta e use as chaves ao vivo.

---

## 2. Obter as chaves da API

1. No Dashboard, vá em **Developers** → **API keys**.
2. Você verá:
   - **Publishable key** (começa com `pk_test_` ou `pk_live_`) → use como `STRIPE_PUBLISHABLE_KEY`.
   - **Secret key** (clique em “Reveal” e copie; começa com `sk_test_` ou `sk_live_`) → use como `STRIPE_SECRET_KEY`.

**Importante:** nunca exponha a Secret key no frontend. Ela só deve estar no backend (variáveis de ambiente).

---

## 3. Configurar o webhook (obrigatório para liberar acesso)

O backend só marca o profissional como “pago” quando o Stripe envia o evento `checkout.session.completed`. Para isso, é preciso configurar um webhook.

### 3.1 No Stripe Dashboard

1. Vá em **Developers** → **Webhooks**.
2. Clique em **Add endpoint**.
3. **Endpoint URL**: a URL pública do seu backend + o caminho do webhook:
   - Exemplo local (teste com ngrok): `https://seu-ngrok.ngrok.io/api/webhooks/stripe/`
   - Exemplo produção: `https://seu-backend.railway.app/api/webhooks/stripe/`
4. Em **Events to send**, escolha **Select events** e marque:
   - `checkout.session.completed`
5. Clique em **Add endpoint**.
6. Na página do endpoint, em **Signing secret**, clique em **Reveal** e copie o valor (começa com `whsec_`) → use como `STRIPE_WEBHOOK_SECRET`.

### 3.2 Em desenvolvimento local

O Stripe precisa chamar uma URL pública. No seu computador use um túnel, por exemplo:

- [ngrok](https://ngrok.com): `ngrok http 8000` e use a URL gerada (ex.: `https://abc123.ngrok.io`) como base do backend.
- Configure o webhook no Stripe com: `https://abc123.ngrok.io/api/webhooks/stripe/`

Em produção (Railway, etc.), use a URL real do backend.

---

## 4. Variáveis de ambiente no backend

Configure no seu backend (`.env` ou variáveis do Railway/outro host):

| Variável | Obrigatório | Descrição |
|----------|------------|-----------|
| `STRIPE_SECRET_KEY` | Sim | Chave secreta (ex.: `sk_test_...` ou `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Sim | Signing secret do webhook (ex.: `whsec_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Não* | Chave pública (útil se no futuro usar Stripe no frontend) |
| `STRIPE_PAYMENT_AMOUNT_CENTS` | Não | Valor em centavos. Padrão: `3970` (R$ 39,70) |
| `STRIPE_CURRENCY` | Não | Moeda. Padrão: `brl` |
| `STRIPE_PRODUCT_NAME` | Não | Nome do produto na tela de checkout. Padrão: `Acesso ao sistema - Profissional` |
| `STRIPE_PIX_ENABLED` | Não | `true` para oferecer PIX no checkout (só ative quando PIX aparecer no Dashboard; ver seção PIX). Padrão: `false` |
| `STRIPE_PIX_EXPIRES_AFTER_SECONDS` | Não | Tempo para pagar via PIX (segundos; 10–1209600). Só vale se PIX estiver habilitado. Se não definir, Stripe usa 1 dia. |
| `FRONTEND_URL` | Sim | URL do frontend (ex.: `https://meu-app.railway.app`) para redirecionar após o pagamento |

\* O fluxo atual usa apenas o backend para criar a sessão de checkout; a publishable key pode ficar para uso futuro.

**Exemplo `.env` (desenvolvimento):**

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000
```

**Produção:** use as chaves **live** (`sk_live_...`, `pk_live_...`) e o `STRIPE_WEBHOOK_SECRET` do webhook criado no modo live, e defina `FRONTEND_URL` com a URL do seu front em produção.

---

### PIX (opcional)

Na Stripe, **PIX nem sempre aparece** em Settings → Payment methods: a oferta é por convite e costuma exigir conta em bom uso e pelo menos **60 dias** processando pagamentos (e conta no Brasil ou EUA, moeda BRL). Se na sua conta **não há opção de adicionar PIX**, use o checkout só com cartão (padrão do sistema). Quando a Stripe habilitar PIX para você e a opção aparecer no Dashboard, defina `STRIPE_PIX_ENABLED=true` no backend para passar a oferecer PIX no checkout. Opcional: `STRIPE_PIX_EXPIRES_AFTER_SECONDS` para alterar o tempo de expiração do pagamento PIX.

---

## 5. Fluxo no sistema

1. Profissional acessa o dashboard e clica em **“Pagar R$ 39,70”**.
2. O backend cria uma sessão de checkout Stripe (pagamento único) e redireciona o usuário para a página de pagamento do Stripe.
3. O usuário paga; o Stripe redireciona de volta para o frontend (`/dashboard/professional?checkout=success`).
4. O Stripe envia o evento `checkout.session.completed` para o webhook do backend.
5. O backend identifica o usuário pelo `metadata.user_id`, atualiza `subscription_status` para `active` e grava o `stripe_customer_id` se necessário.
6. Na próxima vez que o profissional carregar o dashboard (ou após o frontend atualizar o usuário), ele verá “Acesso ativo” e poderá usar vídeos, categorias e alunos.

---

## 6. Testar

- **Cartão de teste (modo teste):** use por exemplo `4242 4242 4242 4242`, qualquer data futura e CVC.
- **PIX:** só aparece no checkout se `STRIPE_PIX_ENABLED=true` e se a sua conta Stripe tiver PIX habilitado (ver seção PIX acima).
- Após o pagamento, confira no Dashboard Stripe em **Payments** que o pagamento apareceu.
- Em **Webhooks** → seu endpoint → verifique que o evento `checkout.session.completed` foi enviado e retornou 200.

Se o webhook falhar (por exemplo URL inacessível ou secret errado), o pagamento pode ter sido feito no Stripe mas o usuário não será liberado no sistema. Nesse caso, verifique os logs do webhook no Stripe e as variáveis de ambiente no backend.

---

## 7. Resumo rápido

1. Criar conta Stripe e pegar **API keys** (Secret + Publishable).
2. Criar **Webhook** com URL `https://SEU_BACKEND/api/webhooks/stripe/` e evento `checkout.session.completed`; copiar **Signing secret**.
3. Definir no backend: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`.
4. (Opcional) Ajustar valor e nome: `STRIPE_PAYMENT_AMOUNT_CENTS`, `STRIPE_CURRENCY`, `STRIPE_PRODUCT_NAME`. Quando a Stripe liberar PIX na sua conta: `STRIPE_PIX_ENABLED=true` (e opcionalmente `STRIPE_PIX_EXPIRES_AFTER_SECONDS`).

Para mudar o valor no futuro (ex.: R$ 49,90), altere `STRIPE_PAYMENT_AMOUNT_CENTS` para o valor em centavos (ex.: `4990`) e, se quiser, o texto no frontend na tela do profissional.
