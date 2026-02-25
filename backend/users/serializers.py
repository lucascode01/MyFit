from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ProfessionalProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    professional_profile = serializers.SerializerMethodField()
    has_active_subscription = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'role',
            'role_display',
            'professional_profile',
            'subscription_status',
            'has_active_subscription',
            'date_joined',
        )
        read_only_fields = ('id', 'role', 'date_joined', 'subscription_status')

    def get_professional_profile(self, obj):
        if not hasattr(obj, 'professional_profile'):
            return None
        return ProfessionalProfileSerializer(obj.professional_profile).data


class ProfessionalProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfessionalProfile
        fields = ('full_name', 'bio', 'cref', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.USER)
    full_name = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    cref = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            'email',
            'username',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'role',
            'full_name',
            'bio',
            'cref',
        )

    def validate_username(self, value):
        if not value or not value.strip():
            return value
        raw = value.strip()
        if ' ' in raw:
            raise serializers.ValidationError('Nome de usuário não pode conter espaços. Use apenas letras, números e underline.')
        return raw.lower()

    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Senhas não conferem.'})
        if data.get('role') == User.Role.PROFESSIONAL and not data.get('full_name'):
            raise serializers.ValidationError({'full_name': 'Profissionais devem informar o nome completo.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        role = validated_data.pop('role', User.Role.USER)
        full_name = validated_data.pop('full_name', '')
        bio = validated_data.pop('bio', '')
        cref = validated_data.pop('cref', '')
        password = validated_data.pop('password')
        user = User.objects.create_user(role=role, **validated_data)
        user.set_password(password)
        user.save()
        if role == User.Role.PROFESSIONAL:
            ProfessionalProfile.objects.create(
                user=user,
                full_name=full_name or user.get_full_name() or user.email,
                bio=bio,
                cref=cref,
            )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
