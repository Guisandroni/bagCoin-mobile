FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libmagic1 \
    libpq-dev \
    gcc \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy project files
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-cache

COPY src ./src
COPY alembic.ini ./
COPY alembic ./alembic
COPY .env ./

ENV UV_PROJECT_ENVIRONMENT=/app/.venv
ENV UV_NO_SYNC=1

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
