import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rate limiting setup
const rateLimiter = createRateLimiter(10, 60000); // 10 requests per minute

// Input validation
const validateSearchTerms = (searchTerms: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!searchTerms || typeof searchTerms !== 'string') {
    return { isValid: false, sanitized: '', error: 'Termo de busca é obrigatório' };
  }

  if (searchTerms.length < 2) {
    return { isValid: false, sanitized: '', error: 'Termo de busca deve ter pelo menos 2 caracteres' };
  }

  if (searchTerms.length > 100) {
    return { isValid: false, sanitized: '', error: 'Termo de busca muito longo (máximo 100 caracteres)' };
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

  // Sanitize the search terms
  const sanitized = searchTerms
    .trim()
    .replace(/[<>'"]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .substring(0, 100);

  return { isValid: true, sanitized };
};

const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }
    
    const userRequests = requests.get(identifier)!;
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    requests.set(identifier, recentRequests);
    return true;
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.warn('Newsletter search attempt without authentication');
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Authentication required' }),
      { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Verify the JWT token
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    
    if (authError || !user) {
      console.warn('Newsletter search attempt with invalid token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Rate limiting check
    if (!rateLimiter(user.id)) {
      console.warn(`Rate limit exceeded for user: ${user.email}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Newsletter search request from authenticated user: ${user.email}`);

    if (!perplexityApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Perplexity API key not configured. Please add PERPLEXITY_API_KEY to Supabase secrets.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestBody = await req.json();
    const { searchTerms } = requestBody;
    
    // Validate and sanitize search terms
    const validation = validateSearchTerms(searchTerms);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`🔍 Pesquisando newsletters com termos: ${validation.sanitized}`);

    try {
      const result = await searchNewsletters(validation.sanitized, user.id);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Erro na busca de newsletters:', error);
      return new Response(JSON.stringify({
        success: false,
        items_collected: 0,
        errors: [error.message]
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (authError) {
    console.error('Authentication error:', authError);
    return new Response(JSON.stringify({ 
      error: 'Authentication failed' 
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function searchNewsletters(searchTerms: string, userId: string) {
  try {
    // Usar Perplexity AI para buscar newsletters recentes
    const searchQuery = `encontre newsletters brasileiras recentes sobre ${searchTerms}. 
    Procure por newsletters de empresas, mídia e influenciadores do Brasil. 
    Retorne informações específicas sobre conteúdo publicado nas últimas 2 semanas.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: `Você é um curador especializado em newsletters brasileiras. 
            Sua tarefa é encontrar newsletters relevantes sobre o Brasil e retornar informações estruturadas.
            Retorne SEMPRE em formato JSON com array de newsletters encontradas.
            Cada newsletter deve ter: title, source, link, summary, pub_date, relevance (1-5).`
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 2000,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'week',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Nenhum conteúdo retornado pela Perplexity API');
    }

    console.log('Resposta da Perplexity:', content);

    let newsletterData;
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        newsletterData = JSON.parse(jsonMatch[0]);
      } else {
        // Se não encontrar JSON estruturado, criar manualmente
        newsletterData = parseNewsletterContent(content, searchTerms);
      }
    } catch (parseError) {
      console.log('Erro ao fazer parse do JSON, criando estrutura manual:', parseError);
      newsletterData = parseNewsletterContent(content, searchTerms);
    }

    const processedItems = [];
    
    for (const newsletter of newsletterData.slice(0, 10)) {
      const item = {
        title: newsletter.title || `Newsletter sobre ${searchTerms}`,
        link: newsletter.link || `https://newsletter-search.com/query/${encodeURIComponent(searchTerms)}`,
        source: newsletter.source || `Newsletter - ${searchTerms}`,
        pub_date: newsletter.pub_date || new Date().toISOString(),
        editoria: 'Newsletter',
        tags: ['newsletter', 'curadoria', 'brasil', ...searchTerms.split(' ').filter(term => term.length > 2)],
        relevancia: newsletter.relevance || 3,
        status: 'Em aprovação',
        resumo_curado: newsletter.summary || content.substring(0, 500),
        user_id: userId, // Associar ao usuário logado
        input_bruto: JSON.stringify({
          search_terms: searchTerms,
          perplexity_response: content,
          newsletter_data: newsletter,
          search_timestamp: new Date().toISOString()
        })
      };

      // Verificar se já existe um item similar
      const { data: existing } = await supabase
        .from('radar_brasis')
        .select('id')
        .eq('title', item.title)
        .eq('user_id', userId)
        .single();

      if (!existing) {
        processedItems.push(item);
      }
    }

    // Salvar novos itens
    if (processedItems.length > 0) {
      const { error } = await supabase
        .from('radar_brasis')
        .insert(processedItems);

      if (error) {
        console.error('Erro ao salvar itens:', error);
        throw error;
      }
    }

    return {
      success: true,
      items_collected: processedItems.length,
      search_terms: searchTerms,
      errors: []
    };

  } catch (error) {
    console.error('Erro na busca de newsletters:', error);
    return {
      success: false,
      items_collected: 0,
      errors: [error.message]
    };
  }
}

function parseNewsletterContent(content: string, searchTerms: string) {
  // Função para extrair informações quando não há JSON estruturado
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  const newsletters = [];
  
  let currentNewsletter = {};
  let newsletterCount = 0;
  
  for (const line of lines) {
    const cleanLine = line.trim();
    
    // Detectar possíveis títulos (linhas com maiúsculas ou números)
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
      // Adicionar conteúdo ao resumo
      if (!currentNewsletter.summary) {
        currentNewsletter.summary = cleanLine;
      } else {
        currentNewsletter.summary += ' ' + cleanLine;
      }
    }
    
    // Limitar a 5 newsletters
    if (newsletterCount >= 5) break;
  }
  
  // Adicionar a última newsletter
  if (Object.keys(currentNewsletter).length > 0) {
    newsletters.push(currentNewsletter);
  }
  
  // Se não encontrou newsletters estruturadas, criar uma baseada no conteúdo
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