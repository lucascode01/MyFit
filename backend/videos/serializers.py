from rest_framework import serializers
from .models import Category, Video
from users.models import ProfessionalProfile


class CategorySerializer(serializers.ModelSerializer):
    parent = serializers.PrimaryKeyRelatedField(read_only=True)
    parent_name = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'parent', 'parent_name', 'display_name', 'created_at')
        read_only_fields = ('id', 'slug', 'created_at')

    def get_parent_name(self, obj):
        return obj.parent.name if obj.parent_id else None

    def get_display_name(self, obj):
        if obj.parent_id:
            return f'{obj.parent.name} › {obj.name}'
        return obj.name


class CategoryTreeSerializer(serializers.ModelSerializer):
    """Categoria com children aninhados para exibição em árvore."""
    children = serializers.SerializerMethodField()
    parent_name = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'parent', 'parent_name', 'display_name', 'children', 'created_at')

    def get_children(self, obj):
        qs = getattr(obj, 'prefetched_children', None) or obj.children.all()
        return CategoryTreeSerializer(qs, many=True).data

    def get_parent_name(self, obj):
        return obj.parent.name if obj.parent_id else None

    def get_display_name(self, obj):
        if obj.parent_id:
            return f'{obj.parent.name} › {obj.name}'
        return obj.name


class CategoryCreateSerializer(serializers.ModelSerializer):
    """Criação de categoria ou subcategoria: slug gerado; pertence ao profissional logado."""
    class Meta:
        model = Category
        fields = ('name', 'description', 'parent')

    def create(self, validated_data):
        from django.utils.text import slugify
        request = self.context.get('request')
        professional = getattr(request.user, 'professional_profile', None)
        if not professional:
            raise serializers.ValidationError('Apenas profissionais podem criar categorias.')
        name = validated_data.get('name', '').strip()
        if not name:
            raise serializers.ValidationError({'name': 'Nome é obrigatório.'})
        parent = validated_data.get('parent')
        if parent and parent.professional_id != professional.pk:
            raise serializers.ValidationError({'parent': 'Só é possível usar categorias suas como pai.'})
        base_slug = slugify(name) or 'categoria'
        slug = base_slug
        n = 0
        while Category.objects.filter(professional=professional, parent=parent, slug=slug).exists():
            n += 1
            slug = f'{base_slug}-{n}'
        validated_data['slug'] = slug
        validated_data['professional'] = professional
        return Category.objects.create(**validated_data)


class CategoryUpdateSerializer(serializers.ModelSerializer):
    """Atualização de categoria: name, description, parent."""
    class Meta:
        model = Category
        fields = ('name', 'description', 'parent')

    def validate_parent(self, value):
        request = self.context.get('request')
        profile = getattr(request.user, 'professional_profile', None) if request else None
        if value and profile and value.professional_id != profile.pk:
            raise serializers.ValidationError('Só é possível usar categorias suas como pai.')
        instance = self.instance
        if instance and value and value.pk == instance.pk:
            raise serializers.ValidationError('Uma categoria não pode ser pai de si mesma.')
        if instance and value and value.parent_id and value.parent_id == instance.pk:
            raise serializers.ValidationError('Não é possível criar ciclo na árvore.')
        return value


class VideoListSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    professional_name = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = (
            'id',
            'title',
            'description',
            'url',
            'thumbnail',
            'categories',
            'professional_name',
            'can_edit',
            'created_at',
            'updated_at',
        )

    def get_professional_name(self, obj):
        return obj.professional.full_name or obj.professional.user.email

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not getattr(request, 'user', None) or not request.user.is_authenticated:
            return False
        user = request.user
        if user.role == 'admin':
            return True
        if user.role == 'professional':
            return getattr(obj.professional, 'user_id', None) == user.id
        return False


class VideoDetailSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    professional_name = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = (
            'id',
            'title',
            'description',
            'url',
            'thumbnail',
            'categories',
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
            'categories',
            'is_active',
        )

    def create(self, validated_data):
        professional = self.context['request'].user.professional_profile
        categories = validated_data.pop('categories', [])
        validated_data['is_active'] = True
        video = Video.objects.create(professional=professional, **validated_data)
        if categories:
            video.categories.set(categories)
        return video

    def update(self, instance, validated_data):
        categories = validated_data.pop('categories', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if categories is not None:
            instance.categories.set(categories)
        return instance

    def validate_categories(self, value):
        request = self.context.get('request')
        profile = getattr(request.user, 'professional_profile', None) if request else None
        for cat in value or []:
            if not Category.objects.filter(pk=cat.pk).exists():
                raise serializers.ValidationError('Categoria inválida.')
            if profile and cat.professional_id is not None and cat.professional_id != profile.pk:
                raise serializers.ValidationError('Só é possível usar categorias que você criou.')
        return value or []
