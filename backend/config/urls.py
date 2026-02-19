from django.contrib import admin
from django.shortcuts import redirect
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from users import stripe_views as user_stripe_views


def root_view(request):
    return redirect(settings.FRONTEND_URL)


urlpatterns = [
    path('', root_view),
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/', include('videos.urls')),
    path('api/webhooks/stripe/', user_stripe_views.stripe_webhook),
]

if settings.MEDIA_ROOT:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
