import os
import boto3
from botocore.config import Config

def _s3_client():
    region = os.getenv("AWS_REGION")
    bucket = os.getenv("SABLE_S3_BUCKET")

    if not region:
        raise RuntimeError("AWS_REGION is not set")
    if not bucket:
        raise RuntimeError("SABLE_S3_BUCKET is not set")

    # Force regional endpoint + SigV4
    return boto3.client(
        "s3",
        region_name=region,
        endpoint_url=f"https://s3.{region}.amazonaws.com",
        config=Config(signature_version="s3v4")
    )

def presign_put(key: str, content_type: str, expires_sec: int = 900) -> str:
    s3 = _s3_client()
    bucket = os.getenv("SABLE_S3_BUCKET")
    return s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={"Bucket": bucket, "Key": key, "ContentType": content_type},
        ExpiresIn=expires_sec,
    )

def presign_get(key: str, expires_sec: int = 900) -> str:
    s3 = _s3_client()
    bucket = os.getenv("SABLE_S3_BUCKET")
    return s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expires_sec,
    )