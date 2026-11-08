# Production batch overview stats

Design reference for line → recipe stats, optional backdated starts, and overview UI. Implemented per plan `batch_stats_design`.

## Grouping

- Batch yield, batch time vs plan, start lag: `batch.production_line_id` + `formula_id`.
- Step time, step gaps, condition drift: stage log `production_line_id` + batch recipe.

## API

`GET /api/v1/production-batches/stats/overview/?factory_id=&production_line_id=&date_from=&date_to=&statuses=`

Default window: last 90 days by `batch_date`.

## Start times

Optional `started_at` on batch start and stage log start; server rejects future timestamps.
