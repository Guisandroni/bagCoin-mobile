"""Report REST endpoints for web frontend."""

from typing import Any

from fastapi import APIRouter, Body, Query, status

from app.api.deps import CurrentUser, DBSession
from app.schemas.report import ReportGenerateRequest
from app.services import report_rest as report_service

router = APIRouter(prefix="/bagcoin/reports", tags=["bagcoin"])


@router.get("")
async def list_reports(
    current_user: CurrentUser,
    db: DBSession,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> Any:
    """List reports for the authenticated user."""
    return await report_service.list_reports(db, current_user.id, skip=skip, limit=limit)


@router.post("", status_code=status.HTTP_201_CREATED)
async def generate_report(
    body: ReportGenerateRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """Generate a new financial report."""
    return await report_service.generate_report_for_web_user(
        db,
        current_user.id,
        month=body.month,
        year=body.year,
        report_type=body.report_type,
    )


@router.get("/{report_id}/download")
async def download_report(
    report_id: int,
    current_user: CurrentUser,
    db: DBSession,
) -> Any:
    """Download a report PDF."""
    return await report_service.get_report_download(db, report_id, current_user.id)


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: int,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    """Delete a report."""
    await report_service.delete_report(db, report_id, current_user.id)
