"""Test configuration — ensures CSRF middleware is disabled during tests.

Sets DEBUG=true before FastAPI app is loaded so CSRFMiddleware skips validation.
"""
import os


def pytest_configure(config):
    """Set DEBUG=true before any test imports to disable CSRF middleware."""
    os.environ["DEBUG"] = "true"
