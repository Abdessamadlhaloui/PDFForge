from __future__ import annotations

import asyncio

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status

from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import JSONResponse

from app.core.config import settings

from app.core.logging import get_logger, setup_logging

from app.routes import ai_router, convert_router, pdf_router, utils_router

from app.utils.file_handler import async_cleanup_loop, cleanup_expired_files

setup_logging()

logger = get_logger(__name__)

@asynccontextmanager

async def lifespan(app: FastAPI):

    logger.info(

        "app_starting",

        version=settings.app_version,

        environment=settings.app_env,

        debug=settings.debug,

        temp_dir=str(settings.temp_path),

        max_upload_mb=settings.max_upload_size_mb,

        ai_features=settings.enable_ai_features,

    )

    settings.temp_path.mkdir(parents=True, exist_ok=True)

    cleanup_task = asyncio.create_task(async_cleanup_loop())

    logger.info("cleanup_loop_started", interval_seconds=300)

    yield

    logger.info("app_shutting_down")

    cleanup_task.cancel()

    try:

        await cleanup_task

    except asyncio.CancelledError:

        pass

    deleted = cleanup_expired_files()

    logger.info("shutdown_cleanup", files_deleted=deleted)

app = FastAPI(

    title=settings.app_title,

    version=settings.app_version,

    description=(

        "**PDFForge** — A free, stateless, privacy-first PDF processing platform.\n\n"

        "## Features\n"

        "- 📝 **PDF Editing** — Merge, split, rotate, compress, watermark, redact\n"

        "- 🔄 **Conversion** — PDF ↔ Word, Excel, PowerPoint, Images\n"

        "- 🤖 **AI Analysis** — Summarize, chat, translate, semantic search\n"

        "- 🔒 **Security** — Password protection, encryption, auto-delete\n\n"

        "## Architecture\n"

        "- Fully stateless — no database, no user accounts\n"

        "- All files are temporary and auto-deleted after "

        f"{settings.temp_file_ttl_minutes} minutes\n"

        "- Heavy tasks processed in background with Celery + Redis\n\n"

        "## Privacy\n"

        "Your files are never stored permanently. "

        "All processing happens on the server and files are "

        "automatically deleted after processing."

    ),

    docs_url="/docs",

    redoc_url="/redoc",

    openapi_url="/openapi.json",

    lifespan=lifespan,

    license_info={

        "name": "MIT License",

        "url": "https://opensource.org/licenses/MIT",

    },

    contact={

        "name": "PDFForge",

        "url": "https://github.com/pdfforge",

    },

)

app.add_middleware(

    CORSMiddleware,

    allow_origins=settings.cors_origins,

    allow_credentials=False,

    allow_methods=["GET", "POST", "OPTIONS"],

    allow_headers=["*"],

    max_age=3600,

)

@app.exception_handler(HTTPException)

async def http_exception_handler(request: Request, exc: HTTPException):

    return JSONResponse(

        status_code=exc.status_code,

        content={

            "success": False,

            "error": "http_error",

            "message": str(exc.detail) if isinstance(exc.detail, str) else exc.detail,

            "status_code": exc.status_code,

        },

    )

@app.exception_handler(ValueError)

async def value_error_handler(request: Request, exc: ValueError):

    logger.warning("validation_error", error=str(exc), path=request.url.path)

    return JSONResponse(

        status_code=status.HTTP_400_BAD_REQUEST,

        content={

            "success": False,

            "error": "validation_error",

            "message": str(exc),

        },

    )

@app.exception_handler(Exception)

async def general_exception_handler(request: Request, exc: Exception):

    logger.error(

        "unhandled_error",

        error=str(exc),

        error_type=type(exc).__name__,

        path=request.url.path,

        method=request.method,

    )

    return JSONResponse(

        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,

        content={

            "success": False,

            "error": "internal_error",

            "message": "An unexpected error occurred. Please try again.",

        },

    )

@app.middleware("http")

async def log_requests(request: Request, call_next):

    import time

    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time

    if request.url.path != "/health":

        logger.info(

            "request_completed",

            method=request.method,

            path=request.url.path,

            status_code=response.status_code,

            process_time_ms=round(process_time * 1000, 2),

            client_ip=request.client.host if request.client else "unknown",

        )

    response.headers["X-Process-Time"] = f"{process_time:.4f}"

    return response

API_V1 = "/api/v1"

app.include_router(pdf_router, prefix=API_V1)

app.include_router(convert_router, prefix=API_V1)

app.include_router(ai_router, prefix=API_V1)

app.include_router(utils_router, prefix=API_V1)

@app.get("/health", include_in_schema=False)

async def root_health():

    return {"status": "healthy", "version": settings.app_version}

@app.get("/", include_in_schema=False)

async def root():

    return {

        "name": settings.app_title,

        "version": settings.app_version,

        "docs": "/docs",

        "redoc": "/redoc",

        "health": "/health",

        "api_base": f"{API_V1}/",

    }
