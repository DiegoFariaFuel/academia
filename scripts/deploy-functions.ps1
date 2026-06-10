# Deploy das Edge Functions no Supabase
# Uso: .\scripts\deploy-functions.ps1 -ProjectRef "seu_project_ref"

param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef
)

$ErrorActionPreference = "Stop"

Write-Host "Linkando projeto..." -ForegroundColor Cyan
supabase link --project-ref $ProjectRef

Write-Host "Publicando stripe-webhook..." -ForegroundColor Cyan
supabase functions deploy stripe-webhook --no-verify-jwt

Write-Host "Publicando registrar-checkin..." -ForegroundColor Cyan
supabase functions deploy registrar-checkin --no-verify-jwt

Write-Host "Publicando stripe-checkout..." -ForegroundColor Cyan
supabase functions deploy stripe-checkout

Write-Host "Publicando stripe-portal..." -ForegroundColor Cyan
supabase functions deploy stripe-portal

Write-Host "Publicando enviar-mensagem..." -ForegroundColor Cyan
supabase functions deploy enviar-mensagem

Write-Host ""
Write-Host "Concluído! Configure os secrets:" -ForegroundColor Green
Write-Host "  supabase secrets set STRIPE_SECRET_KEY=sk_..."
Write-Host "  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_..."
Write-Host "  supabase secrets set CHECKIN_API_KEY=sua_chave_forte"
Write-Host "  supabase secrets set SITE_URL=https://seu-dominio.com"
Write-Host "  supabase secrets set RESEND_API_KEY=re_...  # opcional"
Write-Host ""
Write-Host "URLs:"
Write-Host "  Webhook: https://$ProjectRef.supabase.co/functions/v1/stripe-webhook"
Write-Host "  Checkin: https://$ProjectRef.supabase.co/functions/v1/registrar-checkin"
Write-Host "  Checkout: https://$ProjectRef.supabase.co/functions/v1/stripe-checkout"
Write-Host "  Portal: https://$ProjectRef.supabase.co/functions/v1/stripe-portal"
