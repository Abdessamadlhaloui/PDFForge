from __future__ import annotations

import time

from datetime import datetime

from celery.result import AsyncResult

from fastapi import APIRouter, HTTPException, status

from fastapi.responses import FileResponse

from app.core.celery_app import celery_app

from app.core.config import settings

from app.core.logging import get_logger

from app.models.schemas import (

    HealthResponse,

    TaskStatus,

    TaskStatusResponse,

)

from app.utils.file_handler import (

    cleanup_expired_files,

    find_file,

    get_mime_type,

)

logger = get_logger(__name__)

router = APIRouter(tags=["Utility"])

_start_time = time.time()

@router.get("/health", response_model=HealthResponse, summary="Health check")

async def health_check():

    services: dict[str, str] = {}

    try:

        import redis as redis_lib

        r = redis_lib.from_url(settings.redis_url, socket_timeout=2)

        r.ping()

        services["redis"] = "healthy"

    except Exception:

        services["redis"] = "unavailable"

    try:

        import subprocess

        result = subprocess.run(

            [settings.ghostscript_path, "--version"],

            capture_output=True, text=True, timeout=5,

        )

        services["ghostscript"] = "healthy" if result.returncode == 0 else "unavailable"

    except Exception:

        services["ghostscript"] = "unavailable"

    try:

        import subprocess

        result = subprocess.run(

            [settings.libreoffice_path, "--version"],

            capture_output=True, text=True, timeout=5,

        )

        services["libreoffice"] = "healthy" if result.returncode == 0 else "unavailable"

    except Exception:

        services["libreoffice"] = "unavailable"

    try:

        import subprocess

        result = subprocess.run(

            [settings.tesseract_path, "--version"],

            capture_output=True, text=True, timeout=5,

        )

        services["tesseract"] = "healthy" if result.returncode == 0 else "unavailable"

    except Exception:

        services["tesseract"] = "unavailable"

    services["ai_features"] = "enabled" if settings.enable_ai_features else "disabled"

    return HealthResponse(

        status="healthy",

        version=settings.app_version,

        environment=settings.app_env,

        services=services,

        uptime_seconds=round(time.time() - _start_time, 2),

    )

@router.get("/tasks/{task_id}", response_model=TaskStatusResponse, summary="Get background task status")

async def get_task_status(task_id: str):

    result = AsyncResult(task_id, app=celery_app)

    status_map = {

        "PENDING": TaskStatus.PENDING,

        "STARTED": TaskStatus.PROCESSING,

        "PROGRESS": TaskStatus.PROCESSING,

        "SUCCESS": TaskStatus.COMPLETED,

        "FAILURE": TaskStatus.FAILED,

        "REVOKED": TaskStatus.FAILED,

    }

    task_status = status_map.get(result.status, TaskStatus.PENDING)

    progress = 0

    message = ""

    if result.status == "PROGRESS" and isinstance(result.info, dict):

        progress = result.info.get("progress", 0)

        message = result.info.get("message", "")

    response = TaskStatusResponse(

        task_id=task_id,

        status=task_status,

        progress=progress,

        message=message,

        result=result.result if task_status == TaskStatus.COMPLETED else None,

        error=str(result.result) if task_status == TaskStatus.FAILED else None,

        created_at=datetime.utcnow(),

        updated_at=datetime.utcnow(),

    )

    return response

@router.get("/download/{file_id}", summary="Download processed file")

async def download_file(file_id: str):

    file_path = find_file(file_id)

    if file_path is None:

        raise HTTPException(

            status_code=status.HTTP_404_NOT_FOUND,

            detail={

                "error": "file_not_found",

                "message": f"File '{file_id}' not found or has expired. "

                           f"Files are automatically deleted after {settings.temp_file_ttl_minutes} minutes.",

            },

        )

    mime_type = get_mime_type(file_path)

    logger.info("file_download", file_id=file_id, mime_type=mime_type)

    return FileResponse(

        path=str(file_path),

        media_type=mime_type,

        filename=file_path.name,

        headers={

            "Content-Disposition": f'attachment; filename="{file_path.name}"',

            "Cache-Control": "no-cache, no-store, must-revalidate",

            "X-File-ID": file_id,

        },

    )

@router.post("/cleanup", summary="Trigger temp file cleanup")

async def trigger_cleanup():

    deleted_count = cleanup_expired_files()

    return {

        "success": True,

        "message": f"Cleanup completed. {deleted_count} expired file(s) deleted.",

        "files_deleted": deleted_count,

        "ttl_minutes": settings.temp_file_ttl_minutes,

    }
