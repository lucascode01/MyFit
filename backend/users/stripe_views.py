"""
Stripe: pagamento único (R$ 39,70) para o profissional acessar o sistema.
Checkout em modo 'payment'; webhook checkout.session.completed ativa o acesso.
"""
import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsProfessional
from .models import User

stripe.api_key = settings.STRIPE_SECRET_KEY


def _checkout_session_params(user):
    success_url = settings.FRONTEND_URL.rstrip('/') + '/dashboard/professional?checkout=success'
    cancel_url = settings.FRONTEND_URL.rstrip('/') + '/dashboard/professional?checkout=cancel'
    amount = getattr(settings, 'STRIPE_PAYMENT_AMOUNT_CENTS', 3970)
    currency = getattr(settings, 'STRIPE_CURRENCY', 'brl')
    product_name = getattr(settings, 'STRIPE_PRODUCT_NAME', 'Acesso ao sistema - Profissional')
    line_items = [{
        'price_data': {
            'currency': currency,
            'product_data': {'name': product_name},
            'unit_amount': amount,
        },
        'quantity': 1,
    }]
    # Apenas cartão, para evitar erro de redirecionamento quando a conta não tem PIX habilitado.
    params = {
        'mode': 'payment',
        'line_items': line_items,
        'success_url': success_url,
        'cancel_url': cancel_url,
        'metadata': {'user_id': user.id},
        'payment_method_types': ['card'],
    }
    if user.stripe_customer_id:
        params['customer'] = user.stripe_customer_id
    else:
        params['customer_email'] = user.email
    return params


class CreateCheckoutSessionView(APIView):
    """Cria sessão de checkout Stripe para pagamento único (acesso ao sistema)."""
    permission_classes = [IsAuthenticated, IsProfessional]

    def post(self, request):
        if not settings.STRIPE_SECRET_KEY:
            return Response(
                {'success': False, 'error': {'message': 'Stripe não configurado.'}},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        user = request.user
        if user.role != 'professional':
            return Response(
                {'success': False, 'error': {'message': 'Apenas profissionais podem realizar o pagamento.'}},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            session = stripe.checkout.Session.create(**_checkout_session_params(user))
            return Response({
                'success': True,
                'data': {'checkout_url': session.url, 'session_id': session.id},
            })
        except stripe.error.StripeError as e:
            return Response(
                {'success': False, 'error': {'message': str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CreatePortalSessionView(APIView):
    """Portal do cliente Stripe (histórico de faturas). Mantido para compatibilidade."""
    permission_classes = [IsAuthenticated, IsProfessional]

    def post(self, request):
        if not settings.STRIPE_SECRET_KEY:
            return Response(
                {'success': False, 'error': {'message': 'Stripe não configurado.'}},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        user = request.user
        if not user.stripe_customer_id:
            return Response(
                {'success': False, 'error': {'message': 'Nenhum pagamento anterior encontrado.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return_url = settings.FRONTEND_URL.rstrip('/') + '/dashboard/professional'
        try:
            session = stripe.billing_portal.Session.create(
                customer=user.stripe_customer_id,
                return_url=return_url,
            )
            return Response({
                'success': True,
                'data': {'portal_url': session.url},
            })
        except stripe.error.StripeError as e:
            return Response(
                {'success': False, 'error': {'message': str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """Webhook Stripe: atualiza subscription_status e customer_id do User."""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET
    if not webhook_secret:
        return HttpResponse('Webhook secret not set', status=500)
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        return HttpResponse('Invalid payload', status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse('Invalid signature', status=400)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = (session.get('metadata') or {}).get('user_id')
        if not user_id:
            return HttpResponse(status=200)
        # Pagamento único (mode=payment): ativa acesso do profissional
        if session.get('mode') == 'payment':
            try:
                user = User.objects.get(pk=user_id)
                user.stripe_customer_id = session.get('customer') or user.stripe_customer_id or ''
                user.subscription_status = User.SubscriptionStatus.ACTIVE
                user.save(update_fields=['stripe_customer_id', 'subscription_status'])
            except User.DoesNotExist:
                pass

    return HttpResponse(status=200)
