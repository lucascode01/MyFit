"""
Cria um profissional de teste com assinatura ativa (sem Stripe) para desenvolvimento.
Uso: python manage.py createtestprofessional [email] [senha]
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from users.models import ProfessionalProfile

User = get_user_model()


class Command(BaseCommand):
    help = 'Cria um usuário profissional com subscription_status=active para testar sem pagar.'

    def add_arguments(self, parser):
        parser.add_argument(
            'email',
            nargs='?',
            default='professor@teste.com',
            help='E-mail do profissional (default: professor@teste.com)',
        )
        parser.add_argument(
            'password',
            nargs='?',
            default='teste1234',
            help='Senha (default: teste1234)',
        )

    def handle(self, *args, **options):
        email = options['email'].strip().lower()
        password = options['password']

        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            if user.role != User.Role.PROFESSIONAL:
                user.role = User.Role.PROFESSIONAL
                user.save()
                ProfessionalProfile.objects.get_or_create(
                    user=user,
                    defaults={'full_name': user.get_full_name() or email.split('@')[0]},
                )
            user.subscription_status = User.SubscriptionStatus.ACTIVE
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Profissional existente atualizado: {email} (assinatura ativa)'))
        else:
            user = User.objects.create_user(
                email=email,
                username=email.split('@')[0],
                password=password,
                role=User.Role.PROFESSIONAL,
                first_name='Professor',
                last_name='Teste',
            )
            user.subscription_status = User.SubscriptionStatus.ACTIVE
            user.save()
            ProfessionalProfile.objects.create(
                user=user,
                full_name='Professor Teste',
            )
            self.stdout.write(self.style.SUCCESS(f'Profissional de teste criado: {email} / senha: {password}'))

        self.stdout.write('Faça login no app com esse e-mail e senha para testar como professor sem pagar.')
