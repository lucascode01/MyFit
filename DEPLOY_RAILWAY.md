# Deploy no Railway

## Configuração dos serviços

### Backend
- **Root Directory:** `backend`
- **Dockerfile Path:** `Dockerfile` (padrão)
- **Variáveis obrigatórias:**
  - `DATABASE_URL` (automático se o Postgres estiver ligado ao serviço)
  - `SECRET_KEY` (string longa, ex.: 50 caracteres)
  - `ALLOWED_HOSTS` = `.railway.app` ou `myfit-production.up.railway.app`
  - `FRONTEND_URL` = `https://myfitt.up.railway.app`
  - `CSRF_TRUSTED_ORIGINS` = `https://myfit-production.up.railway.app`
  - `CORS_ALLOWED_ORIGINS` = `https://myfitt.up.railway.app`
- **Para S3 (vídeos):**
  - `USE_S3` = `True`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_STORAGE_BUCKET_NAME` = nome do bucket
  - `AWS_S3_REGION_NAME` = `us-east-1` (só o código)

### Frontend
- **Root Directory:** `frontend`
- **Dockerfile Path:** `Dockerfile` (padrão)
- **Variáveis:**
  - `NEXT_PUBLIC_API_URL` = `https://myfit-production.up.railway.app/api`

## Ordem
1. Crie/ligue o Postgres ao serviço backend.
2. Faça push e aguarde o build dos dois serviços.
3. Acesse o backend (ex.: `https://myfit-production.up.railway.app`) e o front (`https://myfitt.up.railway.app`).
