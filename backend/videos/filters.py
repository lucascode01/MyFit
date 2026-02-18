from django.db import models
from django_filters import rest_framework as filters
from .models import Video


class VideoFilter(filters.FilterSet):
    category = filters.NumberFilter(field_name='category_id')
    category_slug = filters.CharFilter(field_name='category__slug')
    professional = filters.NumberFilter(field_name='professional__user_id')
    search = filters.CharFilter(method='filter_search')

    class Meta:
        model = Video
        fields = ('category', 'category_slug', 'professional', 'is_active')

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            models.Q(title__icontains=value) | models.Q(description__icontains=value)
        )
