# Task 2 uncommitted package

## app/models/production_batch_program.py

`
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String

from app.db.base_class import Base
from app.utils.time import utcnow


class ProductionBatchProgram(Base):
    __tablename__ = "production_batch_programs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id", ondelete="CASCADE"), nullable=False, index=True)
    formula_id = Column(Integer, ForeignKey("production_formulas.id", ondelete="RESTRICT"), nullable=False, index=True)
    first_start_at = Column(DateTime, nullable=False)
    cadence = Column(String(16), nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(16), nullable=False, default="active", index=True)
    created_by = Column(Integer, ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)

`

## alembic/versions/146_production_batch_programs.py

`
"""Production batch programs and batch program_id.

Revision ID: 146_production_batch_programs
Revises: 145_stage_log_planned_start_at
Create Date: 2026-10-25
"""
import sqlalchemy as sa
from alembic import op

revision = "146_production_batch_programs"
down_revision = "145_stage_log_planned_start_at"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "production_batch_programs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("factory_id", sa.Integer(), nullable=False),
        sa.Column("formula_id", sa.Integer(), nullable=False),
        sa.Column("first_start_at", sa.DateTime(), nullable=False),
        sa.Column("cadence", sa.String(length=16), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["workspace_id"], ["workspaces.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["factory_id"], ["factories.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["formula_id"], ["production_formulas.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["created_by"], ["profiles.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_production_batch_programs_workspace_id",
        "production_batch_programs",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        "ix_production_batch_programs_factory_id",
        "production_batch_programs",
        ["factory_id"],
        unique=False,
    )
    op.create_index(
        "ix_production_batch_programs_formula_id",
        "production_batch_programs",
        ["formula_id"],
        unique=False,
    )
    op.create_index(
        "ix_production_batch_programs_status",
        "production_batch_programs",
        ["status"],
        unique=False,
    )
    op.add_column(
        "production_batches",
        sa.Column("program_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_production_batches_program_id",
        "production_batches",
        "production_batch_programs",
        ["program_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_production_batches_program_id",
        "production_batches",
        ["program_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_production_batches_program_id", table_name="production_batches")
    op.drop_constraint(
        "fk_production_batches_program_id",
        "production_batches",
        type_="foreignkey",
    )
    op.drop_column("production_batches", "program_id")
    op.drop_index(
        "ix_production_batch_programs_status",
        table_name="production_batch_programs",
    )
    op.drop_index(
        "ix_production_batch_programs_formula_id",
        table_name="production_batch_programs",
    )
    op.drop_index(
        "ix_production_batch_programs_factory_id",
        table_name="production_batch_programs",
    )
    op.drop_index(
        "ix_production_batch_programs_workspace_id",
        table_name="production_batch_programs",
    )
    op.drop_table("production_batch_programs")

`

## git diff modified

