from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ProfessionalProfile, ProfessionalStudent


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'role', 'subscription_status', 'is_staff', 'date_joined')
    list_filter = ('role', 'subscription_status', 'is_staff')
    search_fields = ('email', 'username')
    ordering = ('-date_joined',)
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Perfil', {'fields': ('role',)}),
        ('Stripe', {'fields': ('stripe_customer_id', 'stripe_subscription_id', 'subscription_status'), 'classes': ('collapse',)}),
    )


@admin.register(ProfessionalProfile)
class ProfessionalProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'cref')
    search_fields = ('full_name', 'user__email')


@admin.register(ProfessionalStudent)
class ProfessionalStudentAdmin(admin.ModelAdmin):
    list_display = ('professional', 'student', 'created_at')
    list_filter = ('professional',)
    search_fields = ('professional__email', 'student__email')
    raw_id_fields = ('professional', 'student')
