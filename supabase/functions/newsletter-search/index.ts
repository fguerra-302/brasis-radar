import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://3d99c837-5852-4c57-9505-d2ca60666732.lovableproject.com',
  'https://vlsirftmzvmilugalbpr.supabase.co',
  'http://localhost:5173',
  'http://localhost:3000'
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

function createErrorResponse(
  corsHeaders: Record<string, string>,
  userMessage: string,
  status: number,
  internalContext?: string,
  internalError?: unknown
) {
  if (internalContext) {
    console.error(`[newsletter-search] ${internalContext}:`, internalError || userMessage);
  }
  return new Response(
    JSON.stringify({ error: userMessage, success: false, items_collected: 0 }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Rate limiting per user
const rateLimiter = (() => {
  const requests = new Map<string, number[]>();
  return {
    isAllowed: (userId: string): boolean => {
      const now = Date.now();
      const windowStart = now - 60_000;
      if (!requests.has(userId)) requests.set(userId, []);
      const userRequests = requests.get(userId)!.filter(t => t > windowStart);
      requests.set(userId, userRequests);
      if (userRequests.length >= 10) return false;
      userRequests.push(now);
      return true;
    }
  };
})();

const validateSearchTerms = (searchTerms: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!searchTerms || typeof searchTerms !== 'string') {
    return { isValid: false, sanitized: '', error: 'Termo de busca é obrigatório' };
  }
  if (searchTerms.length < 2) {
    return { isValid: false, sanitized: '', error: 'Termo de busca deve ter pelo menos 2 caracteres' };
  }
  if (searchTerms.length > 100) {
    return { isValid: false, sanitized: '', error: 'Termo de busca muito longo' };
  }
  const sanitized = searchTerms.trim().replace(/[<>'"]/g, '').replace(/javascript:/gi, '').replace(/data:/gi, '').substring(0, 100);
  return { isValid: true, sanitized };
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[newsletter-search] Request received');

  try {
    const authorization = req.headers.get('Authorization') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return createErrorResponse(corsHeaders, 'Autenticação necessária', 401, 'Auth failed', userError);
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return createErrorResponse(corsHeaders, 'Serviço de busca não configurado. Configure o Firecrawl nas secrets.', 503, 'FIRECRAWL_API_KEY not configured');
    }

    const requestBody = await req.json();
    const { searchTerms } = requestBody;
    
    const validation = validateSearchTerms(searchTerms);
    if (!validation.isValid) {
      return createErrorResponse(corsHeaders, validation.error || 'Termo de busca inválido', 400);
    }
    
    if (!rateLimiter.isAllowed(user.id)) {
      return createErrorResponse(corsHeaders, 'Muitas solicitações. Aguarde um minuto.', 429, 'Rate limit exceeded');
    }
    
    console.log(`[newsletter-search] Searching via Firecrawl: ${validation.sanitized}`);

    try {
      const result = await searchNewsletters(validation.sanitized, user.id, supabaseClient, firecrawlKey);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('[newsletter-search] Search error:', error);
      return createErrorResponse(corsHeaders, 'Erro ao processar busca. Tente novamente.', 500, 'Search error', error);
    }
  } catch (authError) {
    console.error('[newsletter-search] Auth error:', authError);
    return createErrorResponse(corsHeaders, 'Falha na autenticação', 401, 'Auth error', authError);
  }
});

async function searchNewsletters(
  searchTerms: string,
  userId: string,
  supabaseClient: any,
  firecrawlKey: string
) {
  // Load tombstones
  const { data: tombstones } = await supabaseClient
    .from('radar_tombstones')
    .select('link')
    .eq('user_id', userId);
  const tombstoneLinks = new Set(tombstones?.map((t: any) => t.link) || []);

  // Load user settings for relevance threshold
  const { data: settings } = await supabaseClient
    .from('user_settings')
    .select('min_relevance_threshold')
    .eq('user_id', userId)
    .maybeSingle();
  const minThreshold = settings?.min_relevance_threshold || 3;

  // Search using Firecrawl
  const searchQuery = `${searchTerms} newsletter brasil`;
  const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: searchQuery,
      limit: 10,
      lang: 'pt-br',
      country: 'br',
      scrapeOptions: { formats: ['markdown'] },
    }),
  });

  if (!firecrawlResponse.ok) {
    const errBody = await firecrawlResponse.text();
    console.error(`[newsletter-search] Firecrawl error ${firecrawlResponse.status}:`, errBody);
    throw new Error('Serviço de busca indisponível');
  }

  const firecrawlData = await firecrawlResponse.json();
  const searchResults = firecrawlData.data || [];
  
  console.log(`[newsletter-search] Firecrawl returned ${searchResults.length} results`);

  const processedItems = [];
  const skippedItems = [];

  for (const result of searchResults) {
    const itemLink = result.url || '';
    const itemTitle = result.title || result.metadata?.title || `Newsletter: ${searchTerms}`;
    const itemDescription = result.description || result.markdown?.substring(0, 500) || '';

    if (!itemLink) {
      skippedItems.push({ title: itemTitle, reason: 'Sem URL' });
      continue;
    }

    // Check tombstones
    if (tombstoneLinks.has(itemLink)) {
      skippedItems.push({ title: itemTitle, reason: 'Excluído anteriormente' });
      continue;
    }

    // Check for duplicates by link
    const { data: existing } = await supabaseClient
      .from('radar_brasis')
      .select('id')
      .eq('link', itemLink)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      skippedItems.push({ title: itemTitle, reason: 'Já existe' });
      continue;
    }

    // Calculate simple relevance based on keyword matches
    const text = `${itemTitle} ${itemDescription}`.toLowerCase();
    const searchWords = searchTerms.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const matchCount = searchWords.filter(w => text.includes(w)).length;
    const relevance = Math.max(3, Math.min(5, 3 + matchCount));

    if (relevance < minThreshold) {
      skippedItems.push({ title: itemTitle, reason: 'Baixa relevância' });
      continue;
    }

    const tags = ['newsletter', ...searchTerms.split(' ').filter(t => t.length > 2).slice(0, 3)];

    processedItems.push({
      title: itemTitle.substring(0, 500),
      link: itemLink,
      source: `Newsletter Search`,
      pub_date: new Date().toISOString(),
      editoria: 'Newsletter',
      tags,
      relevancia: relevance,
      status: 'Coletado',
      resumo_curado: itemDescription.substring(0, 1000),
      user_id: userId,
      input_bruto: JSON.stringify({
        search_terms: searchTerms,
        firecrawl_url: itemLink,
        search_timestamp: new Date().toISOString()
      })
    });
  }

  console.log(`[newsletter-search] ${processedItems.length} approved, ${skippedItems.length} skipped`);

  // Save new items
  if (processedItems.length > 0) {
    const { error } = await supabaseClient.from('radar_brasis').insert(processedItems);
    if (error) {
      console.error('[newsletter-search] Insert error:', error.message);
      throw new Error('Erro ao salvar itens');
    }
  }

  return {
    success: true,
    items_collected: processedItems.length,
    items_skipped: skippedItems.length,
    search_terms: searchTerms,
    skipped_details: skippedItems,
    errors: []
  };
}
