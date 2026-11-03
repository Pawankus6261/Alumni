"""
Script to optimize and compress all existing profile and gallery images in-place.
Reduces file sizes by up to 90-99% while preserving crisp quality, making page loads blazing fast.
"""

import sys
import io
from pathlib import Path
from PIL import Image, ImageOps

def optimize_file(path: Path, max_size: tuple[int, int] = (400, 400), quality: int = 85) -> tuple[int, int]:
    orig_size = path.stat().st_size
    try:
        content = path.read_bytes()
        with Image.open(io.BytesIO(content)) as img:
            try:
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass

            # If already small enough in bytes and dimensions, skip
            if orig_size < 50 * 1024 and max(img.size) <= max(max_size):
                return orig_size, orig_size

            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            ext = path.suffix.lower()

            buf = io.BytesIO()
            if ext in ('.png', '.webp'):
                is_transparent = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
                if is_transparent:
                    img.save(buf, format='PNG', optimize=True)
                else:
                    img.convert('RGB').save(buf, format='JPEG', quality=quality, optimize=True)
            else:
                img.convert('RGB').save(buf, format='JPEG', quality=quality, optimize=True)

            new_bytes = buf.getvalue()
            # Only write if we actually saved space
            if len(new_bytes) < orig_size:
                path.write_bytes(new_bytes)
                return orig_size, len(new_bytes)
            return orig_size, orig_size
    except Exception as e:
        return orig_size, orig_size


def optimize_directory(dir_path: Path, max_size: tuple[int, int], quality: int = 85, label: str = ''):
    if not dir_path.is_dir():
        print(f"Directory {dir_path} not found.")
        return

    files = [f for f in dir_path.iterdir() if f.is_file() and not f.name.startswith('.')]
    print(f"\nOptimizing {len(files)} files in {label} ({dir_path.name})...")

    total_before = 0
    total_after = 0
    optimized_count = 0

    for idx, f in enumerate(files, 1):
        b, a = optimize_file(f, max_size=max_size, quality=quality)
        total_before += b
        total_after += a
        if a < b:
            optimized_count += 1
        if idx % 100 == 0 or idx == len(files):
            print(f"  Processed {idx}/{len(files)}...")

    saved_mb = (total_before - total_after) / (1024 * 1024)
    percent = ((total_before - total_after) / total_before * 100) if total_before else 0
    print(f"Result for {label}:")
    print(f"  Before: {total_before / (1024*1024):.2f} MB")
    print(f"  After:  {total_after / (1024*1024):.2f} MB")
    print(f"  Saved:  {saved_mb:.2f} MB ({percent:.1f}% reduction across {optimized_count} files!)")


def main():
    base_dir = Path(__file__).parent
    profile_dir = (base_dir / "profile_images").resolve()
    gallery_dir = (base_dir / "gallery_images").resolve()

    optimize_directory(profile_dir, max_size=(400, 400), quality=85, label="Profile Avatars")
    optimize_directory(gallery_dir, max_size=(1600, 1200), quality=85, label="Gallery Photos")

if __name__ == "__main__":
    main()

