from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrador'
        PROFESSIONAL = 'professional', 'Profissional'
        USER = 'user', 'Usuário'

    class SubscriptionStatus(models.TextChoices):
        ACTIVE = 'active', 'Ativa'
        CANCELED = 'canceled', 'Cancelada'
        PAST_DUE = 'past_due', 'Pagamento atrasado'
        UNPAID = 'unpaid', 'Não pago'
        TRIALING = 'trialing', 'Período de teste'

    email = models.EmailField('e-mail', unique=True)
    role = models.CharField(
        'perfil',
        max_length=20,
        choices=Role.choices,
        default=Role.USER,
    )
    # Stripe: profissionais com assinatura ativa podem usar o sistema
    stripe_customer_id = models.CharField('Stripe Customer ID', max_length=255, blank=True)
    stripe_subscription_id = models.CharField('Stripe Subscription ID', max_length=255, blank=True)
    subscription_status = models.CharField(
        'status da assinatura',
        max_length=20,
        choices=SubscriptionStatus.choices,
        blank=True,
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

    @property
    def has_active_subscription(self):
        """Profissional ou admin com assinatura ativa (admin não precisa de assinatura)."""
        if self.role == self.Role.ADMIN:
            return True
        if self.role != self.Role.PROFESSIONAL:
            return False
        return self.subscription_status == self.SubscriptionStatus.ACTIVE


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


class ProfessionalStudent(models.Model):
    """Vínculo profissional -> aluno. Só alunos vinculados podem ver os vídeos desse profissional."""
    professional = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='linked_students',
        limit_choices_to={'role': User.Role.PROFESSIONAL},
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='linked_professionals',
        limit_choices_to={'role': User.Role.USER},
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'aluno do profissional'
        verbose_name_plural = 'alunos do profissional'
        unique_together = [['professional', 'student']]

    def __str__(self):
        return f"{self.professional.email} -> {self.student.email}"
