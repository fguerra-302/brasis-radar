-- Phase 1: Secure Database Access - Replace permissive RLS policies with secure ones

-- Remove existing permissive policies
DROP POLICY IF EXISTS "Permitir todas operações em radar_brasis" ON radar_brasis;
DROP POLICY IF EXISTS "Permitir todas operações em radar_sources" ON radar_sources;
DROP POLICY IF EXISTS "Permitir todas operações em radar_keywords" ON radar_keywords;

-- Create secure RLS policies for radar_brasis (require authentication)
CREATE POLICY "Users can view all radar items" 
ON radar_brasis 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert radar items" 
ON radar_brasis 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update radar items" 
ON radar_brasis 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete radar items" 
ON radar_brasis 
FOR DELETE 
TO authenticated 
USING (true);

-- Create secure RLS policies for radar_sources (require authentication)
CREATE POLICY "Users can view all sources" 
ON radar_sources 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can manage sources" 
ON radar_sources 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sources" 
ON radar_sources 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sources" 
ON radar_sources 
FOR DELETE 
TO authenticated 
USING (true);

-- Create secure RLS policies for radar_keywords (require authentication)
CREATE POLICY "Users can view all keywords" 
ON radar_keywords 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can manage keywords" 
ON radar_keywords 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update keywords" 
ON radar_keywords 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete keywords" 
ON radar_keywords 
FOR DELETE 
TO authenticated 
USING (true);