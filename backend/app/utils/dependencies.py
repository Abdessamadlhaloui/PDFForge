from __future__ import annotations

from pathlib import Path

from typing import Annotated

from fastapi import Depends, HTTPException, Request, UploadFile, status

from app.core.config import settings

from app.core.logging import get_logger

from app.utils.file_handler import save_upload, validate_pdf

logger = get_logger(__name__)

_rate_limit_store: dict[str, list[float]] = {}

async def check_rate_limit(request: Request) -> None:

    import time

    client_ip = request.client.host if request.client else "unknown"

    now = time.time()

    window = 60

    if client_ip not in _rate_limit_store:

        _rate_limit_store[client_ip] = []

    _rate_limit_store[client_ip] = [

        t for t in _rate_limit_store[client_ip] if now - t < window

    ]

    if len(_rate_limit_store[client_ip]) >= settings.rate_limit_per_minute:

        logger.warning("rate_limit_exceeded", client_ip=client_ip)

        raise HTTPException(

            status_code=status.HTTP_429_TOO_MANY_REQUESTS,

            detail={

                "error": "rate_limit_exceeded",

                "message": "Too many requests. Please wait and try again.",

                "retry_after": 60,

            },

        )

    _rate_limit_store[client_ip].append(now)

async def validate_upload_file(file: UploadFile) -> UploadFile:

    if not file.filename:

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail="No filename provided",

        )

    ext = Path(file.filename).suffix.lower()

    if ext not in settings.allowed_extensions:

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail=f"File type '{ext}' is not supported. Allowed: {', '.join(settings.allowed_extensions)}",

        )

    return file

async def validate_pdf_upload(file: UploadFile) -> UploadFile:

    file = await validate_upload_file(file)

    ext = Path(file.filename).suffix.lower()

    if ext != ".pdf":

        raise HTTPException(

            status_code=status.HTTP_400_BAD_REQUEST,

            detail="This endpoint only accepts PDF files.",

        )

    return file

async def require_ai_features() -> None:

    if not settings.enable_ai_features:

        raise HTTPException(

            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,

            detail={

                "error": "ai_disabled",

                "message": "AI features are not enabled on this instance. "

                           "Set ENABLE_AI_FEATURES=true to enable them.",

            },

        )

RateLimited = Annotated[None, Depends(check_rate_limit)]

ValidatedUpload = Annotated[UploadFile, Depends(validate_upload_file)]

ValidatedPDF = Annotated[UploadFile, Depends(validate_pdf_upload)]

AIRequired = Annotated[None, Depends(require_ai_features)]