`diff
diff --git a/app/db/base.py b/app/db/base.py
index a07d586..b5cfe49 100644
--- a/app/db/base.py
+++ b/app/db/base.py
@@ -9,6 +9,7 @@ from app.db.base_class import Base
 # Import all models here to ensure they are discovered by Alembic
 from app.models.profile import Profile
 from app.models.workspace import Workspace
+from app.models.workspace_shift import WorkspaceShift
 from app.models.workspace_member import WorkspaceMember
 from app.models.workspace_invitation import WorkspaceInvitation
 from app.models.workspace_audit_log import WorkspaceAuditLog
@@ -98,12 +99,20 @@ from app.models.delivery_method import DeliveryMethod
 from app.models.sales_order_return import SalesOrderReturn, SalesOrderReturnItem
 # Production
 from app.models.production_line import ProductionLine
+from app.models.production_line_machine import ProductionLineMachine
 from app.models.production_formula import ProductionFormula
-from app.models.production_formula_item import ProductionFormulaItem
 from app.models.production_batch import ProductionBatch
+from app.models.production_batch_program import ProductionBatchProgram
 from app.models.production_batch_item import ProductionBatchItem
+from app.models.production_route import ProductionRoute, ProductionRouteStep
 from app.models.production_formula_stage import ProductionFormulaStage
+from app.models.production_formula_stage_item import ProductionFormulaStageItem
+from app.models.production_formula_stage_parameter import ProductionFormulaStageParameter
 from app.models.production_batch_stage_log import ProductionBatchStageLog
+from app.models.production_batch_stage_item import ProductionBatchStageItem
+from app.models.production_batch_stage_parameter import ProductionBatchStageParameter
+from app.models.production_batch_event import ProductionBatchEvent
 from app.models.waitlist_signup import WaitlistSignup
 from app.models.landing_perf_report import LandingPerfReport
 from app.models.help_ticket import HelpTicket
+from app.models.help_ticket_event import HelpTicketEvent
diff --git a/app/models/__init__.py b/app/models/__init__.py
index 1513c4d..8592317 100644
--- a/app/models/__init__.py
+++ b/app/models/__init__.py
@@ -6,6 +6,7 @@ Alembic discovers models via app/db/base.py â€” keep imports there in sync with
 # Workspace multi-tenancy models
 from app.models.subscription_plan import SubscriptionPlan
 from app.models.workspace import Workspace
+from app.models.workspace_shift import WorkspaceShift
 from app.models.workspace_member import WorkspaceMember
 from app.models.workspace_invitation import WorkspaceInvitation
 from app.models.workspace_audit_log import WorkspaceAuditLog
@@ -33,12 +34,17 @@ from app.models.project_component_item_ledger import ProjectComponentItemLedger
 
 # Production Module
 from app.models.production_line import ProductionLine
+from app.models.production_line_machine import ProductionLineMachine
 from app.models.production_formula import ProductionFormula
-from app.models.production_formula_item import ProductionFormulaItem
+from app.models.production_route import ProductionRoute, ProductionRouteStep
 from app.models.production_formula_stage import ProductionFormulaStage
+from app.models.production_formula_stage_item import ProductionFormulaStageItem
 from app.models.production_batch import ProductionBatch
+from app.models.production_batch_program import ProductionBatchProgram
 from app.models.production_batch_item import ProductionBatchItem
 from app.models.production_batch_stage_log import ProductionBatchStageLog
+from app.models.production_batch_stage_item import ProductionBatchStageItem
+from app.models.production_batch_event import ProductionBatchEvent
 
 # Order System (New Split Architecture)
 from app.models.order_template import OrderTemplate
@@ -131,6 +137,7 @@ __all__ = [
     # Workspace models
     "SubscriptionPlan",
     "Workspace",
+    "WorkspaceShift",
     "WorkspaceMember",
     "WorkspaceInvitation",
     "WorkspaceAuditLog",
@@ -153,9 +160,14 @@ __all__ = [
     "ProjectComponentItemLedger",
     # Production Module
     "ProductionLine",
+    "ProductionLineMachine",
     "ProductionFormula",
-    "ProductionFormulaItem",
+    "ProductionRoute",
+    "ProductionRouteStep",
+    "ProductionFormulaStage",
+    "ProductionFormulaStageItem",
     "ProductionBatch",
+    "ProductionBatchProgram",
     "ProductionBatchItem",
     # Order System (New Split Architecture)
     "OrderTemplate",
diff --git a/app/models/production_batch.py b/app/models/production_batch.py
index c4b8246..08f8483 100644
--- a/app/models/production_batch.py
+++ b/app/models/production_batch.py
@@ -1,9 +1,10 @@
 """Production Batch model - actual production logs"""
-from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Date, Numeric, UniqueConstraint
+from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Date, UniqueConstraint
 from sqlalchemy.orm import relationship
 from datetime import datetime
 from app.db.base_class import Base
 from app.utils.time import utcnow
+from app.models.workspace_shift import WorkspaceShift  # noqa: F401 â€” register before relationship()
 
 
 class ProductionBatch(Base):
@@ -25,29 +26,31 @@ class ProductionBatch(Base):
 
     # Links
     production_line_id = Column(Integer, ForeignKey("production_lines.id", ondelete="RESTRICT"), nullable=False, index=True)
+    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="SET NULL"), nullable=True, index=True)
     formula_id = Column(Integer, ForeignKey("production_formulas.id", ondelete="SET NULL"), nullable=True, index=True)
+    program_id = Column(
+        Integer,
+        ForeignKey("production_batch_programs.id", ondelete="SET NULL"),
+        nullable=True,
+        index=True,
+    )
+    route_id = Column(Integer, ForeignKey("production_routes.id", ondelete="SET NULL"), nullable=True, index=True)
+    planned_start_at = Column(DateTime, nullable=True)
+    sales_order_item_id = Column(
+        Integer, ForeignKey("sales_order_items.id", ondelete="SET NULL"), nullable=True, index=True
+    )
     # formula_id nullable: Can produce with or without formula (simple mode)
 
     # Batch metadata
     batch_date = Column(Date, nullable=False, index=True)  # When production happened
-    shift = Column(String(20), nullable=True)  # 'morning', 'afternoon', 'night', or custom
+    shift_id = Column(Integer, ForeignKey("workspace_shifts.id", ondelete="SET NULL"), nullable=True, index=True)
+    shift = Column(String(80), nullable=True)  # Snapshot of shift name at save/start
     status = Column(String(20), nullable=False, default='draft', index=True)
     # Valid statuses: 'draft', 'in_progress', 'completed', 'cancelled'
 
-    # === EXPECTED VALUES (calculated from formula when batch starts) ===
-    expected_output_quantity = Column(Integer, nullable=True)  # Expected output amount
-    expected_duration_minutes = Column(Integer, nullable=True)  # Expected production time
-
-    # === ACTUAL VALUES (logged by user when batch completes) ===
-    actual_output_quantity = Column(Integer, nullable=True)  # Actual output produced
-    actual_duration_minutes = Column(Integer, nullable=True)  # Actual time taken
-    actual_start_time = Column(DateTime, nullable=True)  # When production actually started
-    actual_end_time = Column(DateTime, nullable=True)  # When production actually ended
-
-    # === VARIANCE (auto-calculated: actual - expected) ===
-    output_variance_quantity = Column(Integer, nullable=True)  # Difference in quantity
-    output_variance_percentage = Column(Numeric(5, 2), nullable=True)  # Percentage difference
-    efficiency_percentage = Column(Numeric(5, 2), nullable=True)  # (actual / expected) * 100
+    # Output qty, duration, and variance are derived from steps on read.
+    actual_start_time = Column(DateTime, nullable=True)
+    actual_end_time = Column(DateTime, nullable=True)
 
     # Notes
     notes = Column(Text, nullable=True)  # Production notes, issues, observations
@@ -72,6 +75,9 @@ class ProductionBatch(Base):
     workspace = relationship("Workspace", backref="production_batches")
     production_line = relationship("ProductionLine", backref="batches")
     formula = relationship("ProductionFormula", backref="batches")
+    route = relationship("ProductionRoute", backref="batches")
+    sales_order_item = relationship("SalesOrderItem", backref="production_batches")
+    workspace_shift = relationship("WorkspaceShift", foreign_keys=[shift_id])
     creator = relationship("Profile", foreign_keys=[created_by], backref="created_batches")
     updater = relationship("Profile", foreign_keys=[updated_by], backref="updated_batches")
     starter = relationship("Profile", foreign_keys=[started_by], backref="started_batches")

`
