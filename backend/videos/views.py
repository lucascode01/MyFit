from rest_framework import generics
from rest_framework.response import Response

from core.permissions import IsProfessional, IsProfessionalOrReadOnly, IsOwnerOrAdmin, HasActiveSubscription
from .models import Category, Video
from .serializers import (
    CategorySerializer,
    CategoryTreeSerializer,
    CategoryCreateSerializer,
    CategoryUpdateSerializer,
    VideoListSerializer,
    VideoDetailSerializer,
    VideoCreateUpdateSerializer,
)
from .filters import VideoFilter


def _category_queryset(request):
    from users.models import ProfessionalStudent
    user = request.user
    qs = Category.objects.all().select_related('parent').order_by('name')
    if user.role == 'user':
        pro_ids = ProfessionalStudent.objects.filter(student=user).values_list('professional_id', flat=True)
        qs = qs.filter(professional__user_id__in=pro_ids)
    elif user.role in ('professional', 'admin') and hasattr(user, 'professional_profile'):
        qs = qs.filter(professional=user.professional_profile)
    elif user.role == 'admin':
        pass
    else:
        qs = qs.none()
    return qs


class CategoryListCreateView(generics.ListCreateAPIView):
    """Lista categorias (em árvore se ?tree=1) e cria categoria/subcategoria (professor)."""
    permission_classes = [IsProfessionalOrReadOnly]
    pagination_class = None

    def get_queryset(self):
        return _category_queryset(self.request)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CategoryCreateSerializer
        if self.request.query_params.get('tree') == '1':
            return CategoryTreeSerializer
        return CategorySerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if request.query_params.get('tree') == '1':
            queryset = queryset.filter(parent__isnull=True).prefetch_related('children__children')
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'data': CategorySerializer(serializer.instance).data,
        }, status=201)


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, atualizar e excluir categoria ou subcategoria (dono ou admin)."""
    permission_classes = [IsProfessional]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return _category_queryset(self.request)

    def get_serializer_class(self):
        if self.request.method in ('PATCH', 'PUT'):
            return CategoryUpdateSerializer
        return CategorySerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = CategorySerializer(instance)
        return Response({'success': True, 'data': serializer.data})

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', request.method == 'PATCH')
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'success': True, 'data': CategorySerializer(instance).data})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=204)


class VideoListView(generics.ListAPIView):
    """Listagem de vídeos: alunos veem só dos profissionais a que estão vinculados."""
    serializer_class = VideoListSerializer
    filterset_class = VideoFilter

    def get_queryset(self):
        qs = Video.objects.filter(is_active=True).select_related('professional', 'professional__user').prefetch_related('categories')
        user = self.request.user
        if user.role == 'user':
            # Aluno: apenas vídeos dos profissionais que o têm como aluno
            from users.models import ProfessionalStudent
            pro_ids = ProfessionalStudent.objects.filter(student=user).values_list('professional_id', flat=True)
            # Vídeo.professional é ProfessionalProfile; professional.user_id é o User profissional
            qs = qs.filter(professional__user_id__in=pro_ids)
        # professional/admin continuam vendo todos aqui? Não: profissionais usam /videos/me/. Então esta listagem é para alunos. Admin pode ver todos - então para admin não filtramos.
        elif user.role == 'admin':
            pass  # admin vê todos
        return qs


class VideoDetailView(generics.RetrieveAPIView):
    """Detalhe de um vídeo. Alunos só acessam vídeos dos seus profissionais."""
    serializer_class = VideoDetailSerializer

    def get_queryset(self):
        qs = Video.objects.filter(is_active=True).select_related('professional', 'professional__user').prefetch_related('categories')
        if self.request.user.role == 'user':
            from users.models import ProfessionalStudent
            pro_ids = ProfessionalStudent.objects.filter(student=self.request.user).values_list('professional_id', flat=True)
            qs = qs.filter(professional__user_id__in=pro_ids)
        return qs


class VideoCreateView(generics.CreateAPIView):
    """Upload/criação de vídeo (profissional com assinatura ativa)."""
    serializer_class = VideoCreateUpdateSerializer
    permission_classes = [IsProfessional, HasActiveSubscription]

    def perform_create(self, serializer):
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'data': VideoDetailSerializer(serializer.instance).data,
        }, status=201)


class VideoMyListView(generics.ListAPIView):
    """Vídeos do profissional logado (requer assinatura ativa)."""
    serializer_class = VideoListSerializer
    permission_classes = [IsProfessional, HasActiveSubscription]
    filterset_class = VideoFilter

    def get_queryset(self):
        return Video.objects.filter(
            professional__user=self.request.user
        ).select_related('professional', 'professional__user').prefetch_related('categories')


class VideoUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """Editar e excluir vídeo (dono ou admin)."""
    serializer_class = VideoCreateUpdateSerializer
    permission_classes = [IsProfessional, IsOwnerOrAdmin]

    def get_queryset(self):
        return Video.objects.select_related('professional', 'professional__user').prefetch_related('categories')

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return VideoDetailSerializer
        return VideoCreateUpdateSerializer

    def update(self, request, *args, **kwargs):
        partial = request.method == 'PATCH'
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'data': VideoDetailSerializer(instance).data,
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=204)
