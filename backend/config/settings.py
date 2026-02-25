"""
Django settings for Gym SaaS - production-ready base.
"""
import os
from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='dev-secret-change-in-production')
DEBUG = config('DEBUG', default=True, cast=bool)
_allowed = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,backend').split(',')
ALLOWED_HOSTS = [h.strip() for h in _allowed if h.strip()]
# Django uses leading dot for subdomain wildcard; *.railway.app doesn't work
if '*.railway.app' in ALLOWED_HOSTS:
    ALLOWED_HOSTS.remove('*.railway.app')
    ALLOWED_HOSTS.append('.railway.app')

# URL do frontend - rota / redireciona para aqui
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')

# CSRF: origens confiáveis (Django 4+) para admin e formulários via HTTPS
_csrf_origins = config('CSRF_TRUSTED_ORIGINS', default='').split(',')
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins if o.strip()]
# Fallback: se não definiu, usa hosts que não são curinga (ex.: myfit-production.up.railway.app)
if not CSRF_TRUSTED_ORIGINS:
    for h in ALLOWED_HOSTS:
        if h and not h.startswith('.'):
            CSRF_TRUSTED_ORIGINS.append('https://' + h)
            CSRF_TRUSTED_ORIGINS.append('http://' + h)

# Stripe (pagamento único para profissional acessar o sistema — R$ 39,70)
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')
STRIPE_PUBLISHABLE_KEY = config('STRIPE_PUBLISHABLE_KEY', default='')
# Valor em centavos (3970 = R$ 39,70). Moeda: STRIPE_CURRENCY (ex: brl).
STRIPE_PAYMENT_AMOUNT_CENTS = config('STRIPE_PAYMENT_AMOUNT_CENTS', default=3970, cast=int)
STRIPE_CURRENCY = config('STRIPE_CURRENCY', default='brl').lower()
STRIPE_PRODUCT_NAME = config('STRIPE_PRODUCT_NAME', default='Acesso ao sistema - Profissional')
# PIX: tempo em segundos para o cliente pagar (10 a 1209600). Opcional; se não definir, Stripe usa 1 dia.
STRIPE_PIX_EXPIRES_AFTER_SECONDS = config('STRIPE_PIX_EXPIRES_AFTER_SECONDS', default=None)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    # Local
    'core',
    'users',
    'videos',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'config' / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'config.context_processors.frontend_url',
            ],
        },
    },
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB', default=os.environ.get('POSTGRES_DB', 'MYfitPersonal')),
        'USER': config('POSTGRES_USER', default=os.environ.get('POSTGRES_USER', 'gym')),
        'PASSWORD': config('POSTGRES_PASSWORD', default=os.environ.get('POSTGRES_PASSWORD', 'gym_secret')),
        'HOST': config('DATABASE_HOST', default=os.environ.get('DATABASE_HOST', 'localhost')),
        'PORT': config('DATABASE_PORT', default=os.environ.get('DATABASE_PORT', '5432')),
    }
}

# Parse DATABASE_URL if present (e.g. Docker)
_db_url = os.environ.get('DATABASE_URL')
if _db_url:
    import dj_database_url
    DATABASES['default'] = dj_database_url.parse(_db_url, conn_max_age=600)

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'users.User'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_FILTER_BACKENDS': ('django_filters.rest_framework.DjangoFilterBackend',),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}

# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=60, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=config('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=7, cast=int)),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

_cors_raw = config('CORS_ALLOWED_ORIGINS', default='').strip()
if _cors_raw:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_raw.split(',') if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://myfitt.up.railway.app']
# Garante que a origem do frontend esteja sempre permitida
_frontend = (config('FRONTEND_URL', default='').rstrip('/'))
if _frontend and _frontend not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append(_frontend)
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True

# S3 / Storage (USE_S3=True no Railway + variáveis AWS_* para vídeos persistirem)
USE_S3 = config('USE_S3', default=False, cast=bool)
if USE_S3:
    AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', default='')
    AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', default='')
    AWS_STORAGE_BUCKET_NAME = (config('AWS_STORAGE_BUCKET_NAME', default='') or '').strip()
    if not AWS_STORAGE_BUCKET_NAME:
        raise ValueError('USE_S3=True exige AWS_STORAGE_BUCKET_NAME.')
    _region = (config('AWS_S3_REGION_NAME', default='us-east-1') or 'us-east-1').strip()
    import re
    _m = re.search(r'([a-z]{2}-[a-z]+-\d+)', _region, re.I)
    AWS_S3_REGION_NAME = _m.group(1).lower() if _m else _region
    AWS_S3_CUSTOM_DOMAIN = (config('AWS_S3_CUSTOM_DOMAIN', default='') or '').strip() or None
    AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
    # Bucket com "Object ownership: Bucket owner enforced" não aceita ACLs; use política do bucket para leitura pública
    AWS_DEFAULT_ACL = None
    DEFAULT_FILE_STORAGE = 'videos.storage.MediaStorage'
else:
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
