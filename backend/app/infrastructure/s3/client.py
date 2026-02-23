import boto3
from botocore.config import Config

from app.core.settings import settings


def get_s3_client(*, public: bool = False):
    endpoint = settings.S3_PUBLIC_ENDPOINT if public else settings.S3_ENDPOINT

    cfg = Config(
        signature_version="s3v4",
        s3={"addressing_style": "path"},
    )

    return boto3.client(
        "s3",
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        region_name=settings.S3_REGION,
        endpoint_url=endpoint,
        config=cfg,
    )
