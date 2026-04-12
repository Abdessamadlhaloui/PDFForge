from __future__ import annotations

import json

from pathlib import Path

from typing import Literal

from pydantic import field_validator

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):

    model_config = SettingsConfigDict(

        env_file=".env",

        env_file_encoding="utf-8",

        case_sensitive=False,

        extra="ignore",

    )

    app_env: Literal["development", "staging", "production"] = "development"

    app_host: str = "0.0.0.0"

    app_port: int = 8000

    app_title: str = "PDFForge API"

    app_version: str = "1.0.0"

    debug: bool = False

    max_upload_size_mb: int = 100

    temp_file_ttl_minutes: int = 30

    temp_dir: str = "/tmp/pdfforge"

    max_files_per_request: int = 20

    redis_url: str = "redis://localhost:6379/0"

    celery_broker_url: str = "redis://localhost:6379/1"

    celery_result_backend: str = "redis://localhost:6379/2"

    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    @field_validator("cors_origins", mode="before")

    @classmethod

    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:

        if isinstance(v, str):

            try:

                return json.loads(v)

            except json.JSONDecodeError:

                return [origin.strip() for origin in v.split(",")]

        return v

    rate_limit_per_minute: int = 60

    ghostscript_path: str = "gs"

    libreoffice_path: str = "soffice"

    tesseract_path: str = "tesseract"

    enable_ai_features: bool = False

    ai_model_name: str = "facebook/bart-large-cnn"

    embedding_model: str = "all-MiniLM-L6-v2"

    ai_device: str = "cpu"

    xai_api_key: str | None = None

    groq_api_key: str | None = None

    allowed_extensions: list[str] = [

        ".pdf", ".doc", ".docx", ".xls", ".xlsx",

        ".ppt", ".pptx", ".jpg", ".jpeg", ".png",

        ".tiff", ".bmp", ".webp",

    ]

    @field_validator("allowed_extensions", mode="before")

    @classmethod

    def parse_extensions(cls, v: str | list[str]) -> list[str]:

        if isinstance(v, str):

            return [ext.strip() for ext in v.split(",")]

        return v

    @property

    def max_upload_size_bytes(self) -> int:

        return self.max_upload_size_mb * 1024 * 1024

    @property

    def temp_path(self) -> Path:

        path = Path(self.temp_dir)

        path.mkdir(parents=True, exist_ok=True)

        return path

    @property

    def is_production(self) -> bool:

        return self.app_env == "production"

settings = Settings()
