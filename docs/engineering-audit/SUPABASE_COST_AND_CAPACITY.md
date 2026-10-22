# Supabase cost and capacity

## Verified from this session

- The Supabase dashboard, Management API, and project invoices were not available.
- No local env file with a project URL or service key was present (only `apps/web/.env.example`).
- Database size, disk provisioned, compute size, MAU, egress, storage bytes, Auth MAU, Realtime, Edge Functions, backups, and add-ons are **unknown for this project**.
- Nothing in the repo states the organization's current plan or a dated billing transition.

## Public pricing model (not this project's bill)

Retrieved 2026-10-22 from [supabase.com/pricing](https://supabase.com/pricing) and the disk/compute usage docs. These are list prices for anyone. They are not a quote for CodeCard and not a forecast.

Supabase bills an organization plan, then each project. Extra tables are not a line item.

Dimensions that do show up on a paid invoice:

| Dimension | What the public docs say | Confidence for CodeCard |
|---|---|---|
| Organization plan | Free, Pro (from $25/month), Team, Enterprise | Unknown which plan this org is on |
| Compute | Per project, hourly. Pro/Team include $10/month credit, described as one Micro instance. A second project is extra compute. | Unknown size. A second MVP project would add compute if it is a second Supabase project. |
| Disk | Paid plans: provisioned disk, 8 GB included on Pro for the primary database, then about $0.125/GB-month for general-purpose disk. Disk grows and does not shrink when rows are deleted. | Unknown provisioned size |
| Database size cap | Free plan is described as 500 MB database size, not disk overage | Unknown |
| Egress | Included quota then per GB | Unknown |
| File storage | Included quota then per GB | Unknown |
| MAU | Included quota then per additional monthly active user | Unknown |
| Add-ons | Read replicas, PITR, IPv4, log drains, custom domain, extra compute | Unknown |

Table count does not equal cost. A new empty table is cheap. A write-heavy analytics table, large jsonb, or files stored in the database are not.

## Scenarios

These are formulas, not estimates of CodeCard traffic. Plug in dashboard numbers before using them.

- **Conservative:** one project, Micro compute covered by the plan credit, disk under the included 8 GB, storage and MAU inside quotas. Marginal cost of the current schema is the plan fee only.
- **Base:** same, plus one staging Supabase project. Public docs say the credit covers one Micro instance, so the second project adds its own compute (about one Micro if it stays on Micro).
- **High growth:** MAU, egress, or file storage cross the included quota, or disk autoscale stays high after a one-time spike. Cost follows those meters, not the number of tables.

## What would actually reduce cost

Only after usage is visible:

- Delete orphan storage objects that no row references. Do not automate that until ownership and retention are checked.
- Keep large media in Storage, not in table columns. The app already uploads files to buckets.
- Do not add a second raw analytics table. `public_profile_events`, `project_view_events`, and `analytics_events` already exist. Aggregate or retain them if write volume shows up in the dashboard.
- Caching public profiles (already tagged ISR) reduces repeated reads. It does not reduce disk.

Moving off Supabase is not justified by an upcoming invoice we have not seen.
