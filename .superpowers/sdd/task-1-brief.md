### Task 1: Occurrence dates

**Files:**
- Create: `backend/app/utils/production_program_occurrences.py`
- Test: `backend/tests/test_production_program_occurrences.py`

**Interfaces:**
- Consumes: nothing
- Produces: `occurrence_starts(first_start: datetime, cadence: str, end_date: date) -> list[datetime]` and `MAX_PROGRAM_OCCURRENCES = 366`. Raises `ValueError` with the messages below.

- [ ] **Step 1: Write the failing test**

```python
from datetime import date, datetime

import pytest

from app.utils.production_program_occurrences import (
    MAX_PROGRAM_OCCURRENCES,
    occurrence_starts,
)


def test_weekly_stops_on_end_date():
    starts = occurrence_starts(
        datetime(2026, 10, 5, 6, 0),
        "weekly",
        date(2026, 10, 20),
    )
    assert starts == [
        datetime(2026, 10, 5, 6, 0),
        datetime(2026, 10, 12, 6, 0),
        datetime(2026, 10, 19, 6, 0),
    ]


def test_monthly_clamps_to_last_day():
    starts = occurrence_starts(
        datetime(2026, 1, 31, 8, 30),
        "monthly",
        date(2026, 3, 31),
    )
    assert [row.date() for row in starts] == [
        date(2026, 1, 31),
        date(2026, 2, 28),
        date(2026, 3, 31),
    ]
    assert all(row.hour == 8 and row.minute == 30 for row in starts)


def test_end_before_start_raises():
    with pytest.raises(ValueError, match="on or after"):
        occurrence_starts(datetime(2026, 10, 5, 6, 0), "daily", date(2026, 10, 4))


def test_over_366_raises_and_names_the_cap():
    with pytest.raises(ValueError, match=str(MAX_PROGRAM_OCCURRENCES)):
        occurrence_starts(datetime(2026, 1, 1, 0, 0), "daily", date(2027, 1, 2))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_production_program_occurrences.py -v` from `backend/`

Expected: FAIL with `ModuleNotFoundError` or `ImportError` for `production_program_occurrences`.

- [ ] **Step 3: Write minimal implementation**

```python
"""Start datetimes for a production recurring program."""
from __future__ import annotations

import calendar
from datetime import date, datetime, timedelta

MAX_PROGRAM_OCCURRENCES = 366


def _add_month(value: datetime, anchor_day: int) -> datetime:
    year = value.year + (1 if value.month == 12 else 0)
    month = 1 if value.month == 12 else value.month + 1
    last_day = calendar.monthrange(year, month)[1]
    return value.replace(year=year, month=month, day=min(anchor_day, last_day))


def occurrence_starts(first_start: datetime, cadence: str, end_date: date) -> list[datetime]:
    if end_date < first_start.date():
        raise ValueError("Recurrence end date must be on or after the start date")
    if cadence not in {"daily", "weekly", "monthly"}:
        raise ValueError("Cadence must be daily, weekly, or monthly")

    starts: list[datetime] = []
    cursor = first_start
    while cursor.date() <= end_date:
        starts.append(cursor)
        if len(starts) > MAX_PROGRAM_OCCURRENCES:
            raise ValueError(
                f"Recurrence cannot exceed {MAX_PROGRAM_OCCURRENCES} occurrences"
            )
        if cadence == "daily":
            cursor = cursor + timedelta(days=1)
        elif cadence == "weekly":
            cursor = cursor + timedelta(days=7)
        else:
            cursor = _add_month(cursor, first_start.day)
    return starts
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_production_program_occurrences.py -v` from `backend/`

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

User runs this. Agent does not.

```bash
git add app/utils/production_program_occurrences.py tests/test_production_program_occurrences.py
git commit -m "feat: count production program occurrence starts"
```

---

