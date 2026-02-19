# Sincroniza limit_choices_to dos FKs com o modelo (evita "changes not reflected")
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_stripe_and_professional_students'),
    ]

    operations = [
        migrations.AlterField(
            model_name='professionalstudent',
            name='professional',
            field=models.ForeignKey(
                limit_choices_to={'role': 'professional'},
                on_delete=django.db.models.deletion.CASCADE,
                related_name='linked_students',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name='professionalstudent',
            name='student',
            field=models.ForeignKey(
                limit_choices_to={'role': 'user'},
                on_delete=django.db.models.deletion.CASCADE,
                related_name='linked_professionals',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
