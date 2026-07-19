-- WS14-T003: repair storage_upload_intents privileges for authenticated users.
--
-- Migration 20260717140001_storage_upload_security_hardening.sql created
-- owner-scoped RLS policies FOR authenticated (insert/select/update own
-- intents) but ALSO revoked ALL table privileges from authenticated. In
-- PostgreSQL, RLS policies only filter rows — table-level privileges are still
-- required — so the policies were unreachable and every signed-upload intent
-- insert through the user-scoped client failed with 42501. This broke the
-- avatar (and any signed-URL) upload flow end to end.
--
-- Forward-only repair: grant exactly the operations the existing owner
-- policies were written for. Row access remains constrained by those policies
-- (FORCE ROW LEVEL SECURITY is already enabled). anon deliberately keeps no
-- privileges, and DELETE stays service-role-only.

GRANT SELECT, INSERT, UPDATE ON TABLE public.storage_upload_intents TO authenticated;
