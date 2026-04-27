from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

webhook_requests_total = Counter(
    "webhook_requests_total",
    "Total webhook requests",
    ["platform", "status"],
)

agent_messages_processed_total = Counter(
    "agent_messages_processed_total",
    "Total agent messages processed",
    ["platform", "status"],
)

agent_processing_duration_seconds = Histogram(
    "agent_processing_duration_seconds",
    "Agent message processing duration",
    ["platform"],
)

pre_register_total = Counter(
    "pre_register_total",
    "Total pre-registrations",
    ["status"],
)

webhook_latency_seconds = Histogram(
    "webhook_latency_seconds",
    "Webhook processing latency",
    ["platform"],
)


def metrics_response():
    data = generate_latest()
    return data, CONTENT_TYPE_LATEST
