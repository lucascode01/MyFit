"""
Custom exception handler for consistent API error responses.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        payload = {
            'success': False,
            'error': {
                'code': response.status_code,
                'message': _get_error_message(response.data),
                'details': response.data,
            },
        }
        response.data = payload
    return response


def _get_error_message(data):
    if isinstance(data, dict):
        if 'detail' in data:
            return data['detail'] if isinstance(data['detail'], str) else str(data['detail'])
        first_key = next(iter(data), None)
        if first_key and isinstance(data[first_key], list):
            return data[first_key][0] if data[first_key] else 'Validation error'
        return str(data)
    return str(data) if data else 'An error occurred.'
