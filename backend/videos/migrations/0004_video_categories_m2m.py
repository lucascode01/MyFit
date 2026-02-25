# Vídeo com múltiplas categorias: substitui category (FK) por categories (M2M)

from django.db import migrations, models


def migrate_category_to_categories(apps, schema_editor):
    Video = apps.get_model('videos', 'Video')
    for video in Video.objects.filter(category__isnull=False):
        video.categories.add(video.category_id)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('videos', '0003_category_parent_subcategories'),
    ]

    operations = [
        migrations.AddField(
            model_name='video',
            name='categories',
            field=models.ManyToManyField(
                blank=True,
                related_name='videos',
                to='videos.category',
                verbose_name='categorias',
            ),
        ),
        migrations.RunPython(migrate_category_to_categories, noop),
        migrations.RemoveField(
            model_name='video',
            name='category',
        ),
    ]
