from __future__ import annotations

import logging

import sys

import structlog

from app.core.config import settings

def setup_logging() -> None:

    shared_processors: list[structlog.types.Processor] = [

        structlog.contextvars.merge_contextvars,

        structlog.stdlib.add_logger_name,

        structlog.stdlib.add_log_level,

        structlog.stdlib.PositionalArgumentsFormatter(),

        structlog.processors.TimeStamper(fmt="iso"),

        structlog.processors.StackInfoRenderer(),

        structlog.processors.UnicodeDecoder(),

    ]

    if settings.is_production:

        processors = shared_processors + [

            structlog.processors.format_exc_info,

            structlog.processors.JSONRenderer(),

        ]

    else:

        processors = shared_processors + [

            structlog.dev.ConsoleRenderer(colors=True),

        ]

    structlog.configure(

        processors=processors,

        wrapper_class=structlog.stdlib.BoundLogger,

        context_class=dict,

        logger_factory=structlog.stdlib.LoggerFactory(),

        cache_logger_on_first_use=True,

    )

    log_level = logging.DEBUG if settings.debug else logging.INFO

    logging.basicConfig(

        format="%(message)s",

        stream=sys.stdout,

        level=log_level,

    )

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    logging.getLogger("celery").setLevel(logging.INFO)

def get_logger(name: str) -> structlog.stdlib.BoundLogger:

    return structlog.get_logger(name)
