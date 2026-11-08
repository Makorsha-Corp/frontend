# Task 4 package

## app/api/v1/endpoints/production_batch_programs.py

`python
"""
Production batch program endpoints.

Create a recurring program, stop one, and list programs for a factory.
"""
from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user, get_current_workspace
from app.models.profile import Profile
from app.models.production_batch_program import ProductionBatchProgram
from app.models.workspace import Workspace
from app.schemas.production_batch_program import (
    ProductionBatchProgramCreate,
    ProductionBatchProgramResponse,
)
from app.services.production_batch_service import production_batch_service


router = APIRouter()


def _program_response(
    program: ProductionBatchProgram,
    batch_count: int,
) -> ProductionBatchProgramResponse:
    return ProductionBatchProgramResponse(
        id=program.id,
        workspace_id=program.workspace_id,
        factory_id=program.factory_id,
        formula_id=program.formula_id,
        first_start_at=program.first_start_at,
        cadence=program.cadence,
        end_date=program.end_date,
        status=program.status,
        created_by=program.created_by,
        created_at=program.created_at,
        batch_count=batch_count,
    )


def _responses_with_counts(
    db: Session,
    workspace_id: int,
    programs: List[ProductionBatchProgram],
) -> List[ProductionBatchProgramResponse]:
    counts = production_batch_service.program_batch_counts(
        db,
        program_ids=[program.id for program in programs],
        workspace_id=workspace_id,
    )
    return [
        _program_response(program, counts.get(program.id, 0))
        for program in programs
    ]


@router.post(
    "/",
    response_model=ProductionBatchProgramResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create production batch program",
    description="""
    Create a recurring program and one draft batch per occurrence.
    Returns the program plus batch_count.
    """,
)
def create_program(
    program_in: ProductionBatchProgramCreate,
    workspace: Workspace = Depends(get_current_workspace),
    current_user: Profile = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a program and its draft batches."""
    program = production_batch_service.create_program(
        db,
        factory_id=program_in.factory_id,
        formula_id=program_in.formula_id,
        first_start_at=program_in.first_start_at,
        cadence=program_in.cadence,
        end_date=program_in.end_date,
        workspace_id=workspace.id,
        user_id=current_user.id,
    )
    return _responses_with_counts(db, workspace.id, [program])[0]


@router.post(
    "/{program_id}/stop/",
    response_model=ProductionBatchProgramResponse,
    status_code=status.HTTP_200_OK,
    summary="Stop production batch program",
    description="Stop a program and cancel its draft batches.",
)
def stop_program(
    program_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    current_user: Profile = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Stop a program."""
    program = production_batch_service.stop_program(
        db, program_id, workspace.id, current_user.id
    )
    return _responses_with_counts(db, workspace.id, [program])[0]


@router.get(
    "/",
    response_model=List[ProductionBatchProgramResponse],
    status_code=status.HTTP_200_OK,
    summary="List production batch programs",
    description="Programs for one factory in the current workspace.",
)
def get_programs(
    factory_id: int = Query(..., description="Factory whose programs to list"),
    workspace: Workspace = Depends(get_current_workspace),
    current_user: Profile = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List programs for a factory in this workspace."""
    programs = production_batch_service.get_programs(
        db, workspace_id=workspace.id, factory_id=factory_id
    )
    return _responses_with_counts(db, workspace.id, programs)

`

## tests/test_production_batch_program_api.py

