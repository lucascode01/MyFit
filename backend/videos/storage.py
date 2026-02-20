"""
Storage backend: S3 when USE_S3=True, else local filesystem.
"""
from django.conf import settings
from django.core.files.storage import default_storage

if getattr(settings, 'USE_S3', False):
    from storages.backends.s3boto3 import S3Boto3Storage

    class MediaStorage(S3Boto3Storage):
        location = 'media'
        file_overwrite = False
        custom_domain = getattr(settings, 'AWS_S3_CUSTOM_DOMAIN', None) or None
        querystring_auth = False
        # Bucket com ACLs desabilitadas (Bucket owner enforced) — leitura pública via política do bucket
        default_acl = None
else:
    MediaStorage = default_storage.__class__
