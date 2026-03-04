

# Fix: RLS Policies Blocking All Access to New Tables

## Root Cause

All RLS policies on `shared_sources`, `project_folders`, and `project_source_links` were created as **RESTRICTIVE** (not permissive). In PostgreSQL, RESTRICTIVE policies can only narrow access that was already granted by a PERMISSIVE policy. With zero permissive policies, **all access is denied** -- queries return empty results with no error.

This is why the user sees the UI (tabs render fine) but can't create or see any data.

## Fix

Drop all existing restrictive policies on the 3 tables and recreate them as **PERMISSIVE** policies with the same logic:

- `shared_sources`: all authenticated users can SELECT, INSERT, UPDATE, DELETE (internal team)
- `project_folders`: CRUD restricted to `user_id = auth.uid()`
- `project_source_links`: SELECT, INSERT, DELETE restricted to `user_id = auth.uid()`

## Technical Detail

Single SQL migration that:
1. Drops all 12 existing restrictive policies
2. Creates 12 new permissive policies with identical conditions
3. No code changes needed -- hooks and UI are already correct

