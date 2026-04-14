from __future__ import annotations

import asyncio

import hashlib

import os

import shutil

import time

import uuid

from datetime import datetime, timedelta

from pathlib import Path

import aiofiles

from fastapi import UploadFile

from app.core.config import settings

from app.core.logging import get_logger

logger = get_logger(__name__)

def generate_file_id() -> str:

    return uuid.uuid4().hex[:16]

def generate_task_id() -> str:

    return f"task_{uuid.uuid4().hex[:12]}"

def get_temp_dir() -> Path:

    temp_dir = settings.temp_path

    temp_dir.mkdir(parents=True, exist_ok=True)

    return temp_dir

def get_file_path(file_id: str, extension: str = ".pdf") -> Path:

    if not extension.startswith("."):

        extension = f".{extension}"

    return get_temp_dir() / f"{file_id}{extension}"

async def save_upload(upload: UploadFile, file_id: str | None = None) -> tuple[str, Path]:

    if file_id is None:

        file_id = generate_file_id()

    original_ext = Path(upload.filename or "file.pdf").suffix.lower()

    if original_ext not in settings.allowed_extensions:

        raise ValueError(

            f"File type '{original_ext}' is not allowed. "

            f"Allowed: {', '.join(settings.allowed_extensions)}"

        )

    file_path = get_file_path(file_id, original_ext)

    total_size = 0

    chunk_size = 1024 * 1024

    async with aiofiles.open(file_path, "wb") as f:

        while True:

            chunk = await upload.read(chunk_size)

            if not chunk:

                break

            total_size += len(chunk)

            if total_size > settings.max_upload_size_bytes:

                file_path.unlink(missing_ok=True)

                raise ValueError(

                    f"File exceeds maximum size of {settings.max_upload_size_mb}MB"

                )

            await f.write(chunk)

    logger.info(

        "file_saved",

        file_id=file_id,

        filename=upload.filename,

        size_bytes=total_size,

        extension=original_ext,

    )

    return file_id, file_path

async def save_bytes(data: bytes, file_id: str, extension: str = ".pdf") -> Path:

    file_path = get_file_path(file_id, extension)

    async with aiofiles.open(file_path, "wb") as f:

        await f.write(data)

    return file_path

def save_bytes_sync(data: bytes, file_id: str, extension: str = ".pdf") -> Path:

    file_path = get_file_path(file_id, extension)

    with open(file_path, "wb") as f:

        f.write(data)

    return file_path

def find_file(file_id: str) -> Path | None:

    temp_dir = get_temp_dir()

    for ext in settings.allowed_extensions + [".zip"]:

        file_path = temp_dir / f"{file_id}{ext}"

        if file_path.exists():

            return file_path

    return None

def get_file_size(file_path: Path) -> int:

    return file_path.stat().st_size

def get_file_hash(file_path: Path) -> str:

    sha256 = hashlib.sha256()

    with open(file_path, "rb") as f:

        for chunk in iter(lambda: f.read(8192), b""):

            sha256.update(chunk)

    return sha256.hexdigest()

def get_download_url(file_id: str) -> str:

    return f"/api/v1/download/{file_id}"

def get_expiry_time() -> datetime:

    return datetime.utcnow() + timedelta(minutes=settings.temp_file_ttl_minutes)

def cleanup_expired_files() -> int:

    temp_dir = get_temp_dir()

    ttl_seconds = settings.temp_file_ttl_minutes * 60

    now = time.time()

    deleted = 0

    for file_path in temp_dir.iterdir():

        if file_path.is_file():

            file_age = now - file_path.stat().st_mtime

            if file_age > ttl_seconds:

                try:

                    file_path.unlink()

                    deleted += 1

                except OSError as e:

                    logger.warning("cleanup_error", file=str(file_path), error=str(e))

    if deleted > 0:

        logger.info("cleanup_completed", files_deleted=deleted)

    return deleted

async def async_cleanup_loop() -> None:

    while True:

        try:

            cleanup_expired_files()

        except Exception as e:

            logger.error("cleanup_loop_error", error=str(e))

        await asyncio.sleep(300)

def delete_file(file_id: str) -> bool:

    file_path = find_file(file_id)

    if file_path and file_path.exists():

        file_path.unlink()

        logger.info("file_deleted", file_id=file_id)

        return True

    return False

def validate_pdf(file_path: Path) -> bool:

    try:

        with open(file_path, "rb") as f:

            header = f.read(5)

            return header == b"%PDF-"

    except Exception:

        return False

def get_mime_type(file_path: Path) -> str:

    ext_to_mime = {

        ".pdf": "application/pdf",

        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",

        ".doc": "application/msword",

        ".xls": "application/vnd.ms-excel",

        ".ppt": "application/vnd.ms-powerpoint",

        ".jpg": "image/jpeg",

        ".jpeg": "image/jpeg",

        ".png": "image/png",

        ".tiff": "image/tiff",

        ".bmp": "image/bmp",

        ".webp": "image/webp",

        ".zip": "application/zip",

    }

    return ext_to_mime.get(file_path.suffix.lower(), "application/octet-stream")
