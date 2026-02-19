from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views
from . import stripe_views
from . import students_views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', views.MeView.as_view(), name='me'),
    path('stripe/checkout/', stripe_views.CreateCheckoutSessionView.as_view(), name='stripe-checkout'),
    path('stripe/portal/', stripe_views.CreatePortalSessionView.as_view(), name='stripe-portal'),
    path('students/', students_views.StudentListCreateView.as_view(), name='student-list-create'),
    path('students/<int:pk>/', students_views.StudentDestroyView.as_view(), name='student-destroy'),
]
