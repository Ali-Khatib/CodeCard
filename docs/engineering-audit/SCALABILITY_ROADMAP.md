# Scalability roadmap

No new table or service is required for the current product. Add one only when the trigger below is true.

## Needed now

| Item | Why | Trigger already met? |
|---|---|---|
| Profile save must not render Home | The button was waiting on unrelated queries | Yes. Shipped as `POST /api/profile`. |
| Confirm the save on the real deployment | Local timings were not available | No. Needs a signed-in MVP session and the `[profile-update]` log. |
| Read Supabase usage | Billing worry cannot be answered from git | No. Needs dashboard access. |

## Needed before meaningful growth

| Item | User need | Already implemented? | New table? | Trigger |
|---|---|---|---|---|
| Same treatment for project and research saves | Editors on those forms still use Server Actions that revalidate `/dashboard` | The writes exist. The decoupling does not. | No | A trace shows the same "button waits on Home" pattern |
| Pagination on connection and activity lists | Home schedule already limits follow-ups to 100. Circle unread scans a capped set. Other lists should be checked before they grow. | Partial | No | A list query returns unbounded rows in production |
| Analytics retention | Raw events will dominate disk long before profile rows do | Tables exist (`public_profile_events`, `project_view_events`, `analytics_events`) | No, until a retention job is specified | Dashboard shows these tables as the disk driver |
| Orphan storage cleanup | Replaced avatars and project media | `storage_upload_intents` and cleanup jobs exist in migrations | No | A storage report shows unreferenced objects |

## Only after a product decision or measured scale

| Idea | Need | Data | New table? | Trigger to build |
|---|---|---|---|---|
| Public search / discovery | Finding other people. Not the current product (share by link and QR). | Existing `slug` and published flags | Only if search cannot use the current indexes | Product says discovery is in scope |
| Notifications | Telling someone about a connection or follow-up | `owner_events` and connections already store follow-up times | A notification inbox table only if in-app alerts are approved | Product approval, not "we might want it" |
| Extra analytics fact tables | Finer funnels | Would duplicate event tables | No | A defined report that the current events cannot answer |
| Read replica or larger compute | Read latency or CPU | None | No | Dashboard CPU/memory, not a guess |
| Second Supabase project for MVP staging | Isolating OAuth and billing tests | Same schema | No | Operator decision. Public pricing bills compute per project. |

Future mobile clients should use the same owner-scoped APIs and RLS. They do not need a parallel schema.
