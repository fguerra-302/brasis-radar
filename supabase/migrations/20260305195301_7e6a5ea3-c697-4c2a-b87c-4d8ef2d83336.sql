
-- Step 1: Drop the old FK
ALTER TABLE public.source_group_assignments
  DROP CONSTRAINT IF EXISTS source_group_assignments_source_id_fkey;

-- Step 2: Delete orphan rows whose source_id doesn't exist in shared_sources
DELETE FROM public.source_group_assignments
WHERE source_id NOT IN (SELECT id FROM public.shared_sources);

-- Step 3: Add new FK referencing shared_sources
ALTER TABLE public.source_group_assignments
  ADD CONSTRAINT source_group_assignments_source_id_fkey
  FOREIGN KEY (source_id) REFERENCES public.shared_sources(id) ON DELETE CASCADE;
