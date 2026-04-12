from __future__ import annotations

from datetime import datetime

from enum import Enum

from typing import Any

from pydantic import BaseModel, Field

class TaskStatus(str, Enum):

    PENDING = "pending"

    PROCESSING = "processing"

    COMPLETED = "completed"

    FAILED = "failed"

class CompressionQuality(str, Enum):

    SCREEN = "screen"

    EBOOK = "ebook"

    PRINTER = "printer"

    PREPRESS = "prepress"

class ConvertFormat(str, Enum):

    DOCX = "docx"

    XLSX = "xlsx"

    PPTX = "pptx"

    JPG = "jpg"

    PNG = "png"

    TIFF = "tiff"

    WEBP = "webp"

    PDF = "pdf"

class WatermarkPosition(str, Enum):

    CENTER = "center"

    TOP_LEFT = "top-left"

    TOP_RIGHT = "top-right"

    BOTTOM_LEFT = "bottom-left"

    BOTTOM_RIGHT = "bottom-right"

    DIAGONAL = "diagonal"

class BaseResponse(BaseModel):

    success: bool = True

    message: str = "Operation completed successfully"

    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ErrorResponse(BaseModel):

    success: bool = False

    error: str

    message: str

    detail: str | None = None

    timestamp: datetime = Field(default_factory=datetime.utcnow)

class HealthResponse(BaseModel):

    status: str = "healthy"

    version: str

    environment: str

    services: dict[str, str] = Field(default_factory=dict)

    uptime_seconds: float

class FileInfo(BaseModel):

    file_id: str

    filename: str

    size_bytes: int

    mime_type: str

    page_count: int | None = None

    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProcessingResult(BaseResponse):

    file_id: str

    filename: str

    original_size: int

    processed_size: int

    download_url: str

    expires_at: datetime

    metadata: dict[str, Any] = Field(default_factory=dict)

class BatchProcessingResult(BaseResponse):

    files: list[ProcessingResult]

    total_original_size: int

    total_processed_size: int

class TaskResponse(BaseResponse):

    task_id: str

    status: TaskStatus = TaskStatus.PENDING

    poll_url: str

class TaskStatusResponse(BaseModel):

    task_id: str

    status: TaskStatus

    progress: float = Field(ge=0, le=100, default=0)

    message: str = ""

    result: ProcessingResult | None = None

    error: str | None = None

    created_at: datetime

    updated_at: datetime

class MergeRequest(BaseModel):

    pass

class SplitRequest(BaseModel):

    ranges: list[str] = Field(

        ...,

        description="Page ranges to extract, e.g. ['1-3', '5', '7-10']",

        examples=[["1-3", "5", "7-10"]],

    )

class CompressRequest(BaseModel):

    quality: CompressionQuality = Field(

        default=CompressionQuality.EBOOK,

    )

class RotateRequest(BaseModel):

    pages: list[int] = Field(..., examples=[[1, 3, 5]])

    angle: int = Field(default=90)

class DeletePagesRequest(BaseModel):

    pages: list[int] = Field(..., examples=[[2, 4, 6]])

class ReorderRequest(BaseModel):

    page_order: list[int] = Field(..., examples=[[3, 1, 2, 4]])

class ExtractPagesRequest(BaseModel):

    start_page: int = Field(..., ge=1)

    end_page: int = Field(..., ge=1)

class WatermarkRequest(BaseModel):

    text: str = Field(..., max_length=200)

    position: WatermarkPosition = WatermarkPosition.DIAGONAL

    opacity: float = Field(default=0.3, ge=0.05, le=1.0)

    font_size: int = Field(default=48, ge=8, le=200)

    color: str = Field(default="#808080")

    rotation: float = Field(default=45.0, ge=0, le=360)

class ProtectRequest(BaseModel):

    user_password: str = Field(..., min_length=1, max_length=128)

    owner_password: str | None = Field(None, max_length=128)

    allow_printing: bool = True

    allow_copying: bool = False

class UnlockRequest(BaseModel):

    password: str = Field(..., min_length=1, max_length=128)

class RedactRequest(BaseModel):

    search_terms: list[str] = Field(

        ...,

        examples=[["SSN", "123-45-6789", "confidential"]],

    )

    redact_color: str = Field(default="#000000")

    use_regex: bool = Field(default=False)

class ExtractTextRequest(BaseModel):

    pages: list[int] | None = Field(None)

    layout: bool = Field(default=False)

class ConvertRequest(BaseModel):

    output_format: ConvertFormat

    dpi: int = Field(default=200, ge=72, le=600)

    quality: int = Field(default=85, ge=1, le=100)

class SummarizeRequest(BaseModel):

    max_length: int = Field(default=500, ge=50, le=5000)

    min_length: int = Field(default=100, ge=20, le=1000)

    language: str = Field(default="en", max_length=5)

class ChatRequest(BaseModel):

    question: str = Field(..., max_length=2000)

    context_window: int = Field(default=5, ge=1, le=20)

class TranslateRequest(BaseModel):

    source_language: str = Field(default="auto", max_length=5)

    target_language: str = Field(..., max_length=5)

class SearchRequest(BaseModel):

    query: str = Field(..., max_length=500)

    top_k: int = Field(default=5, ge=1, le=20)

class SummarizeResponse(BaseResponse):

    summary: str

    word_count: int

    page_count: int

    language: str

class ChatResponse(BaseResponse):

    answer: str

    sources: list[dict[str, Any]] = Field(default_factory=list)

    confidence: float = Field(ge=0, le=1)

class TranslateResponse(BaseResponse):

    file_id: str

    download_url: str

    source_language: str

    target_language: str

class SearchResponse(BaseResponse):

    results: list[dict[str, Any]]

    total_matches: int

class PDFMetadata(BaseModel):

    filename: str

    page_count: int

    file_size: int

    title: str | None = None

    author: str | None = None

    subject: str | None = None

    creator: str | None = None

    producer: str | None = None

    creation_date: str | None = None

    modification_date: str | None = None

    is_encrypted: bool = False

    has_text: bool = True

class OCRRequest(BaseModel):

    languages: list[str] = Field(

        default=["eng"],

        examples=[["eng", "fra", "deu"]],

    )

    dpi: int = Field(default=300, ge=72, le=600)
