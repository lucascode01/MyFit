from rest_framework import serializers
from .models import Category, Video
from users.models import ProfessionalProfile


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'created_at')
        read_only_fields = ('id', 'created_at')


class VideoListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    professional_name = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = (
            'id',
            'title',
            'description',
            'url',
            'thumbnail',
            'category',
            'professional_name',
            'created_at',
            'updated_at',
        )

    def get_professional_name(self, obj):
        return obj.professional.full_name or obj.professional.user.email


class VideoDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    professional_name = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = (
            'id',
            'title',
            'description',
            'url',
            'thumbnail',
            'category',
            'professional',
            'professional_name',
            'created_at',
            'updated_at',
            'is_active',
        )

    def get_professional_name(self, obj):
        return obj.professional.full_name or obj.professional.user.email


class VideoCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = (
            'title',
            'description',
            'video_url',
            'video_file',
            'thumbnail',
            'category',
            'is_active',
        )

    def create(self, validated_data):
        professional = self.context['request'].user.professional_profile
        return Video.objects.create(professional=professional, **validated_data)

    def validate_category(self, value):
        if value is not None and not Category.objects.filter(pk=value.pk).exists():
            raise serializers.ValidationError('Categoria inválida.')
        return value
