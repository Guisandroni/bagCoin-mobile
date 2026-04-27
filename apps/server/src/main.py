from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1.router import router as api_router
from .config import settings
from .core.logging import logger, configure_logging


def _run_migrations():
    """Run Alembic migrations synchronously in a separate thread."""
    import alembic.config
    import alembic.command
    alembic_cfg = alembic.config.Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    alembic.command.upgrade(alembic_cfg, "head")


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info("server_starting")

    import asyncio
    try:
        await asyncio.to_thread(_run_migrations)
        logger.info("migrations_completed")
    except Exception as e:
        logger.error("migration_failed", error=str(e))
        # Don't crash the server if migrations fail; health check will show DB status

    yield

    logger.info("server_shutting_down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Agent Financeiro Multi-Platform",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PUT", "PATCH"],
        allow_headers=["Content-Type", "Authorization", "Accept"],
        expose_headers=["*"],
    )

    @app.middleware("http")
    async def log_requests(request, call_next):
        logger.info(
            "incoming_request",
            method=request.method,
            path=request.url.path,
        )
        response = await call_next(request)
        logger.info(
            "request_completed",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
        )
        return response

    app.include_router(api_router)

    return app


app = create_app()
