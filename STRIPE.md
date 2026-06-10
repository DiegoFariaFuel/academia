# Onde colocar as chaves do Stripe (Solviz)

## Resumo rápido

| Chave | Onde colocar | Nunca colocar em |
|--------|----------------|------------------|
| **Publishable** (`pk_test_...` / `pk_live_...`) | Só se usar Stripe.js no browser (hoje o app **não** usa) | — |
| **Secret** (`sk_test_...` / `sk_live_...`) | **Supabase → Edge Functions → Secrets** | `.env` do frontend |
| **Webhook signing** (`whsec_...`) | **Supabase → Edge Functions → Secrets** | `.env` do frontend |
| **Supabase URL + anon** | Arquivo **`.env`** na raiz (`VITE_SUPABASE_*`) | — |

O checkout e o portal rodam nas **Edge Functions** (`stripe-checkout`, `stripe-portal`). O webhook roda em `stripe-webhook`. Todas leem `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` dos **secrets do Supabase**, não do Vite.

---

## Passo 1 — Chaves no Stripe Dashboard

1. Acesse [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Copie:
   - **Secret key** → `sk_test_...` (desenvolvimento) ou `sk_live_...` (produção)
3. Depois de criar o webhook (passo 3), copie:
   - **Signing secret** → `whsec_...`

---

## Passo 2 — Secrets no Supabase (obrigatório)

Projeto: `https://dzsiizepifzoifdhmtxr.supabase.co`

### Pelo painel (recomendado)

1. Supabase → **Project Settings** → **Edge Functions** → **Secrets**
2. Adicione:

| Nome do secret | Valor |
|----------------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_...` ou `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `SITE_URL` | `http://localhost:5173` (dev) ou `https://seu-dominio.com` (prod) |
| `CHECKIN_API_KEY` | Uma senha forte qualquer (catraca) |

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já vêm automáticos nas functions.

### Pela CLI

```powershell
cd c:\Users\diego\Downloads\academia
npx supabase login
npx supabase link --project-ref dzsiizepifzoifdhmtxr

npx supabase secrets set STRIPE_SECRET_KEY=sk_test_COLE_AQUI
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_COLE_AQUI
npx supabase secrets set SITE_URL=http://localhost:5173
npx supabase secrets set CHECKIN_API_KEY=uma_senha_forte_aleatoria
```

---

## Passo 3 — Webhook no Stripe

1. Stripe → **Developers** → **Webhooks** → **Add endpoint**
2. URL:

```text
https://dzsiizepifzoifdhmtxr.supabase.co/functions/v1/stripe-webhook
```

3. Eventos (marque todos):

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.upcoming`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `charge.refunded`
- `charge.dispute.created`

4. Salve e copie o **Signing secret** (`whsec_...`) para o secret `STRIPE_WEBHOOK_SECRET` no Supabase.

---

## Passo 4 — Deploy das Edge Functions

```powershell
.\scripts\deploy-functions.ps1 -ProjectRef dzsiizepifzoifdhmtxr
```

Ou manualmente:

```powershell
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy stripe-checkout
npx supabase functions deploy stripe-portal
npx supabase functions deploy registrar-checkin --no-verify-jwt
```

---

## Passo 5 — SQL no Supabase (antes do webhook funcionar)

No **SQL Editor**, execute **nesta ordem**:

1. Seu schema base (já executado)
2. `supabase/migrations/008_solviz_app_compat.sql` ← colunas/tabelas que o app precisa
3. (Opcional) `supabase/migrations/007_platform_stripe_refunds.sql` — só se a função `processar_webhook_stripe(text)` ainda não existir

---

## O que fica no `.env` (frontend)

Somente Supabase — **sem** Stripe:

```env
VITE_SUPABASE_URL=https://dzsiizepifzoifdhmtxr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

---

## Testar

```powershell
node --env-file=.env scripts/test-health.mjs
node --env-file=.env scripts/test-billing-flow.mjs
```

No app: **Configurações** → **Assinar** / **Gerenciar cobrança**.

---

## Modo teste vs produção

| Ambiente | Secret key | Webhook |
|----------|------------|---------|
| Desenvolvimento | `sk_test_...` | Endpoint de teste + `whsec_...` de teste |
| Produção | `sk_live_...` | Endpoint live + `whsec_...` live |

Use cartões de teste: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
