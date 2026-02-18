from django.contrib import admin
from .models import Category, Video


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ('title', 'professional', 'category', 'is_active', 'created_at')
    list_filter = ('is_active', 'category')
    search_fields = ('title', 'description')
    raw_id_fields = ('professional',)
