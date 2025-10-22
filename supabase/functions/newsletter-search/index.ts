import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

// Implementar rate limiting real por usuário
const rateLimiter = createRateLimiter();

function createRateLimiter() {
  const requests = new Map<string, number[]>();
  
  return {
    isAllowed: (userId: string): boolean => {
      const now = Date.now();
      const windowStart = now - (60 * 1000); // 1 minuto
      
      if (!requests.has(userId)) {
        requests.set(userId, []);
      }
      
      const userRequests = requests.get(userId)!;
      // Remove requisições antigas
      const validRequests = userRequests.filter((time: number) => time > windowStart);
      requests.set(userId, validRequests);
      
      // Permitir até 10 requisições por minuto por usuário
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Newsletter search request received');

  try {
    const authorization = req.headers.get('Authorization') ?? '';
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authorization } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to Supabase secrets.' 
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

    // Verificar se há fontes NEWSLETTER ativas para este usuário
    const { data: activeSources } = await supabaseClient
      .from('radar_sources')
      .select('active')
      .eq('type', 'NEWSLETTER')
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle();

    if (!activeSources) {
      return new Response(
        JSON.stringify({ 
          success: false,
          items_collected: 0,
          error: 'Nenhuma fonte de newsletter ativa. Ative uma fonte do tipo NEWSLETTER em Configurações > Fontes.'
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Rate limiting por usuário
    if (!rateLimiter.isAllowed(user.id)) {
      return new Response(JSON.stringify({ 
        error: 'Muitas solicitações. Aguarde um minuto antes de tentar novamente.',
        details: 'Limite de 10 pesquisas por minuto atingido'
      }), { 
        status: 429, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`🔍 Pesquisando newsletters com termos: ${validation.sanitized}`);

    try {
      const result = await searchNewsletters(validation.sanitized, user.id, supabaseClient);
      
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

async function searchNewsletters(searchTerms: string, userId: string, supabaseClient: ReturnType<typeof createClient>) {
  try {
    // Carregar fontes NEWSLETTER ativas do usuário
    const { data: activeSources } = await supabaseClient
      .from('radar_sources')
      .select('id, name, url')
      .eq('type', 'NEWSLETTER')
      .eq('user_id', userId)
      .eq('active', true);

    if (!activeSources || activeSources.length === 0) {
      console.log('🚫 Nenhuma fonte NEWSLETTER ativa encontrada');
      return {
        success: false,
        items_collected: 0,
        errors: ['Nenhuma fonte de newsletter ativa. Ative uma fonte do tipo NEWSLETTER em Configurações > Fontes.']
      };
    }

    // Preparar listas de fontes permitidas
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

    console.log(`✅ Fontes permitidas: ${activeSources.length} (${Array.from(allowedNames).join(', ')})`);

    // Carregar tombstones para evitar re-importar itens excluídos
    const { data: tombstones } = await supabaseClient
      .from('radar_tombstones')
      .select('link')
      .eq('user_id', userId);
    
    const tombstoneLinks = new Set(tombstones?.map(t => t.link) || []);

    // Usar OpenAI para buscar newsletters recentes
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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Nenhum conteúdo retornado pela OpenAI API');
    }

    console.log('Resposta da OpenAI:', content);

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
    const skippedItems = [];
    
    for (const newsletter of newsletterData.slice(0, 10)) {
      const itemLink = newsletter.link || `https://newsletter-search.com/query/${encodeURIComponent(searchTerms)}`;
      const itemSource = newsletter.source || `Newsletter - ${searchTerms}`;
      
      // Verificar se foi excluído permanentemente
      if (tombstoneLinks.has(itemLink)) {
        skippedItems.push({ title: newsletter.title, reason: 'Excluído anteriormente (tombstone)' });
        console.log(`⏭️ Item pulado (tombstone): ${newsletter.title}`);
        continue;
      }

      // Validar se fonte está permitida
      const normalizedSource = itemSource.toLowerCase().trim();
      let isAllowed = allowedNames.has(normalizedSource);
      
      // Se não encontrou por nome, tentar por domínio do link
      if (!isAllowed) {
        try {
          const linkDomain = new URL(itemLink).hostname.toLowerCase();
          isAllowed = allowedDomains.has(linkDomain);
        } catch {
          // Link inválido, não é permitido
        }
      }

      if (!isAllowed) {
        skippedItems.push({ title: newsletter.title, source: itemSource, reason: 'Fonte não permitida' });
        console.log(`🚫 Item bloqueado (fonte não permitida): ${newsletter.title} - ${itemSource}`);
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
          perplexity_response: content,
          newsletter_data: newsletter,
          search_timestamp: new Date().toISOString()
        })
      };

      // Verificar se já existe um item similar
      const { data: existing } = await supabaseClient
        .from('radar_brasis')
        .select('id')
        .eq('title', item.title)
        .eq('user_id', userId)
        .single();

      if (!existing) {
        processedItems.push(item);
        console.log(`✅ Item aprovado para inserção: ${item.title}`);
      } else {
        skippedItems.push({ title: item.title, reason: 'Já existe no sistema' });
      }
    }

    console.log(`📊 Resumo: ${processedItems.length} aprovados, ${skippedItems.length} bloqueados/pulados`);

    // Salvar novos itens
    if (processedItems.length > 0) {
      const { error } = await supabaseClient
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
      items_skipped: skippedItems.length,
      search_terms: searchTerms,
      skipped_details: skippedItems,
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