`python
"""HTTP contract for production batch program routes."""
from datetime import date, datetime
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.core.deps import get_current_active_user, get_current_workspace, get_db
from app.core.exceptions import BusinessRuleError
from app.main import app
from app.models.production_batch_program import ProductionBatchProgram
from app.models.profile import Profile
from app.models.workspace import Workspace
from app.services.production_batch_service import ProductionBatchService


def _program(**overrides) -> ProductionBatchProgram:
    program = ProductionBatchProgram(
        id=4,
        workspace_id=10,
        factory_id=3,
        formula_id=8,
        first_start_at=datetime(2026, 10, 5, 6, 0),
        cadence="weekly",
        end_date=date(2026, 10, 19),
        status="active",
        created_by=5,
        created_at=datetime(2026, 10, 5, 5, 0),
    )
    for key, value in overrides.items():
        setattr(program, key, value)
    return program


def _client():
    user = Profile(
        id=5,
        name="Workspace User",
        email="m@t.com",
        user_id="u5",
        hashed_password="x",
    )
    workspace = Workspace(id=10, name="Acme", slug="acme")
    app.dependency_overrides[get_current_active_user] = lambda: user
    app.dependency_overrides[get_current_workspace] = lambda: workspace
    app.dependency_overrides[get_db] = lambda: MagicMock()
    return TestClient(app)


def test_create_program_returns_201_and_batch_count():
    program = _program()
    client = _client()
    try:
        with (
            patch(
                "app.api.v1.endpoints.production_batch_programs.production_batch_service.create_program",
                return_value=program,
            ) as create_program,
            patch(
                "app.api.v1.endpoints.production_batch_programs.production_batch_service.program_batch_counts",
                return_value={4: 3},
            ),
        ):
            response = client.post(
                "/api/v1/production-batch-programs/",
                json={
                    "factory_id": 3,
                    "formula_id": 8,
                    "first_start_at": "2026-10-05T06:00:00",
                    "cadence": "weekly",
                    "end_date": "2026-10-19",
                },
            )
        assert response.status_code == 201
        body = response.json()
        assert body["id"] == 4
        assert body["factory_id"] == 3
        assert body["batch_count"] == 3
        assert create_program.call_args.kwargs["workspace_id"] == 10
        assert create_program.call_args.kwargs["user_id"] == 5
        assert create_program.call_args.kwargs["cadence"] == "weekly"
    finally:
        app.dependency_overrides.clear()


def test_stop_program_returns_program():
    program = _program(status="stopped")
    client = _client()
    try:
        with (
            patch(
                "app.api.v1.endpoints.production_batch_programs.production_batch_service.stop_program",
                return_value=program,
            ) as stop_program,
            patch(
                "app.api.v1.endpoints.production_batch_programs.production_batch_service.program_batch_counts",
                return_value={4: 3},
            ),
        ):
            response = client.post("/api/v1/production-batch-programs/4/stop/")
        assert response.status_code == 200
        assert response.json()["status"] == "stopped"
        assert response.json()["id"] == 4
        stop_program.assert_called_once()
        assert stop_program.call_args.args[1:] == (4, 10, 5)
    finally:
        app.dependency_overrides.clear()


def test_list_programs_filters_factory_in_workspace():
    program = _program()
    client = _client()
    try:
        with (
            patch(
                "app.api.v1.endpoints.production_batch_programs.production_batch_service.get_programs",
                return_value=[program],
            ) as get_programs,
            patch(
                "app.api.v1.endpoints.production_batch_programs.production_batch_service.program_batch_counts",
                return_value={4: 3},
            ) as counts,
        ):
            response = client.get("/api/v1/production-batch-programs/?factory_id=3")
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["factory_id"] == 3
        assert body[0]["batch_count"] == 3
        assert get_programs.call_args.kwargs == {"workspace_id": 10, "factory_id": 3}
        assert counts.call_args.kwargs["workspace_id"] == 10
        assert counts.call_args.kwargs["program_ids"] == [4]
    finally:
        app.dependency_overrides.clear()


def test_create_program_business_rule_error_is_not_rewrapped():
    client = _client()
    try:
        with patch(
            "app.api.v1.endpoints.production_batch_programs.production_batch_service.create_program",
            side_effect=BusinessRuleError("Recipe has no steps"),
        ):
            response = client.post(
                "/api/v1/production-batch-programs/",
                json={
                    "factory_id": 3,
                    "formula_id": 8,
                    "first_start_at": "2026-10-05T06:00:00",
                    "cadence": "weekly",
                    "end_date": "2026-10-19",
                },
            )
        assert response.status_code == 422
        assert response.json()["detail"] == "Recipe has no steps"
    finally:
        app.dependency_overrides.clear()


def test_service_get_programs_is_workspace_and_factory_scoped():
    service = ProductionBatchService()
    db = MagicMock()
    service.batch_manager = MagicMock()
    service.batch_manager.get_programs.return_value = []

    result = service.get_programs(db, workspace_id=1, factory_id=3)

    assert result == []
    service.batch_manager.get_programs.assert_called_once_with(
        db, workspace_id=1, factory_id=3
    )

`

## router hits

`
47:     production_batch_programs,
144:     production_batch_programs.router,
`
