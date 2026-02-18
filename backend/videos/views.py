from rest_framework import generics
from rest_framework.response import Response

from core.permissions import IsProfessional, IsProfessionalOrReadOnly, IsOwnerOrAdmin
from .models import Category, Video
from .serializers import (
    CategorySerializer,
    VideoListSerializer,
    VideoDetailSerializer,
    VideoCreateUpdateSerializer,
)
from .filters import VideoFilter


class CategoryListView(generics.ListAPIView):
    """Lista categorias (autenticado)."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None


class VideoListView(generics.ListAPIView):
    """Listagem de vídeos com filtros e paginação."""
    serializer_class = VideoListSerializer
    filterset_class = VideoFilter

    def get_queryset(self):
        return Video.objects.filter(is_active=True).select_related('category', 'professional', 'professional__user')


class VideoDetailView(generics.RetrieveAPIView):
    """Detalhe de um vídeo."""
    serializer_class = VideoDetailSerializer
    queryset = Video.objects.filter(is_active=True).select_related('category', 'professional', 'professional__user')


class VideoCreateView(generics.CreateAPIView):
    """Upload/criação de vídeo (apenas profissional)."""
    serializer_class = VideoCreateUpdateSerializer
    permission_classes = [IsProfessional]

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
    """Vídeos do profissional logado."""
    serializer_class = VideoListSerializer
    permission_classes = [IsProfessional]
    filterset_class = VideoFilter

    def get_queryset(self):
        return Video.objects.filter(
            professional__user=self.request.user
        ).select_related('category', 'professional', 'professional__user')


class VideoUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """Editar e excluir vídeo (dono ou admin)."""
    serializer_class = VideoCreateUpdateSerializer
    permission_classes = [IsProfessional, IsOwnerOrAdmin]

    def get_queryset(self):
        return Video.objects.select_related('category', 'professional', 'professional__user')

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return VideoDetailSerializer
        return VideoCreateUpdateSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
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
