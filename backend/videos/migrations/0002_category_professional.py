# Generated manually for Category.professional and slug unique per professional

from django.db import migrations, models
import django.db.models.deletion
from django.db.models import Q, UniqueConstraint


class Migration(migrations.Migration):

    dependencies = [
        ("videos", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="category",
            name="professional",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="categories",
                to="users.professionalprofile",
                verbose_name="profissional",
            ),
        ),
        migrations.AlterField(
            model_name="category",
            name="slug",
            field=models.SlugField(max_length=100),
        ),
        migrations.AddConstraint(
            model_name="category",
            constraint=UniqueConstraint(
                condition=Q(professional__isnull=False),
                fields=("professional", "slug"),
                name="videos_category_prof_slug_uniq",
            ),
        ),
    ]
