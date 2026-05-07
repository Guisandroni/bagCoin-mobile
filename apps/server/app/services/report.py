"""Report service (PostgreSQL async).

Contains business logic for report operations.
"""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.models.report import Report
from app.repositories import report as report_repo
from app.schemas.report import ReportCreate, ReportUpdate


class ReportService:
    """Service for report-related business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_report(self, report_id: int, user_uuid: UUID | None = None) -> Report:
        """Get report by ID.

        Raises:
            NotFoundError: If report does not exist or user has no access.
        """
        report = await report_repo.get_report_by_id(self.db, report_id)
        if not report:
            raise NotFoundError(
                message="Report not found",
                details={"report_id": report_id},
            )
        if user_uuid is not None and report.user_uuid is not None and report.user_uuid != user_uuid:
            raise NotFoundError(
                message="Report not found",
                details={"report_id": report_id},
            )
        return report

    async def list_reports(
        self,
        user_uuid: UUID | None = None,
        *,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[Report], int]:
        """List reports with pagination.

        Returns:
            Tuple of (reports, total_count).
        """
        items = await report_repo.get_reports_by_user(
            self.db,
            user_uuid=user_uuid,
            skip=skip,
            limit=limit,
        )
        total = await report_repo.count_reports(
            self.db,
            user_uuid=user_uuid,
        )
        return items, total

    async def create_report(
        self,
        data: ReportCreate,
        user_uuid: UUID | None = None,
        user_id: int | None = None,
    ) -> Report:
        """Create a new report."""
        return await report_repo.create_report(
            self.db,
            user_id=user_id,
            user_uuid=user_uuid,
            period_start=data.period_start,
            period_end=data.period_end,
            file_url=data.file_url,
        )

    async def delete_report(
        self,
        report_id: int,
        user_uuid: UUID | None = None,
    ) -> bool:
        """Delete a report.

        Raises:
            NotFoundError: If report does not exist or user has no access.
        """
        await self.get_report(report_id, user_uuid=user_uuid)
        deleted = await report_repo.delete_report(self.db, report_id)
        if not deleted:
            raise NotFoundError(
                message="Report not found",
                details={"report_id": report_id},
            )
        return True
