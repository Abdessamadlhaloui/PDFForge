from __future__ import annotations

from celery import Celery

from kombu import Exchange, Queue

from app.core.config import settings

celery_app = Celery(

    "pdfforge",

    broker=settings.celery_broker_url,

    backend=settings.celery_result_backend,

)

celery_app.conf.update(

    task_serializer="json",

    accept_content=["json"],

    result_serializer="json",

    timezone="UTC",

    enable_utc=True,

    task_track_started=True,

    task_time_limit=600,

    task_soft_time_limit=540,

    task_acks_late=True,

    task_reject_on_worker_lost=True,

    worker_prefetch_multiplier=1,

    worker_max_tasks_per_child=50,

    worker_send_task_events=True,

    result_expires=1800,

    result_extended=True,

    task_default_queue="default",

    task_queues=(

        Queue("default", Exchange("default"), routing_key="default"),

        Queue("ai", Exchange("ai"), routing_key="ai",

              queue_arguments={"x-max-priority": 5}),

        Queue("conversion", Exchange("conversion"), routing_key="conversion"),

        Queue("ocr", Exchange("ocr"), routing_key="ocr"),

    ),

    task_routes={

        "app.services.ai_service.*": {"queue": "ai"},

        "app.services.convert_service.*": {"queue": "conversion"},

        "app.services.ocr_service.*": {"queue": "ocr"},

    },

)

celery_app.autodiscover_tasks(["app.services"])
