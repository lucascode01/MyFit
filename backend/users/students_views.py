"""
API para o profissional gerenciar seus alunos (quem pode ver seus vídeos).
Requer assinatura ativa.
"""
from django.contrib.auth import get_user_model
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsProfessional, HasActiveSubscription
from .models import ProfessionalStudent

User = get_user_model()


class StudentListCreateView(generics.ListCreateAPIView):
    """Lista alunos do profissional e adiciona por e-mail."""
    permission_classes = [IsAuthenticated, IsProfessional, HasActiveSubscription]

    def get_queryset(self):
        return ProfessionalStudent.objects.filter(
            professional=self.request.user
        ).select_related('student').order_by('-created_at')

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        data = [
            {
                'id': ps.id,
                'student_id': ps.student_id,
                'email': ps.student.email,
                'first_name': ps.student.first_name,
                'last_name': ps.student.last_name,
                'created_at': ps.created_at,
            }
            for ps in qs
        ]
        return Response({'success': True, 'data': data})

    def create(self, request, *args, **kwargs):
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response(
                {'success': False, 'error': {'message': 'Informe o e-mail do aluno.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            student = User.objects.get(email=email, role=User.Role.USER)
        except User.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Não existe usuário com esse e-mail ou o perfil não é de aluno.'}},
                status=status.HTTP_404_NOT_FOUND,
            )
        if student.id == request.user.id:
            return Response(
                {'success': False, 'error': {'message': 'Você não pode se adicionar como aluno.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ps, created = ProfessionalStudent.objects.get_or_create(
            professional=request.user,
            student=student,
        )
        if not created:
            return Response(
                {'success': False, 'error': {'message': 'Este aluno já está na sua lista.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({
            'success': True,
            'data': {
                'id': ps.id,
                'student_id': ps.student_id,
                'email': ps.student.email,
                'first_name': ps.student.first_name,
                'last_name': ps.student.last_name,
                'created_at': ps.created_at,
            },
        }, status=status.HTTP_201_CREATED)


class StudentDestroyView(generics.DestroyAPIView):
    """Remove um aluno da lista do profissional."""
    permission_classes = [IsAuthenticated, IsProfessional, HasActiveSubscription]

    def get_queryset(self):
        return ProfessionalStudent.objects.filter(professional=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
