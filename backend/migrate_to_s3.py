"""
Utility script to migrate existing local photos and uploads to an AWS S3 bucket.
Usage:
    python migrate_to_s3.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load backend .env
load_dotenv(Path(__file__).parent / ".env")

try:
    import boto3
    from s3_storage import (
        is_s3_enabled,
        upload_file_to_s3,
        AWS_STORAGE_BUCKET_NAME,
        AWS_REGION
    )
except ImportError:
    print("Error: boto3 is not installed. Run: pip install boto3")
    sys.exit(1)


def migrate_directory(dir_path: Path, s3_folder: str, is_public: bool = True):
    if not dir_path.is_dir():
        print(f"Skipping {dir_path} (does not exist).")
        return

    files = [f for f in dir_path.iterdir() if f.is_file() and not f.name.startswith(".")]
    if not files:
        print(f"No files found in {dir_path}.")
        return

    print(f"\nMigrating {len(files)} files from {dir_path.name}/ to S3 folder '{s3_folder}/'...")
    success = 0
    for file_path in files:
        try:
            content = file_path.read_bytes()
            url = upload_file_to_s3(
                content=content,
                filename=file_path.name,
                folder=s3_folder,
                is_public=is_public
            )
            if url:
                success += 1
                print(f"  [OK] {file_path.name}")
            else:
                print(f"  [FAILED] {file_path.name}")
        except Exception as e:
            print(f"  [ERROR] {file_path.name}: {e}")

    print(f"Migrated {success}/{len(files)} files to S3 bucket '{AWS_STORAGE_BUCKET_NAME}'.")


def main():
    if not is_s3_enabled():
        print("Error: AWS S3 is not configured in .env.")
        print("Please set AWS_STORAGE_BUCKET_NAME in backend/.env before running migration.")
        sys.exit(1)

    print(f"Starting S3 migration to bucket: '{AWS_STORAGE_BUCKET_NAME}' (Region: {AWS_REGION})")

    base_dir = Path(__file__).parent
    profile_dir = (base_dir / "profile_images").resolve()
    gallery_dir = (base_dir / "gallery_images").resolve()
    upload_dir = (base_dir / "private_uploads").resolve()

    migrate_directory(profile_dir, "profiles", is_public=True)
    migrate_directory(gallery_dir, "gallery", is_public=True)
    migrate_directory(upload_dir, "slips", is_public=False)

    print("\nMigration completed!")


if __name__ == "__main__":
    main()

