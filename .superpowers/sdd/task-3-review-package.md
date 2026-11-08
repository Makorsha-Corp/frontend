# Task 3 package after factory-check fix

## app/schemas/production_batch_program.py

`python
"""Production batch program schemas."""
from datetime import date, datetime

from pydantic import BaseModel


class ProductionBatchProgramCreate(BaseModel):
    """Fields a caller sends to start a recurring batch program."""

    factory_id: int
    formula_id: int
    first_start_at: datetime
    cadence: str
    end_date: date

`

## tests/test_production_batch_program.py

`python
from contextlib import contextmanager
from datetime import date, datetime
from unittest.mock import MagicMock, patch

import pytest

from app.dao.production_batch import production_batch_dao
from app.dao.production_formula_stage import production_formula_stage_dao
from app.managers.production_batch_manager import ProductionBatchManager
from app.services.production_batch_service import ProductionBatchService


@pytest.fixture(autouse=True)
def _restore_shared_dao_methods():
    """Brief tests patch DAO methods on the process-wide singletons."""
    stage_get = production_formula_stage_dao.get_by_formula
    batch_get = getattr(production_batch_dao, "get_by_program", None)
    yield
    production_formula_stage_dao.get_by_formula = stage_get
    if batch_get is None:
        if "get_by_program" in production_batch_dao.__dict__:
            del production_batch_dao.__dict__["get_by_program"]
    else:
        production_batch_dao.get_by_program = batch_get


@contextmanager
def _same_factory_line(line_id: int, factory_id: int = 3):
    """Workspace factory and a line in that factory. Success-path creates need both."""
    factory = MagicMock(id=factory_id)
    line = MagicMock(id=line_id, factory_id=factory_id, name="Line")
    with (
        patch(
            "app.managers.production_batch_manager.factory_dao.get_by_id_and_workspace",
            return_value=factory,
        ),
        patch(
            "app.managers.production_batch_manager.production_line_dao.get_by_id_and_workspace",
            return_value=line,
        ),
    ):
        yield


def test_create_program_calls_create_batch_per_week():
    manager = ProductionBatchManager()
    session = MagicMock()
    stage = MagicMock(production_line_id=4, route_step_id=None, is_used=True, stage_order=1)
    manager.formula_stage_dao.get_by_formula = MagicMock(return_value=[stage])
    created = []

    def _create(session, batch_in, workspace_id, user_id):
        created.append(batch_in)
        batch = MagicMock(id=len(created), planned_start_at=batch_in.planned_start_at)
        return batch

    manager.create_batch = _create
    manager.program_dao.create = MagicMock(side_effect=lambda session, obj_in: MagicMock(id=9, **obj_in))

    with _same_factory_line(4):
        manager.create_program(
            session,
            factory_id=3,
            formula_id=8,
            first_start_at=datetime(2026, 10, 5, 6, 0),
            cadence="weekly",
            end_date=date(2026, 10, 19),
            workspace_id=1,
            user_id=2,
        )

    assert [row.planned_start_at for row in created] == [
        datetime(2026, 10, 5, 6, 0),
        datetime(2026, 10, 12, 6, 0),
        datetime(2026, 10, 19, 6, 0),
    ]
    assert all(row.production_line_id == 4 and row.formula_id == 8 for row in created)
    assert all(row.batch_date == row.planned_start_at.date() and row.status == "draft" for row in created)
    assert all(row.stage_seeds in (None, []) for row in created)
    session.flush.assert_called()


def test_create_program_rejects_before_any_batch_when_over_cap():
    manager = ProductionBatchManager()
    manager.create_batch = MagicMock()
    # Line is resolved before occurrence_starts. Stub a step so the cap error is the one that fires.
    stage = MagicMock(production_line_id=4, route_step_id=None, is_used=True, stage_order=1)
    manager.formula_stage_dao.get_by_formula = MagicMock(return_value=[stage])
    with pytest.raises(ValueError, match="366"):
        manager.create_program(
            MagicMock(),
            factory_id=3,
            formula_id=8,
            first_start_at=datetime(2026, 1, 1, 0, 0),
            cadence="daily",
            end_date=date(2027, 1, 2),
            workspace_id=1,
            user_id=2,
        )
    manager.create_batch.assert_not_called()


def test_create_program_rejects_recipe_with_no_steps():
    manager = ProductionBatchManager()
    manager.create_batch = MagicMock()
    unused = MagicMock(production_line_id=4, route_step_id=None, is_used=False, stage_order=1)
    manager.formula_stage_dao.get_by_formula = MagicMock(return_value=[unused])
    with pytest.raises(ValueError, match="Recipe has no steps"):
        manager.create_program(
            MagicMock(),
            factory_id=3,
            formula_id=8,
            first_start_at=datetime(2026, 10, 5, 6, 0),
            cadence="weekly",
            end_date=date(2026, 10, 19),
            workspace_id=1,
            user_id=2,
        )
    manager.create_batch.assert_not_called()


def test_create_program_rejects_when_steps_have_no_line():
    manager = ProductionBatchManager()
    manager.create_batch = MagicMock()
    stage = MagicMock(production_line_id=None, route_step_id=None, is_used=True, stage_order=1)
    manager.formula_stage_dao.get_by_formula = MagicMock(return_value=[stage])
    with pytest.raises(ValueError, match="Recipe steps have no production line"):
        manager.create_program(
            MagicMock(),
            factory_id=3,
            formula_id=8,
            first_start_at=datetime(2026, 10, 5, 6, 0),
            cadence="weekly",
            end_date=date(2026, 10, 19),
            workspace_id=1,
            user_id=2,
        )
    manager.create_batch.assert_not_called()


def test_create_program_uses_first_included_step_that_has_a_line():
    manager = ProductionBatchManager()
    session = MagicMock()
    skipped = MagicMock(production_line_id=None, route_step_id=None, is_used=False, stage_order=1)
    lineless = MagicMock(production_line_id=None, route_step_id=None, is_used=True, stage_order=2)
    routed = MagicMock(production_line_id=4, route_step_id=11, is_used=True, stage_order=3)
    later = MagicMock(production_line_id=9, route_step_id=None, is_used=True, stage_order=4)
    manager.formula_stage_dao.get_by_formula = MagicMock(
        return_value=[later, skipped, lineless, routed]
    )
    created = []

    def _create(session, batch_in, workspace_id, user_id):
        created.append(batch_in)
        return MagicMock(id=1, planned_start_at=batch_in.planned_start_at)

    manager.create_batch = _create
    manager.program_dao.create = MagicMock(side_effect=lambda session, obj_in: MagicMock(id=9, **obj_in))
    route_step = MagicMock(production_line_id=7)

    with (
        patch(
            "app.managers.production_batch_manager.production_route_step_dao.get_by_id_and_workspace",
            return_value=route_step,
        ),
        _same_factory_line(7),
    ):
        manager.create_program(
            session,
            factory_id=3,
            formula_id=8,
            first_start_at=datetime(2026, 10, 5, 6, 0),
            cadence="weekly",
            end_date=date(2026, 10, 5),
            workspace_id=1,
            user_id=2,
        )

    assert len(created) == 1
    assert created[0].production_line_id == 7
    assert created[0].stage_seeds in (None, [])


def test_create_program_rejects_missing_factory_before_create_batch():
    manager = ProductionBatchManager()
    manager.create_batch = MagicMock()
    manager.program_dao.create = MagicMock()
    stage = MagicMock(production_line_id=4, route_step_id=None, is_used=True, stage_order=1)
    manager.formula_stage_dao.get_by_formula = MagicMock(return_value=[stage])
    with patch(
        "app.managers.production_batch_manager.factory_dao.get_by_id_and_workspace",
        return_value=None,
    ):
        with pytest.raises(ValueError, match="Factory 3 not found"):
            manager.create_program(
                MagicMock(),
                factory_id=3,
                formula_id=8,
                first_start_at=datetime(2026, 10, 5, 6, 0),
                cadence="weekly",
                end_date=date(2026, 10, 5),
                workspace_id=1,
                user_id=2,
            )
    manager.create_batch.assert_not_called()
    manager.program_dao.create.assert_not_called()


def test_create_program_rejects_line_in_other_factory_before_create_batch():
    manager = ProductionBatchManager()
    manager.create_batch = MagicMock()
    manager.program_dao.create = MagicMock()
    stage = MagicMock(production_line_id=4, route_step_id=None, is_used=True, stage_order=1)
    manager.formula_stage_dao.get_by_formula = MagicMock(return_value=[stage])
    other_line = MagicMock(id=4, factory_id=99, name="Carding")
    with (
        patch(
            "app.managers.production_batch_manager.factory_dao.get_by_id_and_workspace",
            return_value=MagicMock(id=3),
        ),
        patch(
            "app.managers.production_batch_manager.production_line_dao.get_by_id_and_workspace",
            return_value=other_line,
        ),
    ):
        with pytest.raises(ValueError, match="not in this factory"):
            manager.create_program(
                MagicMock(),
                factory_id=3,
                formula_id=8,
                first_start_at=datetime(2026, 10, 5, 6, 0),
                cadence="weekly",
                end_date=date(2026, 10, 5),
                workspace_id=1,
                user_id=2,
            )
    manager.create_batch.assert_not_called()
    manager.program_dao.create.assert_not_called()


def test_stop_program_cancels_only_drafts():
    manager = ProductionBatchManager()
    session = MagicMock()
    program = MagicMock(status="active")
    draft = MagicMock(status="draft")
    in_progress = MagicMock(status="in_progress")
    manager.program_dao.get_by_id_and_workspace = MagicMock(return_value=program)
    manager.batch_dao.get_by_program = MagicMock(return_value=[draft, in_progress])

    result = manager.stop_program(session, 9, 1, 2)

    assert result is program
    assert program.status == "stopped"
    assert draft.status == "cancelled"
    assert in_progress.status == "in_progress"
    manager.program_dao.get_by_id_and_workspace.assert_called_once_with(
        session, id=9, workspace_id=1
    )
    manager.batch_dao.get_by_program.assert_called_once_with(
        session, program_id=9, workspace_id=1
    )
    session.flush.assert_called()


def test_service_create_program_commits_once():
    service = ProductionBatchService()
    db = MagicMock()
    program = MagicMock()
    service.batch_manager = MagicMock()
    service.batch_manager.create_program.return_value = program
    service._commit_transaction = MagicMock()
    service._rollback_transaction = MagicMock()

    result = service.create_program(
        db,
        factory_id=3,
        formula_id=8,
        first_start_at=datetime(2026, 10, 5, 6, 0),
        cadence="weekly",
        end_date=date(2026, 10, 19),
        workspace_id=1,
        user_id=2,
    )

    service.batch_manager.create_program.assert_called_once_with(
        db,
        factory_id=3,
        formula_id=8,
        first_start_at=datetime(2026, 10, 5, 6, 0),
        cadence="weekly",
        end_date=date(2026, 10, 19),
        workspace_id=1,
        user_id=2,
    )
    service._commit_transaction.assert_called_once_with(db)
    db.refresh.assert_called_once_with(program)
    service._rollback_transaction.assert_not_called()
    assert result is program


def test_service_create_program_rolls_back_on_value_error():
    service = ProductionBatchService()
    db = MagicMock()
    service.batch_manager = MagicMock()
    service.batch_manager.create_program.side_effect = ValueError("Recipe has no steps")
    service._commit_transaction = MagicMock()
    service._rollback_transaction = MagicMock()

    with pytest.raises(Exception, match="Recipe has no steps"):
        service.create_program(
            db,
            factory_id=3,
            formula_id=8,
            first_start_at=datetime(2026, 10, 5, 6, 0),
            cadence="weekly",
            end_date=date(2026, 10, 19),
            workspace_id=1,
            user_id=2,
        )

    service._commit_transaction.assert_not_called()
    service._rollback_transaction.assert_called_once_with(db)

`

