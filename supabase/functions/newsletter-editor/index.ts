import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

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

// Rate limiting: simple in-memory store (resets on function restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10; // 10 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // First request or window expired
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false; // Rate limit exceeded
  }
  
  userLimit.count++;
  return true;
}

function logSecurityEvent(eventType: string, userId: string, details: any) {
  console.log(`[SECURITY] ${eventType} - User: ${userId} - Details:`, details);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticação JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logSecurityEvent('newsletter_editor_no_auth', 'anonymous', {});
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.substring(7);
    
    // Create authenticated Supabase client using anon key + user JWT (respects RLS)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logSecurityEvent('newsletter_editor_invalid_token', 'anonymous', { error: authError?.message });
      return new Response(
        JSON.stringify({ error: 'Invalid token' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Rate limiting check
    if (!checkRateLimit(user.id)) {
      logSecurityEvent('newsletter_editor_rate_limit', user.id, { limit: RATE_LIMIT_MAX });
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again in a few moments.' }), 
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!openAIApiKey) {
      console.error('OpenAI API key não configurada');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key não configurada' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { newsletterText, publicoAlvo, customPrompt } = await req.json();

    if (!newsletterText) {
      return new Response(
        JSON.stringify({ error: 'Texto da newsletter é obrigatório' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('📝 Processando newsletter com IA...');
    console.log('🎯 Público-alvo:', publicoAlvo || 'Não especificado');
    console.log('👤 Usuário:', user.id);

    // Buscar prompt personalizado do usuário se não fornecido
    let finalPrompt = customPrompt;
    
    if (!customPrompt) {
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('ai_newsletter_prompt')
        .eq('user_id', user.id)
        .maybeSingle();
      
      finalPrompt = userSettings?.ai_newsletter_prompt;
    }

    // Prompt base como fallback
    const basePrompt = `# Nome do GPT  
Lovable Editor – Texto Corrigido com Storytelling

## 🏆 Missão Principal  
"Você é um editor-chefe de newsletters. Sua função é revisar, corrigir e transformar conteúdos de diferentes editorias em um texto fluido, bem escrito e envolvente. Sua entrega deve manter o que já funciona, aplicar storytelling leve e sair pronta para ser copiada e colada na ferramenta de envio de newsletters."

## 📌 Como você deve atuar  
- **Revise apenas o necessário**: ortografia, gramática, repetição, truncamentos, falhas de coesão.  
- **Mantenha o conteúdo funcional e bem escrito.**  
- Reescreva os resumos com storytelling leve, tornando a leitura mais fluida e conectada.  
- Agrupe os conteúdos por editoria.  
- Para cada editoria:  
  - Comece com uma **frase de abertura que conecte os temas** (como se fosse um microeditorial).  
  - Liste os itens com **bullet points** usando o padrão abaixo.  
  - Finalize com uma **chamada curta de encerramento**.

## 🧩 Formato da saída (texto plano)

**[Nome da Editoria]**  
📌 [Storytelling de introdução com 1 ou 2 frases]  

• **[Título da Notícia 1]** – [Resumo com narrativa fluida e contexto leve]. [Leia mais](link)  
• **[Título da Notícia 2]** – [Resumo com storytelling curto e direto]. [Leia mais](link)

➡️ [Fechamento breve e provocativo que convide à reflexão ou leitura complementar]

(Repita esse bloco para cada editoria presente)

## ⚠️ Restrições  
- Não modifique links ou títulos já corretos.  
- Não use termos promocionais, mantenha uma linguagem editorial.  
- Mantenha o texto **economizado e direto**, sem floreios ou inchaço desnecessário.  
- Evite repetir a mesma estrutura de frase entre os itens. Varie o estilo sutilmente.

## 🛠️ Técnicas aplicadas  
- Correção mínima com impacto máximo  
- Storytelling editorial leve  
- Agrupamento lógico por editoria  
- Adaptação de tom conforme o público informado`;

    // Usar prompt salvo do usuário ou fallback para o base
    if (!finalPrompt) {
      finalPrompt = basePrompt;
    }
    
    // Adicionar contexto de público-alvo se fornecido
    if (publicoAlvo) {
      finalPrompt += `\n\n## 📂 PÚBLICO_ALVO:\n${publicoAlvo}\n\nAdapte o texto conforme essas diretrizes de público-alvo.`;
    }

    finalPrompt += `\n\n---\n\nAGORA, refine o seguinte conteúdo de newsletter:\n\n${newsletterText}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um editor especialista em newsletters. Sempre retorne texto em formato plano, sem markdown ou formatações especiais.' 
          },
          { 
            role: 'user', 
            content: finalPrompt 
          }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro na API OpenAI:', errorData);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar com OpenAI' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    const refinedText = data.choices[0].message.content;

    console.log('✅ Newsletter refinada com sucesso');
    logSecurityEvent('newsletter_editor_success', user.id, { length: refinedText.length });

    return new Response(
      JSON.stringify({ 
        refinedText,
        originalLength: newsletterText.length,
        refinedLength: refinedText.length,
        publicoAlvo: publicoAlvo || null,
        promptUsed: customPrompt ? 'custom' : 'saved'
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro na função newsletter-editor:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});