# Subcategorias: Category.parent (self-ref) e constraint (professional, parent, slug)

from django.db import migrations, models
import django.db.models.deletion
from django.db.models import Q, UniqueConstraint


class Migration(migrations.Migration):

    dependencies = [
        ("videos", "0002_category_professional"),
    ]

    operations = [
        migrations.AddField(
            model_name="category",
            name="parent",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="children",
                to="videos.category",
                verbose_name="categoria pai",
            ),
        ),
        migrations.AlterField(
            model_name="category",
            name="slug",
            field=models.SlugField(max_length=100),
        ),
        migrations.RemoveConstraint(
            model_name="category",
            name="videos_category_prof_slug_uniq",
        ),
        migrations.AddConstraint(
            model_name="category",
            constraint=UniqueConstraint(
                condition=Q(professional__isnull=False),
                fields=("professional", "parent", "slug"),
                name="videos_category_prof_parent_slug_uniq",
            ),
        ),
    ]