## app/managers/production_batch_manager.py excerpts

### create_program 346-398

`python
    def create_program(
        self,
        session: Session,
        *,
        factory_id: int,
        formula_id: int,
        first_start_at: datetime,
        cadence: str,
        end_date: date,
        workspace_id: int,
        user_id: int,
    ) -> ProductionBatchProgram:
        """
        Create one program and a draft batch per occurrence.

        Does not commit. Resolves the batch line, then occurrence starts,
        then calls create_batch. program_id is set after each create.
        """
        line_id = self._program_batch_line_id(
            session, formula_id=formula_id, workspace_id=workspace_id
        )
        starts = occurrence_starts(first_start_at, cadence, end_date)
        self._require_program_factory_line(
            session,
            factory_id=factory_id,
            line_id=line_id,
            workspace_id=workspace_id,
        )
        program = self.program_dao.create(
            session,
            obj_in={
                "workspace_id": workspace_id,
                "factory_id": factory_id,
                "formula_id": formula_id,
                "first_start_at": first_start_at,
                "cadence": cadence,
                "end_date": end_date,
                "status": "active",
                "created_by": user_id,
            },
        )
        for start in starts:
            batch_in = ProductionBatchCreate(
                production_line_id=line_id,
                formula_id=formula_id,
                planned_start_at=start,
                batch_date=start.date(),
                status="draft",
            )
            batch = self.create_batch(session, batch_in, workspace_id, user_id)
            batch.program_id = program.id
            session.flush()
        return program
`

