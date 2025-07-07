import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
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
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`AI content enhancement request from user: ${user.email}`);

    const { content, type = 'summary', persona = 'professional' } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    try {
      let result;
      
      // Se temos OpenAI, usar ela para melhorar conteúdo
      if (openaiApiKey) {
        result = await enhanceWithOpenAI(content, type, persona);
      } 
      // Fallback para Perplexity se não tiver OpenAI
      else if (perplexityApiKey) {
        result = await enhanceWithPerplexity(content, type, persona);
      } 
      else {
        return new Response(
          JSON.stringify({ 
            error: 'Nenhuma API de IA configurada. Configure OPENAI_API_KEY ou PERPLEXITY_API_KEY.' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Erro no enhancement de conteúdo:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
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

async function enhanceWithOpenAI(content: string, type: string, persona: string) {
  const systemPrompts = {
    summary: `Você é um curador expert do Brasis.IA especializado em resumir conteúdo brasileiro de forma clara e envolvente. 
    Persona: ${persona}. 
    Crie resumos que capturem a essência e relevância para o Brasil real.`,
    
    linkedin: `Você é um especialista em LinkedIn do Brasis.IA criando posts envolventes sobre o Brasil. 
    Persona: ${persona}. 
    Crie posts profissionais que gerem engajamento e discussão.`,
    
    instagram: `Você é um especialista em Instagram do Brasis.IA criando conteúdo visual sobre o Brasil. 
    Persona: ${persona}. 
    Crie posts criativos e visuais que conectem com a audiência brasileira.`,
    
    newsletter: `Você é um editor do Radar Brasis criando conteúdo para newsletter. 
    Persona: ${persona}. 
    Crie conteúdo informativo e bem estruturado para newsletter.`
  };

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
          content: systemPrompts[type] || systemPrompts.summary
        },
        {
          role: 'user',
          content: `Melhore este conteúdo: ${content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const enhancedContent = data.choices[0]?.message?.content;

  if (!enhancedContent) {
    throw new Error('Nenhum conteúdo retornado pela OpenAI');
  }

  return {
    success: true,
    enhanced_content: enhancedContent,
    original_content: content,
    enhancement_type: type,
    persona: persona,
    api_used: 'openai'
  };
}

async function enhanceWithPerplexity(content: string, type: string, persona: string) {
  const systemPrompts = {
    summary: `Você é um curador expert especializado em resumir conteúdo brasileiro. Persona: ${persona}.`,
    linkedin: `Você é um especialista em LinkedIn criando posts sobre o Brasil. Persona: ${persona}.`,
    instagram: `Você é um especialista em Instagram criando conteúdo brasileiro. Persona: ${persona}.`,
    newsletter: `Você é um editor criando conteúdo para newsletter brasileira. Persona: ${persona}.`
  };

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
          content: systemPrompts[type] || systemPrompts.summary
        },
        {
          role: 'user',
          content: `Melhore este conteúdo: ${content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  const enhancedContent = data.choices[0]?.message?.content;

  if (!enhancedContent) {
    throw new Error('Nenhum conteúdo retornado pela Perplexity');
  }

  return {
    success: true,
    enhanced_content: enhancedContent,
    original_content: content,
    enhancement_type: type,
    persona: persona,
    api_used: 'perplexity'
  };
}