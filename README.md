# Gym SaaS – Treinos de Academia

SaaS de treinos com vídeos: profissionais fazem upload e usuários assistem em área autenticada.

**Stack:** Django + DRF (backend), PostgreSQL, Next.js 14 (App Router) + TypeScript (frontend), JWT, S3-ready.

## Estrutura

- `backend/` – Django (API, auth JWT, CRUD vídeos, filtros, paginação)
- `frontend/` – Next.js 14 (App Router), TypeScript, dashboards por perfil
- `docker-compose.yml` – PostgreSQL, backend, frontend

## Como rodar

### Pré-requisitos

- Docker e Docker Compose (ou Python 3.11+ e Node 18+ para rodar sem Docker)

### Com Docker

1. Clone ou acesse a pasta do projeto:
   ```bash
   cd "/Users/lucassantos/Software/Clients/Active/1-Izadora/Code"
   ```

2. Crie o arquivo de ambiente:
   ```bash
   cp .env.example .env
   ```
   Ajuste `SECRET_KEY`, `POSTGRES_PASSWORD` etc. se quiser.

3. Suba os serviços:
   ```bash
   docker-compose up -d db
   docker-compose run --rm backend python manage.py migrate
   docker-compose run --rm backend python manage.py runseed
   docker-compose up -d backend frontend
   ```

4. Acesse:
   - Frontend: http://localhost:3000  
   - API: http://localhost:8000/api/  
   - Admin Django: http://localhost:8000/admin/

### Sem Docker (local)

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # ou .venv\Scripts\activate no Windows
pip install -r requirements.txt
cp ../.env.example ../.env
# Configure no .env: POSTGRES_* e DATABASE_HOST=localhost
python manage.py migrate
python manage.py runseed
python manage.py runserver
```

**Frontend**

```bash
cd frontend
npm install
cp ../.env.example ../.env
# NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm run dev
```

## Seeds (runseed)

O comando `python manage.py runseed` cria:

- Categorias iniciais (ex.: Musculação, Cardio, Mobilidade)
- Usuário admin: `admin@gym.local` / `admin123`
- Profissional: `pro@gym.local` / `pro123`
- Usuário comum: `user@gym.local` / `user123`

Altere as senhas em produção.

## Perfis

| Perfil        | Pode fazer upload | Pode ver vídeos |
|---------------|-------------------|-----------------|
| Admin        | Sim               | Sim             |
| Profissional | Sim               | Sim             |
| Usuário      | Não               | Sim             |

## Variáveis de ambiente

Ver `.env.example`. Principais:

- `POSTGRES_*` – banco
- `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
- `JWT_ACCESS_TOKEN_LIFETIME_MINUTES`, `JWT_REFRESH_TOKEN_LIFETIME_DAYS`
- `USE_S3`, `AWS_*` – opcional; sem S3 usa armazenamento local
- `NEXT_PUBLIC_API_URL` – URL da API para o frontend

## Próximos passos (escopo futuro)

- Comentários em vídeos
- Favoritos
- Assinatura paga
# MyFit
