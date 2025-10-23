-- Remove todas as políticas de demo/público e garante acesso apenas ao próprio usuário

-- radar_brasis: Remover política de demo e garantir acesso apenas ao próprio usuário
DROP POLICY IF EXISTS "Demo user can view demo content" ON radar_brasis;
DROP POLICY IF EXISTS "Anyone can view demo content" ON radar_brasis;

-- Garantir que apenas o próprio usuário vê seus dados
DROP POLICY IF EXISTS "Users can view their own content" ON radar_brasis;
CREATE POLICY "Users can view their own content"
ON radar_brasis FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own content" ON radar_brasis;
CREATE POLICY "Users can insert their own content"
ON radar_brasis FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own content" ON radar_brasis;
CREATE POLICY "Users can update their own content"
ON radar_brasis FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own content" ON radar_brasis;
CREATE POLICY "Users can delete their own content"
ON radar_brasis FOR DELETE
USING (auth.uid() = user_id);

-- radar_sources: Remover política de demo
DROP POLICY IF EXISTS "Demo user can view demo sources" ON radar_sources;
DROP POLICY IF EXISTS "Anyone can view demo sources" ON radar_sources;

-- Garantir que apenas o próprio usuário vê suas fontes
DROP POLICY IF EXISTS "Users can view their own sources" ON radar_sources;
CREATE POLICY "Users can view their own sources"
ON radar_sources FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sources" ON radar_sources;
CREATE POLICY "Users can insert their own sources"
ON radar_sources FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sources" ON radar_sources;
CREATE POLICY "Users can update their own sources"
ON radar_sources FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sources" ON radar_sources;
CREATE POLICY "Users can delete their own sources"
ON radar_sources FOR DELETE
USING (auth.uid() = user_id);

-- radar_keywords: Remover política de demo
DROP POLICY IF EXISTS "Demo user can view demo keywords" ON radar_keywords;
DROP POLICY IF EXISTS "Anyone can view demo keywords" ON radar_keywords;

-- Garantir que apenas o próprio usuário vê suas keywords
DROP POLICY IF EXISTS "Users can view their own keywords" ON radar_keywords;
CREATE POLICY "Users can view their own keywords"
ON radar_keywords FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own keywords" ON radar_keywords;
CREATE POLICY "Users can insert their own keywords"
ON radar_keywords FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own keywords" ON radar_keywords;
CREATE POLICY "Users can update their own keywords"
ON radar_keywords FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own keywords" ON radar_keywords;
CREATE POLICY "Users can delete their own keywords"
ON radar_keywords FOR DELETE
USING (auth.uid() = user_id);

-- user_settings: Adicionar política DELETE para GDPR compliance
CREATE POLICY "Users can delete their own settings"
ON user_settings FOR DELETE
USING (auth.uid() = user_id);

-- radar_tombstones: Garantir políticas de acesso apenas ao próprio usuário
DROP POLICY IF EXISTS "Users can view their own tombstones" ON radar_tombstones;
CREATE POLICY "Users can view their own tombstones"
ON radar_tombstones FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tombstones" ON radar_tombstones;
CREATE POLICY "Users can insert their own tombstones"
ON radar_tombstones FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tombstones" ON radar_tombstones;
CREATE POLICY "Users can delete their own tombstones"
ON radar_tombstones FOR DELETE
USING (auth.uid() = user_id);

-- Adicionar validação de tamanho às funções SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.update_source_credentials(source_id uuid, new_credentials jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validar tamanho das credentials (max 10KB)
  IF pg_column_size(new_credentials) > 10000 THEN
    RAISE EXCEPTION 'Credentials too large (max 10KB)';
  END IF;
  
  -- Validar que tenha ao menos uma chave válida
  IF NOT (new_credentials ? 'access_token' OR new_credentials ? 'client_id' OR new_credentials ? 'client_secret') THEN
    RAISE EXCEPTION 'Invalid credentials structure';
  END IF;
  
  UPDATE radar_sources 
  SET 
    credentials = new_credentials,
    updated_at = now()
  WHERE id = source_id AND user_id = auth.uid();
  
  -- Log credential access for security audit
  PERFORM log_security_event('credentials_updated', auth.uid(), 
    jsonb_build_object('source_id', source_id));
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, user_id uuid DEFAULT auth.uid(), details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Limitar tamanho dos detalhes (max 5KB)
  IF pg_column_size(details) > 5000 THEN
    details := jsonb_build_object(
      '_truncated', true,
      '_original_size', pg_column_size(details),
      'summary', left(details::text, 100)
    );
  END IF;
  
  -- Log simples (futuramente pode ser expandido para tabela de auditoria)
  RAISE LOG 'Security Event: % - User: % - Details: %', event_type, user_id, details;
END;
$function$;