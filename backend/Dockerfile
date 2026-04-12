# =============================================================================
# PDFForge — Backend Dockerfile (Multi-Stage Build)
# =============================================================================
# Stage 1: Base — Install system dependencies (LibreOffice, Ghostscript, etc.)
# Stage 2: Dependencies — Install Python packages
# Stage 3: Production — Minimal runtime image
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Base Image with System Dependencies
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS base

# Prevent Python from writing bytecode and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Install all system-level dependencies in a single layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    # --- PDF Processing ---
    ghostscript \
    # --- Office Conversion ---
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-common \
    # --- OCR ---
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-fra \
    tesseract-ocr-deu \
    tesseract-ocr-spa \
    tesseract-ocr-ara \
    # --- Image Processing ---
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    # --- Build Tools ---
    build-essential \
    curl \
    # --- Utilities ---
    poppler-utils \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for security
RUN groupadd -r pdfforge && useradd -r -g pdfforge -s /sbin/nologin pdfforge

# Create temp directory for file processing
RUN mkdir -p /tmp/pdfforge && chown pdfforge:pdfforge /tmp/pdfforge

# ---------------------------------------------------------------------------
# Stage 2: Install Python Dependencies
# ---------------------------------------------------------------------------
FROM base AS dependencies

WORKDIR /app

# Copy requirements first for Docker layer caching
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# ---------------------------------------------------------------------------
# Stage 3: Production Image
# ---------------------------------------------------------------------------
FROM dependencies AS production

WORKDIR /app

# Copy application code
COPY app/ ./app/

# Switch to non-root user
USER pdfforge

# Expose the application port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=15s --timeout=10s --retries=5 --start-period=30s \
    CMD curl -f http://localhost:8000/health || exit 1

# Production server: Gunicorn with Uvicorn workers
# - workers: 2-4x CPU cores (auto-calculated)
# - graceful timeout: 120s for heavy PDF processing
CMD ["gunicorn", "app.main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "2", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "120", \
     "--graceful-timeout", "30", \
     "--keep-alive", "5", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "50", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]

# ---------------------------------------------------------------------------
# Stage: Development (override with docker compose)
# ---------------------------------------------------------------------------
FROM dependencies AS development

WORKDIR /app
COPY app/ ./app/

# Install dev dependencies
RUN pip install --no-cache-dir pytest pytest-asyncio httpx ruff mypy

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
