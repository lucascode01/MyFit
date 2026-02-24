from django.contrib import admin
from .models import Category, Video


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'professional', 'created_at')
    list_filter = ('parent',)
    search_fields = ('name', 'slug')
    raw_id_fields = ('parent', 'professional')


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ('title', 'professional', 'category', 'is_active', 'created_at')
    list_filter = ('is_active', 'category')
    search_fields = ('title', 'description')
    raw_id_fields = ('professional',)