### stop_program 400-421

`python
    def stop_program(
        self,
        session: Session,
        program_id: int,
        workspace_id: int,
        user_id: int,
    ) -> ProductionBatchProgram:
        """Mark the program stopped and cancel its draft batches. Does not commit."""
        program = self.program_dao.get_by_id_and_workspace(
            session, id=program_id, workspace_id=workspace_id
        )
        if program is None:
            raise ValueError(f"Production batch program {program_id} not found")
        program.status = "stopped"
        batches = self.batch_dao.get_by_program(
            session, program_id=program_id, workspace_id=workspace_id
        )
        for batch in batches:
            if batch.status == "draft":
                batch.status = "cancelled"
        session.flush()
        return program
`

## app/services/production_batch_service.py excerpts

### create_program 60-92

`python
    def create_program(
        self,
        db: Session,
        *,
        factory_id: int,
        formula_id: int,
        first_start_at: datetime,
        cadence: str,
        end_date: date,
        workspace_id: int,
        user_id: int,
    ) -> ProductionBatchProgram:
        """Create a program and its draft batches in one transaction."""
        try:
            program = self.batch_manager.create_program(
                db,
                factory_id=factory_id,
                formula_id=formula_id,
                first_start_at=first_start_at,
                cadence=cadence,
                end_date=end_date,
                workspace_id=workspace_id,
                user_id=user_id,
            )
            self._commit_transaction(db)
            db.refresh(program)
            return program
        except ValueError as e:
            self._rollback_transaction(db)
            raise BusinessRuleError(str(e))
        except Exception:
            self._rollback_transaction(db)
            raise
`

### stop_program 94-114

`python
    def stop_program(
        self,
        db: Session,
        program_id: int,
        workspace_id: int,
        user_id: int,
    ) -> ProductionBatchProgram:
        """Stop a program and cancel its draft batches in one transaction."""
        try:
            program = self.batch_manager.stop_program(
                db, program_id, workspace_id, user_id
            )
            self._commit_transaction(db)
            db.refresh(program)
            return program
        except ValueError as e:
            self._rollback_transaction(db)
            raise BusinessRuleError(str(e))
        except Exception:
            self._rollback_transaction(db)
            raise
`
