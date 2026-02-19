"""
Stripe: checkout para assinatura mensal e webhook para atualizar status.
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

from core.permissions import IsProfessional, HasActiveSubscription
from .models import User

stripe.api_key = settings.STRIPE_SECRET_KEY


class CreateCheckoutSessionView(APIView):
    """Cria sessão de checkout Stripe para o profissional assinar."""
    permission_classes = [IsAuthenticated, IsProfessional]

    def post(self, request):
        if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_PRICE_ID:
            return Response(
                {'success': False, 'error': {'message': 'Stripe não configurado.'}},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        user = request.user
        if user.role != 'professional':
            return Response(
                {'success': False, 'error': {'message': 'Apenas profissionais podem assinar.'}},
                status=status.HTTP_403_FORBIDDEN,
            )
        success_url = settings.FRONTEND_URL.rstrip('/') + '/dashboard/professional?checkout=success'
        cancel_url = settings.FRONTEND_URL.rstrip('/') + '/dashboard/professional?checkout=cancel'
        try:
            if user.stripe_customer_id:
                session = stripe.checkout.Session.create(
                    customer=user.stripe_customer_id,
                    mode='subscription',
                    line_items=[{'price': settings.STRIPE_PRICE_ID, 'quantity': 1}],
                    success_url=success_url,
                    cancel_url=cancel_url,
                    metadata={'user_id': user.id},
                    subscription_data={'metadata': {'user_id': user.id}},
                )
            else:
                session = stripe.checkout.Session.create(
                    customer_email=user.email,
                    mode='subscription',
                    line_items=[{'price': settings.STRIPE_PRICE_ID, 'quantity': 1}],
                    success_url=success_url,
                    cancel_url=cancel_url,
                    metadata={'user_id': user.id},
                    subscription_data={'metadata': {'user_id': user.id}},
                )
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
    """Link para o portal do cliente Stripe (gerenciar assinatura, cartão)."""
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
                {'success': False, 'error': {'message': 'Nenhuma assinatura encontrada.'}},
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
        user_id = (session.get('metadata') or {}).get('user_id') or ((session.get('subscription_data') or {}).get('metadata') or {}).get('user_id')
        if user_id and session.get('subscription'):
            try:
                user = User.objects.get(pk=user_id)
                user.stripe_customer_id = session.get('customer') or user.stripe_customer_id
                user.stripe_subscription_id = session['subscription']
                user.subscription_status = User.SubscriptionStatus.ACTIVE
                user.save(update_fields=['stripe_customer_id', 'stripe_subscription_id', 'subscription_status'])
            except User.DoesNotExist:
                pass

    if event['type'] == 'customer.subscription.updated':
        sub = event['data']['object']
        user_id = sub.get('metadata', {}).get('user_id')
        if user_id:
            status_map = {
                'active': User.SubscriptionStatus.ACTIVE,
                'canceled': User.SubscriptionStatus.CANCELED,
                'past_due': User.SubscriptionStatus.PAST_DUE,
                'unpaid': User.SubscriptionStatus.UNPAID,
                'trialing': User.SubscriptionStatus.TRIALING,
            }
            new_status = status_map.get(sub['status'], '')
            try:
                User.objects.filter(pk=user_id).update(
                    subscription_status=new_status,
                    stripe_subscription_id=sub['id'],
                )
            except Exception:
                pass

    if event['type'] == 'customer.subscription.deleted':
        sub = event['data']['object']
        user_id = sub.get('metadata', {}).get('user_id')
        if user_id:
            User.objects.filter(pk=user_id).update(
                subscription_status=User.SubscriptionStatus.CANCELED,
                stripe_subscription_id='',
            )

    return HttpResponse(status=200)
