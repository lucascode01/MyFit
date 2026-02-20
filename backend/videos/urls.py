from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListCreateView.as_view(), name='category-list-create'),
    path('videos/', views.VideoListView.as_view(), name='video-list'),
    path('videos/me/', views.VideoMyListView.as_view(), name='video-my-list'),
    path('videos/upload/', views.VideoCreateView.as_view(), name='video-create'),
    path('videos/<int:pk>/', views.VideoDetailView.as_view(), name='video-watch'),
    path('videos/<int:pk>/edit/', views.VideoUpdateDestroyView.as_view(), name='video-edit'),
]
