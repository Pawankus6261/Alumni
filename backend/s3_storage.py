import os
import mimetypes
from pathlib import Path
from typing import Optional

try:
    import boto3
    from botocore.config import Config
    from botocore.exceptions import BotoCoreError, ClientError
except ImportError:
    boto3 = None
    Config = None
    BotoCoreError = Exception
    ClientError = Exception

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME", "").strip()
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "").strip()
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "").strip()
AWS_S3_CUSTOM_DOMAIN = os.getenv("AWS_S3_CUSTOM_DOMAIN", "").strip()


def is_s3_enabled() -> bool:
    """Check if S3 storage is configured and boto3 is installed."""
    return bool(boto3 and AWS_STORAGE_BUCKET_NAME)


def get_s3_client():
    """Build and return an S3 client instance."""
    if not is_s3_enabled():
        return None
    client_kwargs = {
        "region_name": AWS_REGION,
        "config": Config(signature_version="s3v4") if Config else None,
    }
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        client_kwargs["aws_access_key_id"] = AWS_ACCESS_KEY_ID
        client_kwargs["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY
    # If keys are omitted, boto3 automatically discovers IAM role credentials on EC2 / ECS / Lambda
    return boto3.client("s3", **{k: v for k, v in client_kwargs.items() if v is not None})


def get_public_s3_url(folder: str, filename: str) -> str:
    """Generate public HTTP URL for an S3 object."""
    clean_file = Path(filename).name
    folder_prefix = folder.strip("/")
    key = f"{folder_prefix}/{clean_file}" if folder_prefix else clean_file
    if AWS_S3_CUSTOM_DOMAIN:
        return f"https://{AWS_S3_CUSTOM_DOMAIN}/{key}"
    return f"https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{key}"


def upload_file_to_s3(content: bytes, filename: str, folder: str = "profiles", content_type: Optional[str] = None, is_public: bool = True) -> Optional[str]:
    """
    Upload file bytes to the configured S3 bucket.
    Returns the public URL if is_public=True, else returns the S3 key.
    """
    client = get_s3_client()
    if not client:
        return None

    clean_file = Path(filename).name
    folder_prefix = folder.strip("/")
    key = f"{folder_prefix}/{clean_file}" if folder_prefix else clean_file

    if not content_type:
        content_type = mimetypes.guess_type(clean_file)[0] or "application/octet-stream"

    extra_args = {"ContentType": content_type}

    try:
        client.put_object(
            Bucket=AWS_STORAGE_BUCKET_NAME,
            Key=key,
            Body=content,
            **extra_args
        )
        if is_public:
            return get_public_s3_url(folder, clean_file)
        return key
    except (BotoCoreError, ClientError) as exc:
        print(f"[AWS S3 Error] Failed to upload {key}: {exc}")
        return None


def get_presigned_url(folder: str, filename: str, expires_in: int = 900) -> Optional[str]:
    """Generate a temporary signed URL for private S3 objects (e.g. payment slips)."""
    client = get_s3_client()
    if not client:
        return None
    clean_file = Path(filename).name
    folder_prefix = folder.strip("/")
    key = f"{folder_prefix}/{clean_file}" if folder_prefix else clean_file
    try:
        return client.generate_presigned_url(
            "get_object",
            Params={"Bucket": AWS_STORAGE_BUCKET_NAME, "Key": key},
            ExpiresIn=expires_in,
        )
    except (BotoCoreError, ClientError) as exc:
        print(f"[AWS S3 Error] Failed to generate presigned URL for {key}: {exc}")
        return None


def delete_file_from_s3(folder: str, filename: str) -> bool:
    """Delete an object from S3."""
    client = get_s3_client()
    if not client:
        return False
    clean_file = Path(filename).name
    folder_prefix = folder.strip("/")
    key = f"{folder_prefix}/{clean_file}" if folder_prefix else clean_file
    try:
        client.delete_object(Bucket=AWS_STORAGE_BUCKET_NAME, Key=key)
        return True
    except (BotoCoreError, ClientError) as exc:
        print(f"[AWS S3 Error] Failed to delete {key}: {exc}")
        return False

