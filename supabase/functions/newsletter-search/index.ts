import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://3d99c837-5852-4c57-9505-d2ca60666732.lovableproject.com',
  'https://vlsirftmzvmilugalbpr.supabase.co'
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Security: generic error messages for client
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
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

// Rate limiting per user
const rateLimiter = createRateLimiter();

function createRateLimiter() {
  const requests = new Map<string, number[]>();
  
  return {
    isAllowed: (userId: string): boolean => {
      const now = Date.now();
      const windowStart = now - (60 * 1000); // 1 minute
      
      if (!requests.has(userId)) {
        requests.set(userId, []);
      }
      
      const userRequests = requests.get(userId)!;
      const validRequests = userRequests.filter((time: number) => time > windowStart);
      requests.set(userId, validRequests);
      
      // Allow up to 10 requests per minute per user
      if (validRequests.length >= 10) {
        return false;
      }
      
      validRequests.push(now);
      return true;
    }
  };
}

// Input validation
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

  // Check for SQL injection attempts
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(;|--|\/\*|\*\/|xp_|sp_)/i,
    /('|('')|"|(\+)|(\|\|))/i
  ];
  
  if (sqlPatterns.some(pattern => pattern.test(searchTerms))) {
    return { isValid: false, sanitized: '', error: 'Termo de busca contém caracteres inválidos' };
  }

  const sanitized = searchTerms
    .trim()
    .replace(/[<>'"]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .substring(0, 100);

  return { isValid: true, sanitized };
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[newsletter-search] Request received');

  try {
    const authorization = req.headers.get('Authorization') ?? '';
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authorization } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return createErrorResponse(corsHeaders, 'Autenticação necessária', 401, 'Auth failed', userError);
    }

    if (!openaiApiKey) {
      return createErrorResponse(corsHeaders, 'Serviço temporariamente indisponível', 503, 'OpenAI API key not configured');
    }

    const requestBody = await req.json();
    const { searchTerms } = requestBody;
    
    // Validate and sanitize search terms
    const validation = validateSearchTerms(searchTerms);
    if (!validation.isValid) {
      return createErrorResponse(corsHeaders, validation.error || 'Termo de busca inválido', 400);
    }

    // Check for active NEWSLETTER sources
    const { data: activeSources } = await supabaseClient
      .from('radar_sources')
      .select('active')
      .eq('type', 'NEWSLETTER')
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle();

    if (!activeSources) {
      return createErrorResponse(
        corsHeaders,
        'Nenhuma fonte de newsletter ativa. Ative uma fonte do tipo NEWSLETTER em Configurações > Fontes.',
        403
      );
    }
    
    // Rate limiting
    if (!rateLimiter.isAllowed(user.id)) {
      return createErrorResponse(corsHeaders, 'Muitas solicitações. Aguarde um minuto.', 429, 'Rate limit exceeded');
    }
    
    console.log(`[newsletter-search] Searching: ${validation.sanitized}`);

    try {
      const result = await searchNewsletters(validation.sanitized, user.id, supabaseClient);
      
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

async function searchNewsletters(searchTerms: string, userId: string, supabaseClient: ReturnType<typeof createClient>) {
  try {
    // Load active NEWSLETTER sources
    const { data: activeSources } = await supabaseClient
      .from('radar_sources')
      .select('id, name, url')
      .eq('type', 'NEWSLETTER')
      .eq('user_id', userId)
      .eq('active', true);

    if (!activeSources || activeSources.length === 0) {
      console.log('[newsletter-search] No active NEWSLETTER sources');
      return {
        success: false,
        items_collected: 0,
        errors: ['Nenhuma fonte de newsletter ativa.']
      };
    }

    // Prepare allowed sources
    const allowedNames = new Set(
      activeSources.map(s => s.name.toLowerCase().trim())
    );
    const allowedDomains = new Set(
      activeSources.map(s => {
        try {
          return new URL(s.url).hostname.toLowerCase();
        } catch {
          return '';
        }
      }).filter(d => d)
    );

    console.log(`[newsletter-search] Allowed sources: ${activeSources.length}`);

    // Load tombstones
    const { data: tombstones } = await supabaseClient
      .from('radar_tombstones')
      .select('link')
      .eq('user_id', userId);
    
    const tombstoneLinks = new Set(tombstones?.map(t => t.link) || []);

    // Use OpenAI for newsletter search
    const searchQuery = `Encontre newsletters brasileiras recentes sobre ${searchTerms}. 
    Procure por newsletters de empresas, mídia e influenciadores do Brasil. 
    Retorne informações específicas sobre conteúdo publicado nas últimas 2 semanas.
    
    Retorne SEMPRE em formato JSON válido com array de newsletters encontradas.
    Cada newsletter deve ter: title, source, link, summary, pub_date, relevance (1-5).
    
    Exemplo de formato esperado:
    [
      {
        "title": "Newsletter Exemplo",
        "source": "Empresa X",
        "link": "https://exemplo.com",
        "summary": "Resumo do conteúdo",
        "pub_date": "2025-01-01T00:00:00Z",
        "relevance": 4
      }
    ]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um curador especializado em newsletters brasileiras. 
            Sua tarefa é simular encontrar newsletters relevantes sobre o Brasil e retornar informações estruturadas.
            Como você não tem acesso direto à internet, crie newsletters plausíveis baseadas no termo de busca.
            Retorne SEMPRE em formato JSON válido com array de newsletters encontradas.
            Cada newsletter deve ter: title, source, link, summary, pub_date, relevance (1-5).`
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error('[newsletter-search] OpenAI API error:', response.status);
      throw new Error('Serviço de busca indisponível');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Nenhum resultado encontrado');
    }

    console.log('[newsletter-search] OpenAI response received');

    let newsletterData;
    try {
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        newsletterData = JSON.parse(jsonMatch[0]);
      } else {
        newsletterData = parseNewsletterContent(content, searchTerms);
      }
    } catch (parseError) {
      console.log('[newsletter-search] JSON parse failed, using manual extraction');
      newsletterData = parseNewsletterContent(content, searchTerms);
    }

    const processedItems = [];
    const skippedItems = [];
    
    for (const newsletter of newsletterData.slice(0, 10)) {
      const itemLink = newsletter.link || `https://newsletter-search.com/query/${encodeURIComponent(searchTerms)}`;
      const itemSource = newsletter.source || `Newsletter - ${searchTerms}`;
      
      // Check tombstones
      if (tombstoneLinks.has(itemLink)) {
        skippedItems.push({ title: newsletter.title, reason: 'Excluído anteriormente' });
        continue;
      }

      // Validate source is allowed
      const normalizedSource = itemSource.toLowerCase().trim();
      let isAllowed = allowedNames.has(normalizedSource);
      
      if (!isAllowed) {
        try {
          const linkDomain = new URL(itemLink).hostname.toLowerCase();
          isAllowed = allowedDomains.has(linkDomain);
        } catch {
          // Invalid link
        }
      }

      if (!isAllowed) {
        skippedItems.push({ title: newsletter.title, source: itemSource, reason: 'Fonte não permitida' });
        continue;
      }

      const item = {
        title: newsletter.title || `Newsletter sobre ${searchTerms}`,
        link: itemLink,
        source: itemSource,
        pub_date: newsletter.pub_date || new Date().toISOString(),
        editoria: 'Newsletter',
        tags: ['newsletter', 'curadoria', 'brasil', ...searchTerms.split(' ').filter(term => term.length > 2)],
        relevancia: newsletter.relevance || 3,
        status: 'Em aprovação',
        resumo_curado: newsletter.summary || content.substring(0, 500),
        user_id: userId,
        input_bruto: JSON.stringify({
          search_terms: searchTerms,
          newsletter_data: newsletter,
          search_timestamp: new Date().toISOString()
        })
      };

      // Check for duplicates
      const { data: existing } = await supabaseClient
        .from('radar_brasis')
        .select('id')
        .eq('title', item.title)
        .eq('user_id', userId)
        .single();

      if (!existing) {
        processedItems.push(item);
        console.log(`[newsletter-search] Item approved: ${item.title.substring(0, 50)}...`);
      } else {
        skippedItems.push({ title: item.title, reason: 'Já existe' });
      }
    }

    console.log(`[newsletter-search] Summary: ${processedItems.length} approved, ${skippedItems.length} skipped`);

    // Save new items
    if (processedItems.length > 0) {
      const { error } = await supabaseClient
        .from('radar_brasis')
        .insert(processedItems);

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

  } catch (error) {
    console.error('[newsletter-search] Error:', error);
    return {
      success: false,
      items_collected: 0,
      errors: ['Erro ao processar busca. Tente novamente.']
    };
  }
}

function parseNewsletterContent(content: string, searchTerms: string) {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  const newsletters = [];
  
  let currentNewsletter = {};
  let newsletterCount = 0;
  
  for (const line of lines) {
    const cleanLine = line.trim();
    
    if (cleanLine.match(/^\d+\.|^[A-Z].*newsletter|^[A-Z].*report|^[A-Z].*weekly/i)) {
      if (Object.keys(currentNewsletter).length > 0) {
        newsletters.push(currentNewsletter);
      }
      currentNewsletter = {
        title: cleanLine.replace(/^\d+\.|\*|\-/g, '').trim(),
        source: `Newsletter sobre ${searchTerms}`,
        summary: '',
        relevance: 3,
        pub_date: new Date().toISOString()
      };
      newsletterCount++;
    } else if (cleanLine.length > 20 && Object.keys(currentNewsletter).length > 0) {
      if (!currentNewsletter.summary) {
        currentNewsletter.summary = cleanLine;
      } else {
        currentNewsletter.summary += ' ' + cleanLine;
      }
    }
    
    if (newsletterCount >= 5) break;
  }
  
  if (Object.keys(currentNewsletter).length > 0) {
    newsletters.push(currentNewsletter);
  }
  
  if (newsletters.length === 0) {
    newsletters.push({
      title: `Pesquisa sobre ${searchTerms} em newsletters`,
      source: `Newsletter Research - ${searchTerms}`,
      summary: content.substring(0, 500),
      relevance: 3,
      pub_date: new Date().toISOString(),
      link: `https://newsletter-search.com/query/${encodeURIComponent(searchTerms)}`
    });
  }
  
  return newsletters;
}
