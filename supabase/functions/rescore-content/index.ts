import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Iniciando recálculo de relevância...');
    
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Token JWT não fornecido');
      return new Response(
        JSON.stringify({ error: 'Authorization token required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    const token = authHeader.substring(7);
    
    // Create authenticated Supabase client for this user
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Token JWT inválido:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    const userId = user.id;
    console.log(`👤 Recalculando relevância para usuário: ${userId}`);
    
    // Fetch user's keyword categories
    const { data: keywords, error: keywordsError } = await supabase
      .from('radar_keywords')
      .select('category_name, keywords, weight')
      .eq('user_id', userId);

    if (keywordsError) {
      console.error('❌ Erro ao buscar categorias:', keywordsError);
      throw keywordsError;
    }

    if (!keywords || keywords.length === 0) {
      console.log('⚠️ Nenhuma categoria de palavra-chave encontrada para o usuário');
      return new Response(
        JSON.stringify({ 
          message: 'Nenhuma categoria de palavra-chave encontrada. Configure suas categorias primeiro.',
          processedItems: 0,
          updatedItems: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Fetch user's editorial weights
    const { data: editorialWeights, error: weightsError } = await supabase
      .from('editorial_weights')
      .select('editoria, multiplier')
      .eq('user_id', userId);

    if (weightsError) {
      console.error('❌ Erro ao buscar pesos editoriais:', weightsError);
    }

    const userEditorialWeights = editorialWeights || [];
    console.log(`📊 ${userEditorialWeights.length} multiplicadores editoriais encontrados`);

    // Fetch all radar_brasis items for this user
    const { data: items, error: itemsError } = await supabase
      .from('radar_brasis')
      .select('id, title, input_bruto, tags, relevancia, editoria')
      .eq('user_id', userId);

    if (itemsError) {
      console.error('❌ Erro ao buscar itens:', itemsError);
      throw itemsError;
    }

    if (!items || items.length === 0) {
      console.log('⚠️ Nenhum item encontrado para recalcular');
      return new Response(
        JSON.stringify({ 
          message: 'Nenhum item encontrado para recalcular',
          processedItems: 0,
          updatedItems: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    console.log(`📊 Recalculando ${items.length} itens com ${keywords.length} categorias e ${userEditorialWeights.length} multiplicadores`);
    
    let processedItems = 0;
    let updatedItems = 0;

    // Process each item
    for (const item of items) {
      try {
        // Calculate new relevance with editorial multiplier
        const keywordScore = calculateKeywordRelevance(item, keywords);
        const multiplier = getEditorialMultiplier(item.editoria || 'Geral', userEditorialWeights);
        const newRelevance = Math.max(1, Math.min(5, Math.round(keywordScore * multiplier)));
        
        // Only update if relevance changed
        if (newRelevance !== item.relevancia) {
          const { error: updateError } = await supabase
            .from('radar_brasis')
            .update({ 
              relevancia: newRelevance,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          if (updateError) {
            console.error(`❌ Erro ao atualizar item ${item.id}:`, updateError.message);
          } else {
            console.log(`✅ Item ${item.id} atualizado: relevância ${item.relevancia} → ${newRelevance}`);
            updatedItems++;
          }
        }
        
        processedItems++;
      } catch (itemError) {
        console.error(`❌ Erro ao processar item ${item.id}:`, itemError);
      }
    }

    console.log(`✅ Recálculo concluído: ${processedItems} itens processados, ${updatedItems} atualizados`);

    return new Response(
      JSON.stringify({
        message: 'Recálculo de relevância concluído com sucesso',
        processedItems,
        updatedItems,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Erro geral no recálculo de relevância:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno no recálculo de relevância',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function calculateKeywordRelevance(item: any, categories: any[]): number {
  const text = `${item.title} ${item.input_bruto || ''}`.toLowerCase();
  const itemTags = (item.tags || []).map((tag: string) => tag.toLowerCase());
  
  let totalScore = 0;
  
  for (const category of categories) {
    const categoryKeywords = category.keywords || [];
    const categoryWeight = category.weight || 1;
    
    let categoryMatched = false;
    
    // Check if any keyword from this category is present in text or tags
    for (const keyword of categoryKeywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Check in text content
      if (text.includes(keywordLower)) {
        categoryMatched = true;
        break;
      }
      
      // Check in extracted tags
      if (itemTags.some(tag => tag.includes(keywordLower))) {
        categoryMatched = true;
        break;
      }
    }
    
    if (categoryMatched) {
      totalScore += categoryWeight;
    }
  }
  
  // Return raw keyword score (will be multiplied by editorial weight)
  return Math.max(1, Math.min(5, totalScore));
}

function getEditorialMultiplier(editoria: string, editorialWeights: any[]): number {
  const weight = editorialWeights.find(w => w.editoria === editoria);
  return weight ? Number(weight.multiplier) : 1.0; // Default multiplier
}