"""Context processors for templates."""
from django.conf import settings


def frontend_url(request):
    """Expose FRONTEND_URL to templates (e.g. for favicon link in admin)."""
    return {'FRONTEND_URL': getattr(settings, 'FRONTEND_URL', '').rstrip('/')}
