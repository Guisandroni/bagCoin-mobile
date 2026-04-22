from celery import Celery
from .config import settings

REDIS_URL = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "agent_finance",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["src.tasks.agent_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max per task
    worker_prefetch_multiplier=1,  # Fair task distribution
    result_expires=3600,  # Results expire after 1 hour
)
