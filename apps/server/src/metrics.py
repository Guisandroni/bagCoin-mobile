from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import time

webhook_requests_total = Counter(
    "webhook_requests_total",
    "Total webhook requests",
    ["platform", "status"]
)

agent_messages_processed_total = Counter(
    "agent_messages_processed_total",
    "Total agent messages processed",
    ["platform", "status"]
)

pre_register_total = Counter(
    "pre_register_total",
    "Total pre-registrations",
    ["status"]
)

webhook_latency_seconds = Histogram(
    "webhook_latency_seconds",
    "Webhook request latency",
    ["platform"],
    buckets=[.005, .01, .025, .05, .075, .1, .25, .5, .75, 1.0, 2.5, 5.0, 7.5, 10.0]
)

agent_processing_duration_seconds = Histogram(
    "agent_processing_duration_seconds",
    "Agent graph processing duration",
    buckets=[.1, .25, .5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0]
)


def metrics_response():
    return generate_latest(), CONTENT_TYPE_LATEST
