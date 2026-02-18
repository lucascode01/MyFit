from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrador'
        PROFESSIONAL = 'professional', 'Profissional'
        USER = 'user', 'Usuário'

    email = models.EmailField('e-mail', unique=True)
    role = models.CharField(
        'perfil',
        max_length=20,
        choices=Role.choices,
        default=Role.USER,
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'usuário'
        verbose_name_plural = 'usuários'

    def __str__(self):
        return self.email

    @property
    def is_professional(self):
        return self.role in (self.Role.PROFESSIONAL, self.Role.ADMIN)


class ProfessionalProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='professional_profile',
        primary_key=True,
    )
    full_name = models.CharField('nome completo', max_length=255)
    bio = models.TextField('bio', blank=True)
    cref = models.CharField('CREF', max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'perfil profissional'
        verbose_name_plural = 'perfis profissionais'

    def __str__(self):
        return self.full_name or self.user.email
