from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .serializers import RegisterSerializer, LoginSerializer, UserSerializer

User = get_user_model()


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': UserSerializer(user).data,
    }


class RegisterView(APIView):
    permission_classes = ()
    authentication_classes = ()

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'success': True, 'data': get_tokens_for_user(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = ()
    authentication_classes = ()

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.get(email=serializer.validated_data['email'])
        if not user.check_password(serializer.validated_data['password']):
            return Response(
                {'success': False, 'error': {'message': 'Credenciais inválidas.'}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response({
            'success': True,
            'data': get_tokens_for_user(user),
        })


class MeView(APIView):
    def get(self, request):
        return Response({
            'success': True,
            'data': UserSerializer(request.user).data,
        })
