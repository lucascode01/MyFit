# Generated manually for Stripe + ProfessionalStudent

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='stripe_customer_id',
            field=models.CharField(blank=True, max_length=255, verbose_name='Stripe Customer ID'),
        ),
        migrations.AddField(
            model_name='user',
            name='stripe_subscription_id',
            field=models.CharField(blank=True, max_length=255, verbose_name='Stripe Subscription ID'),
        ),
        migrations.AddField(
            model_name='user',
            name='subscription_status',
            field=models.CharField(
                blank=True,
                choices=[
                    ('active', 'Ativa'),
                    ('canceled', 'Cancelada'),
                    ('past_due', 'Pagamento atrasado'),
                    ('unpaid', 'Não pago'),
                    ('trialing', 'Período de teste'),
                ],
                max_length=20,
                verbose_name='status da assinatura',
            ),
        ),
        migrations.CreateModel(
            name='ProfessionalStudent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'professional',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='linked_students',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    'student',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='linked_professionals',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'verbose_name': 'aluno do profissional',
                'verbose_name_plural': 'alunos do profissional',
                'unique_together': {('professional', 'student')},
            },
        ),
    ]
