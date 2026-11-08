# Task 1 Report: Occurrence dates

## Status

Implemented `occurrence_starts` and `MAX_PROGRAM_OCCURRENCES` per task brief. TDD: tests first, RED, implementation, GREEN.

## Files created

| Path | Role |
|------|------|
| `backend/app/utils/production_program_occurrences.py` | `occurrence_starts`, `_add_month(anchor_day)`, cap constant |
| `backend/tests/test_production_program_occurrences.py` | Four tests from brief |

## TDD: RED

Command (from `backend/`, tests only; module not yet created):

```text
$env:PYTHONPATH="."; pytest tests/test_production_program_occurrences.py -v
```

Output:

```text
============================= test session starts =============================
platform win32 -- Python 3.12.0, pytest-9.1.1, pluggy-1.6.0 -- C:\Users\shoha\AppData\Local\Programs\Python\Python312\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\shoha\Documents\GitHub\Makorsha\backend
configfile: pytest.ini
plugins: anyio-4.14.1, cov-7.1.0
collecting ... collected 0 items / 1 error

=================================== ERRORS ====================================
________ ERROR collecting tests/test_production_program_occurrences.py ________
ImportError while importing test module 'C:\Users\shoha\Documents\GitHub\Makorsha\backend\tests\test_production_program_occurrences.py'.
Hint: make sure your test modules/packages have valid Python names.
Traceback:
...
tests\test_production_program_occurrences.py:5: in <module>
    from app.utils.production_program_occurrences import (
E   ModuleNotFoundError: No module named 'app.utils.production_program_occurrences'
=========================== short test summary info ===========================
ERROR tests/test_production_program_occurrences.py
!!!!!!!!!!!!!!!!!!! Interrupted: 1 error during collection !!!!!!!!!!!!!!!!!!!!
============================== 1 error in 0.21s ===============================
```

Note: On a fresh shell without `PYTHONPATH=.`, collection can fail with `No module named 'app'` first; setting `PYTHONPATH=.` matches how other backend tests resolve the `app` package in this environment.

## TDD: GREEN

Command:

```text
pytest tests/test_production_program_occurrences.py -v
```

(with `PYTHONPATH=.` set in the same shell session, or equivalent project setup)

Output:

```text
============================= test session starts =============================
platform win32 -- Python 3.12.0, pytest-9.1.1, pluggy-1.6.0 -- C:\Users\shoha\AppData\Local\Programs\Python\Python312\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\shoha\Documents\GitHub\Makorsha\backend
configfile: pytest.ini
plugins: anyio-4.14.1, cov-7.1.0
collecting ... collected 4 items

tests/test_production_program_occurrences.py::test_weekly_stops_on_end_date PASSED [ 25%]
tests/test_production_program_occurrences.py::test_monthly_clamps_to_last_day PASSED [ 50%]
tests/test_production_program_occurrences.py::test_end_before_start_raises PASSED [ 75%]
tests/test_production_program_occurrences.py::test_over_366_raises_and_names_the_cap PASSED [100%]

============================== 4 passed in 0.05s ==============================
```

## Self-review

- **API**: `occurrence_starts(first_start, cadence, end_date) -> list[datetime]`; `MAX_PROGRAM_OCCURRENCES = 366`.
- **Cadences**: `daily` (+1 day), `weekly` (+7 days), `monthly` via `_add_month(cursor, first_start.day)` so Jan 31 → Feb 28 → Mar 31 behaves as specified.
- **Validation**: `end_date < first_start.date()` → `"Recurrence end date must be on or after the start date"`; invalid cadence → `"Cadence must be daily, weekly, or monthly"`.
- **Cap**: After each append, if `len(starts) > MAX_PROGRAM_OCCURRENCES`, raises `Recurrence cannot exceed 366 occurrences` (367th daily hit for 2026-01-01 … 2027-01-02).
- **Scope**: Pure helper, no DB; matches brief implementation verbatim.
- **Not done**: No git commit (global constraint).

## Concerns

- None functional. Local pytest may need `PYTHONPATH=.` (or venv editable install) if `app` is not on the path; other backend tests in this repo assume the same layout.

## Commits

None (agent did not commit).
