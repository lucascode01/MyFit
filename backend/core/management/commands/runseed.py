"""
Seed inicial para desenvolvimento e testes.
Cria categorias e usuários de exemplo.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User, ProfessionalProfile
from videos.models import Category


class Command(BaseCommand):
    help = 'Cria categorias e usuários de teste (admin, profissional, usuário).'

    @transaction.atomic
    def handle(self, *args, **options):
        categories_data = [
            {'name': 'Musculação', 'slug': 'musculacao', 'description': 'Treinos de força e hipertrofia'},
            {'name': 'Cardio', 'slug': 'cardio', 'description': 'Corrida, bike, HIIT'},
            {'name': 'Mobilidade', 'slug': 'mobilidade', 'description': 'Alongamento e mobilidade'},
            {'name': 'Funcional', 'slug': 'funcional', 'description': 'Treino funcional'},
        ]

        # Admin
        admin, created = User.objects.get_or_create(
            email='admin@gym.local',
            defaults={
                'username': 'admin',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            },
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS('Admin criado: admin@gym.local / admin123'))

        # Profissional
        pro, created = User.objects.get_or_create(
            email='pro@gym.local',
            defaults={'username': 'pro', 'role': User.Role.PROFESSIONAL},
        )
        pro_profile = None
        if created:
            pro.set_password('pro123')
            pro.save()
            pro_profile, _ = ProfessionalProfile.objects.get_or_create(
                user=pro,
                defaults={'full_name': 'Profissional Teste', 'bio': 'Bio do profissional'},
            )
            self.stdout.write(self.style.SUCCESS('Profissional criado: pro@gym.local / pro123'))
        else:
            pro_profile = getattr(pro, 'professional_profile', None)

        # Categorias (vinculadas ao profissional de teste, se existir)
        if pro_profile:
            for data in categories_data:
                _, created_cat = Category.objects.get_or_create(
                    slug=data['slug'],
                    professional=pro_profile,
                    defaults={**data, 'professional': pro_profile},
                )
                if created_cat:
                    self.stdout.write(self.style.SUCCESS(f"Categoria criada: {data['name']}"))
        else:
            # Fallback sem professional (categorias não aparecem na listagem por dono)
            for data in categories_data:
                _, created_cat = Category.objects.get_or_create(
                    slug=data['slug'], professional=None, defaults=data
                )
                if created_cat:
                    self.stdout.write(self.style.SUCCESS(f"Categoria criada: {data['name']}"))

        # Usuário comum
        user, created = User.objects.get_or_create(
            email='user@gym.local',
            defaults={'username': 'user', 'role': User.Role.USER},
        )
        if created:
            user.set_password('user123')
            user.save()
            self.stdout.write(self.style.SUCCESS('Usuário criado: user@gym.local / user123'))

        self.stdout.write(self.style.SUCCESS('Seed concluído.'))
