-- Temporarily disable RLS to allow public access for testing
-- This will be reverted later when authentication is re-enabled

-- Disable RLS on radar_brasis
ALTER TABLE public.radar_brasis DISABLE ROW LEVEL SECURITY;

-- Disable RLS on radar_sources  
ALTER TABLE public.radar_sources DISABLE ROW LEVEL SECURITY;

-- Disable RLS on radar_keywords
ALTER TABLE public.radar_keywords DISABLE ROW LEVEL SECURITY;

-- Keep user_roles RLS enabled as it's not used in main functionality
-- ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;