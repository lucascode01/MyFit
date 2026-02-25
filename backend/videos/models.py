from django.db import models
from django.conf import settings
from django.db.models import Q


class Category(models.Model):
    name = models.CharField('nome', max_length=100)
    slug = models.SlugField(max_length=100)
    description = models.TextField('descrição', blank=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='categoria pai',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    professional = models.ForeignKey(
        'users.ProfessionalProfile',
        on_delete=models.CASCADE,
        related_name='categories',
        null=True,
        blank=True,
        verbose_name='profissional',
    )

    class Meta:
        verbose_name = 'categoria'
        verbose_name_plural = 'categorias'
        ordering = ('name',)
        constraints = [
            models.UniqueConstraint(
                fields=('professional', 'parent', 'slug'),
                condition=Q(professional__isnull=False),
                name='videos_category_prof_parent_slug_uniq',
            ),
        ]

    def __str__(self):
        return self.name


def video_upload_path(instance, filename):
    return f'videos/{instance.professional.user_id}/{instance.id or "temp"}/{filename}'


class Video(models.Model):
    title = models.CharField('título', max_length=255)
    description = models.TextField('descrição', blank=True)
    video_url = models.URLField('URL do vídeo', max_length=500, blank=True)
    video_file = models.FileField(
        'arquivo de vídeo',
        upload_to=video_upload_path,
        blank=True,
        null=True,
    )
    thumbnail = models.ImageField(
        'thumbnail',
        upload_to='thumbnails/',
        blank=True,
        null=True,
    )
    professional = models.ForeignKey(
        'users.ProfessionalProfile',
        on_delete=models.CASCADE,
        related_name='videos',
        verbose_name='profissional',
    )
    categories = models.ManyToManyField(
        Category,
        related_name='videos',
        verbose_name='categorias',
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField('ativo', default=True)

    class Meta:
        verbose_name = 'vídeo'
        verbose_name_plural = 'vídeos'
        ordering = ('-created_at',)

    def __str__(self):
        return self.title

    @property
    def url(self):
        """URL final do vídeo: arquivo (S3/local) ou video_url."""
        if self.video_file:
            return self.video_file.url
        return self.video_url or ''
