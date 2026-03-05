import { Injectable, Logger } from '@nestjs/common';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import OpenAI from 'openai';
import { GoogleGenAI, Modality } from '@google/genai';
import { BrandKit, PostCategory, PostFormat, Profession } from '@prisma/client';

// Regras visuais por conselho — o que DEVE aparecer na arte
const COUNCIL_VISUAL_RULES: Record<string, string> = {
  MEDICO: `REGRAS VISUAIS CFM:
- OBRIGATÓRIO no rodapé da arte: nome completo do médico + "CRM XXXXX/UF"
- NÃO usar imagens de "antes e depois" de procedimentos
- NÃO prometer cura ou resultados garantidos no texto da arte
- PERMITIDO: foto profissional do médico, conteúdo educativo, especialidade`,

  NUTRICIONISTA: `REGRAS VISUAIS CFN:
- OBRIGATÓRIO no rodapé da arte: nome completo + "CRN XXXXX"
- NÃO usar números específicos de perda de peso (ex: "perca 10kg") no visual
- NÃO associar imagem corporal a resultado de tratamento
- PERMITIDO: alimentos saudáveis, infográficos nutricionais, dicas visuais`,

  PSICOLOGO: `REGRAS VISUAIS CFP:
- OBRIGATÓRIO no rodapé da arte: nome completo + "CRP XXXXX/UF"
- NÃO prometer cura ou resultados terapêuticos específicos no texto visual
- NÃO usar elementos que induam sensação de urgência ou manipulação emocional
- PERMITIDO: psicoeducação visual, elementos de bem-estar, cores tranquilizantes`,

  ENFERMEIRO: `REGRAS VISUAIS COFEN:
- OBRIGATÓRIO no rodapé da arte: nome completo + "COREN XXXXX/UF"
- NÃO induzir substituição de consulta médica no texto da arte
- PERMITIDO: conteúdo preventivo, promoção de saúde, cuidados de enfermagem`,

  DENTISTA: `REGRAS VISUAIS CFO:
- OBRIGATÓRIO no rodapé da arte: nome completo + "CRO XXXXX/UF"
- NÃO usar fotos de antes/depois de tratamentos odontológicos
- NÃO prometer resultados estéticos garantidos no texto
- PERMITIDO: saúde bucal educativa, procedimentos gerais, higiene oral`,

  FARMACEUTICO: `REGRAS VISUAIS CFF:
- OBRIGATÓRIO no rodapé da arte: nome completo + "CRF XXXXX/UF"
- NÃO recomendar medicamentos específicos no texto visual
- NÃO induzir automedicação
- PERMITIDO: uso racional de medicamentos, saúde preventiva, informações gerais`,

  OUTRO: `REGRAS GERAIS:
- OBRIGATÓRIO no rodapé: nome do profissional + número de registro
- Siga boas práticas de ética profissional em saúde`,
};

const COUNCIL_RULES: Record<string, string> = {
  MEDICO: `
- PROIBIDO: prometer cura, prometer resultados garantidos, usar superlativos como "o melhor", "o único"
- PROIBIDO: divulgar preços ou condições de pagamento
- OBRIGATÓRIO: identificar-se com nome e CRM ao final
- PERMITIDO: conteúdo educativo, divulgação de especialidade e serviços de forma sóbria`,

  NUTRICIONISTA: `
- PROIBIDO: prometer emagrecimento com números específicos (ex: "perca 10kg")
- PROIBIDO: associar imagem corporal a resultado de tratamento
- OBRIGATÓRIO: identificar-se com nome e CRN ao final
- PERMITIDO: conteúdo educativo sobre alimentação saudável, receitas, hábitos`,

  PSICOLOGO: `
- PROIBIDO: autopromoção excessiva, prometer cura ou resultados terapêuticos
- PROIBIDO: divulgar casos clínicos mesmo sem identificar o paciente
- OBRIGATÓRIO: identificar-se com nome e CRP ao final
- PERMITIDO: psicoeducação, divulgação de abordagens terapêuticas de forma geral`,

  ENFERMEIRO: `
- PROIBIDO: anunciar título ou especialidade não reconhecida pelo COFEN
- PROIBIDO: induzir o público a substituir consulta médica por serviços de enfermagem
- OBRIGATÓRIO: identificar-se com nome e COREN ao final
- PERMITIDO: conteúdo educativo em saúde, prevenção e promoção de saúde`,

  DENTISTA: `
- PROIBIDO: divulgar fotos de antes e depois de tratamentos
- PROIBIDO: usar linguagem sensacionalista ou prometer resultados estéticos garantidos
- OBRIGATÓRIO: identificar-se com nome e CRO ao final
- PERMITIDO: conteúdo educativo sobre saúde bucal, procedimentos de forma geral`,

  FARMACEUTICO: `
- PROIBIDO: recomendar ou prescrever medicamentos específicos ao público
- PROIBIDO: induzir automedicação
- OBRIGATÓRIO: identificar-se com nome e CRF ao final
- PERMITIDO: informações gerais sobre uso racional de medicamentos, saúde preventiva`,

  OUTRO: `
- Siga as boas práticas gerais de ética profissional em saúde
- OBRIGATÓRIO: identificar-se com nome e número de registro ao final`,
};

const CATEGORY_INSTRUCTIONS: Record<PostCategory, string> = {
  EDUCATIVO:
    'Crie um conteúdo educativo ou de dica prática para saúde. Analise o tema e escolha o melhor formato: se o tema pede explicação aprofundada (mecanismo de doença, conceito médico, dado científico), use narrativa com gancho (pergunta ou estatística) → explicação acessível → fato prático → identificação. Se o tema pede ação imediata (hábito, cuidado diário, procedimento), use lista numerada ou bullets (✅, ✓) com gancho de problema → dicas aplicáveis → encerramento motivador → identificação. Em ambos os casos: linguagem clara, sem jargões, acessível ao leigo.',
  INSTITUCIONAL:
    'Crie um texto institucional. Pode ser: apresentação de procedimento ou serviço, chamada para agendamento, data comemorativa, ou destaque de diferenciais da clínica. Adapte o tom ao subtema: informativo para procedimentos, acolhedor para agendamentos, celebrativo para datas. Sem prometer resultados. Use a primeira pessoa quando fizer sentido. Termine sempre com identificação profissional.',
  MOTIVACIONAL:
    'Crie um texto inspirador sobre saúde e autocuidado. Tom reflexivo, empoderador. Pode ser uma reflexão filosófica ou uma mensagem de incentivo. Estrutura: frase de impacto → desenvolvimento emocional (2-3 parágrafos curtos) → convite à ação → identificação.',
  CRIATIVO_ANUNCIO:
    'Crie um texto persuasivo para anúncio de serviço médico. Estrutura OBRIGATÓRIA: 1) Gancho com problema do paciente (ex: "Dor no joelho limitando sua vida?") → 2) Solução com 3 benefícios concretos em lista (✓) → 3) Prova social ou diferencial → 4) CTA FORTE na penúltima linha (exemplos: "👇 Toque para saber mais", "📱 Chame no WhatsApp", "🗓️ Agende sua avaliação agora", "Clique no link da bio") → 5) Identificação. O CTA é OBRIGATÓRIO e deve ser a última linha antes da identificação. Não prometa resultados garantidos.',
};

// Mapeamento de PostCategory para nome da pasta de referências
const CATEGORY_FOLDER_MAP: Record<PostCategory, string> = {
  EDUCATIVO: 'Educativo',
  INSTITUCIONAL: 'Institucional',
  MOTIVACIONAL: 'Motivacional',
  CRIATIVO_ANUNCIO: 'Anuncio',
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openrouter: OpenAI;
  private readonly gemini: GoogleGenAI;

  constructor() {
    this.openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY || '',
      defaultHeaders: {
        'HTTP-Referer': 'https://clinify.com.br',
        'X-Title': 'Clinify',
      },
    });
    this.gemini = new GoogleGenAI({
      apiKey: process.env.GOOGLE_AI_API_KEY || '',
    });
  }

  async testOpenRouter(): Promise<string> {
    const response = await this.openrouter.chat.completions.create({
      model: process.env.OPENROUTER_TEXT_MODEL || 'anthropic/claude-sonnet-4-6',
      max_tokens: 20,
      messages: [{ role: 'user', content: 'Responda apenas: OK' }],
    });
    return response.choices[0]?.message?.content || 'empty response';
  }

  async testGoogleAI(): Promise<string> {
    const model = process.env.GOOGLE_IMAGE_MODEL || 'nano-banana-pro-preview';
    const response = await this.gemini.models.generateContent({
      model,
      contents: 'Responda apenas: OK',
    });
    return response.text || 'empty response';
  }

  async testGoogleAIImage(): Promise<string> {
    const models = [
      process.env.GOOGLE_IMAGE_MODEL || 'nano-banana-pro-preview',
      'gemini-2.5-flash-image',
    ];
    for (const model of models) {
      try {
        const response = await this.gemini.models.generateContent({
          model,
          contents: { role: 'user', parts: [{ text: 'Generate a simple blue square, 100x100 pixels.' }] },
          config: {
            responseModalities: [Modality.IMAGE],
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        const parts = response.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData?.data);
        if (imagePart?.inlineData?.data) {
          return `ok (${model}, ${Math.round(imagePart.inlineData.data.length / 1024)}KB)`;
        }
        return `no image in response (${model})`;
      } catch (err: any) {
        this.logger.warn(`testGoogleAIImage failed for ${model}: ${err.message}`);
        continue;
      }
    }
    throw new Error('All image models failed');
  }

  async generateCaption(params: {
    theme: string;
    category: PostCategory;
    profession: Profession;
    brandKit: Partial<BrandKit>;
  }): Promise<string> {
    const { theme, category, profession, brandKit } = params;
    const rules = COUNCIL_RULES[profession] || COUNCIL_RULES.OUTRO;
    const categoryInstruction = CATEGORY_INSTRUCTIONS[category];

    const professionalId = brandKit.registrationNumber
      ? `${brandKit.professionalName || ''} | ${brandKit.registrationCouncil || ''} ${brandKit.registrationNumber}`
      : brandKit.professionalName || '';

    const systemPrompt = `Você é um especialista em marketing digital para profissionais da saúde no Brasil.
Você conhece profundamente as normas de publicidade do CFM, CFN, CFP, COFEN, CFO e CFF.
Você cria legendas para Instagram que são profissionais, engajantes e 100% dentro das normas éticas.

REGRAS PARA ${profession}:
${rules}

INSTRUÇÕES GERAIS:
- Escreva em português brasileiro, tom profissional mas acessível
- Use emojis com moderação (1-3 por legenda)
- Inclua hashtags relevantes no final (5-10 hashtags)
- Legenda entre 150-300 palavras
- Termine SEMPRE com a identificação profissional`;

    const userPrompt = `Crie uma legenda para Instagram com o seguinte tema: "${theme}"

Tipo de conteúdo: ${category}
${categoryInstruction}

Profissional: ${brandKit.professionalName || 'Profissional da saúde'}
Especialidade: ${brandKit.specialty || 'Saúde'}
Bio: ${brandKit.bio || ''}
Identificação: ${professionalId}

Gere APENAS a legenda, sem explicações adicionais.`;

    const response = await this.openrouter.chat.completions.create({
      model: process.env.OPENROUTER_TEXT_MODEL || 'anthropic/claude-sonnet-4-6',
      max_tokens: 700,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error('Resposta vazia do OpenRouter');

    this.logger.log(`Legenda gerada para tema: ${theme}`);
    return text;
  }

  private loadImagesFromDir(dir: string, limit: number): Array<{ mimeType: string; data: string }> {
    if (!existsSync(dir)) return [];
    try {
      const files = readdirSync(dir)
        .filter((f) => /\.(png|jpg|jpeg)$/i.test(f))
        .slice(0, limit);
      return files.map((file) => {
        const data = readFileSync(join(dir, file)).toString('base64');
        const mimeType = file.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        return { mimeType, data };
      });
    } catch {
      return [];
    }
  }

  private loadReferenceImages(category?: PostCategory): Array<{ mimeType: string; data: string }> {
    const refDir = join(process.cwd(), '..', 'referencias');
    if (!existsSync(refDir)) return [];

    const results: Array<{ mimeType: string; data: string }> = [];

    // 1. Imagens específicas da categoria (até 2)
    if (category) {
      const folderName = CATEGORY_FOLDER_MAP[category];
      const categoryDir = join(refDir, folderName);
      results.push(...this.loadImagesFromDir(categoryDir, 2));
    }

    // 2. Completar com imagens da raiz (até 4 no total)
    const remaining = 4 - results.length;
    if (remaining > 0) {
      results.push(...this.loadImagesFromDir(refDir, remaining));
    }

    return results;
  }

  private loadCopyExample(category: PostCategory): string {
    const copiesDir = join(process.cwd(), '..', 'referencias', 'copies');
    const filePath = join(copiesDir, `${category}.txt`);
    if (!existsSync(filePath)) return '';
    try {
      return readFileSync(filePath, 'utf-8').trim();
    } catch {
      return '';
    }
  }

  async generateThemeSuggestions(
    userId: string,
    category: PostCategory,
    format: PostFormat,
    prisma: any,
  ): Promise<string[]> {
    const categoryLabel: Record<PostCategory, string> = {
      EDUCATIVO: 'Educativo (conteúdo informativo ou dica prática de saúde)',
      INSTITUCIONAL: 'Institucional (procedimentos, serviços, datas comemorativas, agendamento)',
      MOTIVACIONAL: 'Motivacional (inspiração, autocuidado, mensagem positiva)',
      CRIATIVO_ANUNCIO: 'Anúncio (persuasivo com chamada para ação)',
    };

    const formatLabel: Record<PostFormat, string> = {
      FEED: 'Feed quadrado (1:1 — 1080x1080px)',
      PORTRAIT: 'Post retrato Instagram (4:5 — 1080x1350px)',
      STORIES: 'Stories vertical (9:16 — 1080x1920px)',
      CARROSSEL: 'Carrossel (múltiplos slides — 1:1)',
    };

    // Buscar contexto do profissional: especialidade, profissão, áreas de expertise
    const brandKit = await prisma.brandKit.findUnique({ where: { userId } });

    // Buscar temas recentes para evitar repetição
    const recentPosts = await prisma.post.findMany({
      where: { userId },
      select: { theme: true },
      orderBy: { createdAt: 'desc' },
      take: 15, // Últimos 15 temas
    });
    const recentThemes = recentPosts.map((p: any) => p.theme).join('\n');

    const professionLabel: Record<string, string> = {
      MEDICO: 'Médico',
      NUTRICIONISTA: 'Nutricionista',
      PSICOLOGO: 'Psicólogo',
      ENFERMEIRO: 'Enfermeiro',
      DENTISTA: 'Dentista',
      FARMACEUTICO: 'Farmacêutico',
      OUTRO: 'Profissional de Saúde',
    };

    const profession = brandKit?.profession ? professionLabel[brandKit.profession] : 'Profissional de Saúde';
    const specialty = brandKit?.specialty ? ` de ${brandKit.specialty}` : '';
    const areasStr = brandKit?.areasOfExpertise?.length
      ? `\nÁreas adicionais de expertise: ${brandKit.areasOfExpertise.join(', ')}`
      : '';

    const response = await this.openrouter.chat.completions.create({
      model: process.env.OPENROUTER_TEXT_MODEL || 'anthropic/claude-sonnet-4-6',
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content:
            'Você é especialista em marketing digital para profissionais de saúde no Brasil. Gere sugestões CRIATIVAS, VARIADAS e INOVADORAS de temas para posts de Instagram — nunca repetindo temas anteriores do profissional. Retorne SOMENTE um array JSON sem markdown nem explicações.',
        },
        {
          role: 'user',
          content: `CONTEXTO DO PROFISSIONAL:
Profissão: ${profession}${specialty}${areasStr}

RESTRIÇÃO CRÍTICA — TEMAS JÁ USADOS (não repita):
${recentThemes || 'Nenhum tema anterior'}

TAREFA:
Gere 10 sugestões NOVAS, CRIATIVAS e DIFERENTES de temas para posts de Instagram.

Categoria: ${categoryLabel[category]}
Formato: ${formatLabel[format]}

DIRETRIZES:
- Cada tema deve ter 10-40 palavras, específico e detalhado
- Varie radicalmente: educativo, emocional, prático, técnico, motivacional
- Explora ângulos únicos: estatísticas, casos reais, tendências, curiosidades, prevenção
- Nunca repita os temas listados acima
- Considere a especialidade e áreas adicionais do profissional
- Gere temas que tenham potencial viral e educacional

Retorne SOMENTE o array JSON: ["tema 1", "tema 2", ..., "tema 10"]`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content || '';
    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
      return JSON.parse(text.trim());
    } catch {
      return [];
    }
  }

  async generatePostTexts(params: {
    theme: string;
    category: PostCategory;
    format: PostFormat;
    profession: Profession;
    brandKit: Partial<BrandKit>;
    alternativeApproach?: boolean;
  }): Promise<{ headline: string; subtitle: string; caption: string }> {
    const { theme, category, format, profession, brandKit, alternativeApproach } = params;
    const rules = COUNCIL_RULES[profession] || COUNCIL_RULES.OUTRO;
    const categoryInstruction = CATEGORY_INSTRUCTIONS[category];

    const professionalId = brandKit.registrationNumber
      ? `${brandKit.professionalName || ''} | ${brandKit.registrationCouncil || ''} ${brandKit.registrationNumber}`
      : brandKit.professionalName || '';

    const formatHint =
      format === 'STORIES'
        ? 'Formato Stories (vertical) — textos curtos e de alto impacto.'
        : format === 'CARROSSEL'
          ? 'Formato Carrossel — o headline deve incitar curiosidade para deslizar.'
          : format === 'PORTRAIT'
            ? 'Formato retrato 4:5 (1080x1350px) — aproveite o espaço vertical extra, hierarquia clara com headline grande no topo e subtítulo abaixo.'
            : 'Formato Feed quadrado — headline equilibrado com espaço para subtítulo.';

    const alternativeNote = alternativeApproach
      ? '\n\nATENÇÃO — ABORDAGEM ALTERNATIVA: Crie um ângulo COMPLETAMENTE DIFERENTE. Use outro gancho, outro foco, outro tom. Se a versão anterior usou pergunta, use afirmação. Se foi emocional, seja técnico. Surpreenda com criatividade original.'
      : '';

    const copyExample = this.loadCopyExample(category);
    const exampleSection = copyExample
      ? `\nEXEMPLO DE LEGENDA DE REFERÊNCIA PARA ESTE TIPO:\n---\n${copyExample}\n---\nUse como base de tom, estrutura e tamanho — mas crie conteúdo 100% original e adaptado ao tema.`
      : '';

    const systemPrompt = `Você é especialista em marketing digital para profissionais da saúde no Brasil.
Você cria textos para posts de Instagram: headline (texto grande na arte), subtítulo de apoio e legenda completa.

REGRAS PARA ${profession}:
${rules}
${exampleSection}
${alternativeNote}

Responda SOMENTE com JSON válido neste formato exato (sem markdown, sem explicações):
{
  "headline": "frase de 4-8 palavras de alto impacto",
  "subtitle": "frase de apoio com até 12 palavras ou string vazia",
  "caption": "legenda completa do Instagram entre 150-300 palavras com emojis e hashtags"
}`;

    const userPrompt = `Tema do post: "${theme}"
Tipo: ${category}
${categoryInstruction}
${formatHint}

Profissional: ${brandKit.professionalName || 'Profissional da saúde'}
Especialidade: ${brandKit.specialty || 'Saúde'}
Bio: ${brandKit.bio || ''}
Identificação: ${professionalId}

Gere headline, subtítulo e legenda. Responda APENAS com o JSON.`;

    const response = await this.openrouter.chat.completions.create({
      model: process.env.OPENROUTER_TEXT_MODEL || 'anthropic/claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error('Resposta vazia do OpenRouter');

    try {
      const parsed = JSON.parse(text.trim());
      this.logger.log(`Textos gerados para tema: ${theme}`);
      return {
        headline: parsed.headline || '',
        subtitle: parsed.subtitle || '',
        caption: parsed.caption || '',
      };
    } catch {
      // Fallback: tenta extrair o JSON mesmo com texto extra (ex: markdown code block)
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          headline: parsed.headline || '',
          subtitle: parsed.subtitle || '',
          caption: parsed.caption || '',
        };
      }
      throw new Error(`Falha ao parsear JSON: ${text.substring(0, 200)}`);
    }
  }

  async generatePostImage(params: {
    theme: string;
    category: PostCategory;
    format: PostFormat;
    designStyle: string;
    brandKit: Partial<BrandKit>;
    headline: string;
    subtitle: string;
    caption: string;
    userPhotoUrl?: string;
    contextPhotoUrl?: string;
  }): Promise<{ base64: string; mimeType: string }> {
    const { theme, category, format, designStyle, brandKit, headline, subtitle, userPhotoUrl, contextPhotoUrl } = params;

    const primaryColor = brandKit.brandPrimaryColor || '#0e82eb';
    const secondaryColor = brandKit.brandSecondaryColor || '#fbbf24';
    const professionalName = brandKit.professionalName || 'Dr./Dra.';
    const profession = (brandKit.profession as string) || 'OUTRO';
    // Evita "CRM CRM 000129/RO" caso o número já contenha o conselho
    const rawNumber = (brandKit.registrationNumber || '').trim();
    const council = (brandKit.registrationCouncil || '').trim();
    const registration = rawNumber
      ? (council && rawNumber.toUpperCase().includes(council.toUpperCase())
          ? rawNumber
          : `${council} ${rawNumber}`.trim())
      : '';
    const preferredFont = (brandKit as any).preferredFont as string | undefined;
    const specialty = brandKit.specialty || '';

    // Regras visuais do conselho
    const councilVisualRules = COUNCIL_VISUAL_RULES[profession] || COUNCIL_VISUAL_RULES.OUTRO;

    // Fonte
    // Convertemos o nome da fonte em características visuais para evitar que o Gemini escreva o nome na arte
    const fontStyleMap: Record<string, string> = {
      'Playfair Display': 'serifada elegante de alto contraste com serifs finas e strokes espessos — estilo editorial clássico',
      'Montserrat':       'sans-serif geométrica bold, letras com largura uniforme — estilo moderno e limpo',
      'Lato':             'sans-serif humanista leve, traços suaves — estilo contemporâneo e acessível',
      'Raleway':          'sans-serif elegante com letras finas e espaçamento generoso — estilo premium',
      'Roboto':           'sans-serif neutra, altamente legível — estilo clean e profissional',
      'Open Sans':        'sans-serif aberta e amigável — estilo informativo e acessível',
      'Merriweather':     'serifada robusta com serifs proeminentes — estilo editorial sólido',
      'Cormorant Garamond': 'serifada clássica de alto refinamento, serifs muito finas — estilo luxuoso e intelectual',
    };
    const fontDesc = preferredFont
      ? (fontStyleMap[preferredFont] ?? `serifada refinada, com características de "${preferredFont}"`)
      : null;
    const fontInstruction = fontDesc
      ? `Tipografia dos títulos: use tipografia ${fontDesc}. PROIBIDO escrever o nome da fonte como texto na arte.`
      : `Tipografia: serifada refinada para conteúdo educativo/institucional, sans-serif bold para anúncios e dicas.`;

    // Layout por formato
    const layoutInstructions: Record<PostFormat, string> = {
      FEED: `Formato quadrado 1:1 (1080x1080px). Margens internas generosas (min 60px cada lado). Identidade profissional no canto superior esquerdo (nome + especialidade, em texto pequeno).`,
      PORTRAIT: `Formato retrato 4:5 (1080x1350px). Use o espaço vertical extra com inteligência: área superior para elemento visual/fotográfico, área inferior para textos + identidade. Margens internas min 60px. O formato é levemente mais alto que o quadrado — distribua os elementos verticalmente de forma equilibrada.`,
      STORIES: `Formato vertical 9:16 (1080x1920px). Identidade profissional no topo (nome + especialidade). Texto grande e legível para leitura mobile. Aproveite o espaço vertical com composição editorial atraente.`,
      CARROSSEL: `Formato quadrado 1:1 (1080x1080px), slide 1 do carrossel. "01" discreto no canto. Headline impactante. "Arraste para o lado →" no rodapé.`,
    };

    // Instrução específica por categoria
    const categoryVisualGuide: Record<PostCategory, string> = {
      EDUCATIVO: `CATEGORIA EDUCATIVO:
- Visual informativo e confiável — pode oscilar entre dois sub-estilos conforme o tema:
  • Narrativo/aprofundado: paleta neutra (branco, creme, azul suave), elemento de revista médica, hierarquia headline → texto → identificação
  • Dica prática: cores mais calorosas (verde, terracota, azul-claro), layout com lista visual ou numeração, tom de conselho acessível
- Escolha o sub-estilo que melhor combina com o headline aprovado
- Pode ter elemento infográfico sutil (lista, ícone temático, numeração destacada)`,

      INSTITUCIONAL: `CATEGORIA INSTITUCIONAL:
- Visual corporativo premium, autoridade e credibilidade
- Fundo escuro ou neutro sofisticado com a cor da marca
- Nome do profissional e especialidade com destaque especial
- Tipografia refinada, composição centrada e simétrica
- Transmite: "você está em boas mãos"`,

      MOTIVACIONAL: `CATEGORIA MOTIVACIONAL:
- Visual inspirador e emocional — cores fortes, composição ousada
- Frase grande, tipografia com impacto visual máximo (pode ser uma palavra enorme)
- Fundo pode ser gradiente vibrante, textura dramática, ou foto com overlay forte
- Menos elementos gráficos, mais espaço em branco ou fundo expressivo
- Tom: reflexivo, empoderador`,

      CRIATIVO_ANUNCIO: `CATEGORIA ANÚNCIO:
- Visual persuasivo e de alto impacto comercial
- Contraste máximo: fundo escuro com texto brilhante OU fundo branco com elementos coloridos fortes
- CTA visual implícito — composição que chama atenção para o serviço
- Headline comercial direto, fonte bold/condensed
- Pode ter elementos gráficos decorativos mais agressivos (formas, ângulos, energia)
- Transmite urgência e valor — como anúncio de clínica premium`,
    };

    // Guia de estilo por tipo de variação (3 tipos radicalmente diferentes)
    const variationGuide: Record<string, string> = {
      fotografico: `VARIAÇÃO 1 — EDITORIAL FOTOGRÁFICO:
Referência exata: posts do Instagram de cirurgiões vasculares e dermatologistas brasileiros premium — paleta muted, fotografia de qualidade editorial, tipografia refinada.

FOTO (fundo, full-bleed borda a borda):
- Foto realista e cinematográfica relacionada ao tema "${theme}"
- Exemplos: corpo humano em close artístico (mãos, pernas, silhueta), ambiente clínico elegante, elemento da natureza relacionado ao tema, textura macro (folha, tecido, material orgânico)
- Paleta muted e desaturada — não vibrante. Tons neutros, terrosos, azulados ou esverdeados, dependendo do tema
- SEM rostos de pessoas identificáveis

TEXTO (sem sombra):
- Posicionar o texto na área da foto com contraste natural (zona mais escura ou mais clara)
- Se necessário: gradiente linear suave (transparente → escuro ou transparente → claro) APENAS na metade onde o texto fica — nunca em toda a imagem
- Mix tipográfico obrigatório: serif grande para o headline principal + italic serifado para a palavra-chave de destaque dentro do headline + sans-serif menor para o subtítulo
- Exemplo de hierarquia: "Como a" (pequeno, sans-serif) + "dor *nas* pernas" (grande, serif com "nas" em italic) + "é causada pelas varizes?" (médio, sans-serif)

IDENTIDADE (discreta — ver seção IDENTIFICAÇÃO abaixo):
- Posição: canto superior esquerdo com logo + nome, OU rodapé esquerdo — nunca em dois lugares`,

      tipografico: `VARIAÇÃO 2 — TIPOGRAFIA DOMINANTE:
Referência exata: posts editoriais de médicos brasileiros com fundo limpo e tipografia como protagonista absoluto.

FUNDO (100% do canvas, sem exceção):
- Cor sólida limpa que preenche TODO o canvas até os pixels da borda: off-white (#F5F2EE ou #FAFAFA), creme (#F0EBE1), cinza claro (#EEEEEE), ou branco puro
- ZERO bordas, ZERO moldura, ZERO card flutuante — o fundo É a imagem inteira
- Máximo 1 elemento fotográfico: foto de corpo/objeto com fundo recortado (sem fundo próprio), posicionada em um dos lados como elemento de composição, não como background

TIPOGRAFIA (protagonista):
- Headline: mix serifado grande + italic em palavra(s) de destaque dentro do mesmo headline
- Exemplo: "Varizes *aumentam* o risco de" (regular) + "TROMBOSE?" (bold/caps grande)
- Subtítulo: sans-serif leve, corpo menor, espaçamento amplo
- 1 detalhe decorativo: linha horizontal fina OU aspas tipográficas grandes em segundo plano

IDENTIDADE (ultra-discreta — ver seção IDENTIFICAÇÃO abaixo):
- Bloco de identidade no rodapé, mesmo tom que o fundo (escuro sobre claro) — sem sombra`,

      grafico: `VARIAÇÃO 3 — ARTE GRÁFICA:
Referência exata: peças de marketing médico com identidade visual forte, cor da marca, elementos gráficos geométricos.

COMPOSIÇÃO:
- Fundo: cor primária ${primaryColor} como base (tom profundo, não pastel)
- Elementos gráficos geométricos sobrepostos em transparência: círculos, formas orgânicas, padrões de grade — em versão mais clara ou mais escura da mesma cor
- Pode incluir elemento visual relacionado ao tema (ícone flat, ilustração médica estilizada, foto com tratamento de cor bold)

TIPOGRAFIA:
- Headline em branco ou creme sobre fundo escuro — sans-serif bold ou serif negrito de alto impacto
- Subtítulo em cor secundária ${secondaryColor} ou versão clara da cor primária
- Hierarquia clara: headline grande → subtítulo médio → identificação pequena

IDENTIDADE (ver seção IDENTIFICAÇÃO abaixo):
- Bloco de identidade no rodapé em branco ou creme. Logo/ícone no canto superior.

RESULTADO: peça gráfica marcante, identidade visual imediata, pronta para tráfego pago`,

    };

    // ── Guia dinâmico para slides de carrossel ───────────────────────────────
    const carrosselMatch = designStyle.match(/^carrossel_(foto|tipo|graf)_(\d+)$/);
    if (carrosselMatch) {
      const carStyle = carrosselMatch[1]; // 'foto' | 'tipo' | 'graf'
      const slideNum = parseInt(carrosselMatch[2]); // 1-5

      const styleTokens: Record<string, string> = {
        foto: `═══ SISTEMA VISUAL SÉRIE FOTOGRÁFICA — APLICAR IDENTICAMENTE EM TODOS OS SLIDES ═══
FUNDO: foto/imagem em full-bleed com overlay escuro semitransparente (escuridão 40-60%) — paleta muted/cinematográfica. NUNCA fundo branco ou sólido sem imagem.
TIPOGRAFIA: 100% BRANCA (#FFFFFF) ou creme (#F5EFE6). Títulos em serif bold grande. Destaques em italic. NUNCA texto escuro sobre fundo escuro.
COR DE ACENTO: ${secondaryColor} apenas para elementos pontuais (linha, sublinhado, badge).
HEADER FIXO (igual em todos): logo versão CLARA/BRANCA — canto superior esquerdo | número "0${slideNum}" — canto superior direito, branco, tipografia clean.
FOOTER FIXO (igual em todos): nome + especialidade + registro em tipografia pequena branca, canto inferior.
PROIBIDO nesta série: fundo sólido sem imagem, tipografia escura, mudar a paleta entre slides, remover o número ou o logo.`,

        tipo: `═══ SISTEMA VISUAL SÉRIE TIPOGRÁFICA — APLICAR IDENTICAMENTE EM TODOS OS SLIDES ═══
FUNDO: off-white SÓLIDO (#F5F2EE) — SEM EXCEÇÃO. NUNCA fundo escuro, NUNCA foto de fundo, NUNCA gradiente dramático.
TIPOGRAFIA: títulos em serif bold ESCURO (#111111 ou #1A1A1A). Destaque italic em palavras-chave. Corpo em sans-serif leve #444. NUNCA texto branco nesta série.
COR DE ACENTO: ${primaryColor} somente em palavras sublinhadas, linha separadora fina ou elemento mínimo de destaque.
HEADER FIXO (igual em todos): logo versão ESCURA/COLORIDA — canto superior esquerdo | número "0${slideNum}" — canto superior direito, #666, discreto.
SEPARADOR FIXO: linha horizontal de 1px em ${primaryColor} ou #DDD entre título e corpo — presente em TODOS os slides.
FOOTER FIXO (igual em todos): nome + especialidade + registro, fonte pequena, cor #555.
PROIBIDO nesta série: fundo colorido sólido, fundo preto, tipografia branca, remover a linha separadora, mudar para estilo escuro em qualquer slide.`,

        graf: `═══ SISTEMA VISUAL SÉRIE GRÁFICA/MARCA — APLICAR IDENTICAMENTE EM TODOS OS SLIDES ═══
FUNDO: ${primaryColor} SÓLIDO como base de 100% do canvas — SEM EXCEÇÃO em todos os 5 slides. NUNCA foto de fundo, NUNCA branco como base.
ELEMENTOS DECORATIVOS FIXOS: formas geométricas simples (círculos, semicírculos, retângulos) na cor ${primaryColor} 20-30% mais clara ou mais escura, dispostas nos cantos/bordas como decoração discreta — IGUAL em todos os slides.
TIPOGRAFIA: 100% BRANCA (#FFFFFF) para títulos. Subtítulos/corpo em branco 80% ou ${secondaryColor}. NUNCA tipografia escura nesta série.
HEADER FIXO (igual em todos): logo versão CLARA/BRANCA — canto superior esquerdo | número "0${slideNum}" — canto superior direito, branco.
FOOTER FIXO (igual em todos): nome + especialidade + registro em tipografia pequena branca.
COMPOSIÇÃO LIMPA: máximo 2 elementos gráficos por slide além do texto — não sobrecarregar o fundo.
PROIBIDO nesta série: múltiplos estilos visuais misturados, fundo branco ou claro, tipografia escura, gradientes que distraem do conteúdo, excesso de elementos gráficos.`,
      };

      // Descrição do elemento visual coerente com a série
      const visualElementMap: Record<string, string> = {
        foto: 'elemento fotográfico: imagem médica/anatômica de alta qualidade em overlay com o fundo dark',
        tipo: `ícone flat minimalista em linha fina (stroke), cor ${primaryColor}, tamanho discreto — sem preencher com cor sólida`,
        graf: `forma geométrica simples (círculo ou semicírculo) em ${primaryColor} 25% mais claro/escuro, como já usado no sistema visual desta série`,
      };
      const visualElement = visualElementMap[carStyle] ?? visualElementMap['foto'];

      const slideContent: Record<number, string> = {
        1: `SLIDE 1 — CAPA:
CONTEÚDO: headline aprovado em destaque máximo, subtítulo menor abaixo.
VISUAL: ${carStyle === 'foto' ? 'Se houver foto do profissional: posicioná-lo como elemento central dominant' : visualElement} — composição equilibrada, hierarquia clara.
DETALHE: texto pequeno "Arraste para ver mais →" no canto inferior direito.
MANTER O SISTEMA VISUAL DA SÉRIE acima — fundo, cores e tipografia idênticos ao definido.`,

        2: `SLIDE 2 — PONTO 1 DE 3:
CONTEÚDO: extraia o PRIMEIRO ponto/sinal/benefício da legenda — título curto (3-5 palavras) + 2-3 linhas explicativas.
VISUAL: ${visualElement} relacionado ao conteúdo do ponto.
DETALHE: "→" discreto canto inferior direito.
MANTER O SISTEMA VISUAL DA SÉRIE acima — mesmo fundo, cores, tipografia e posição do header/footer.`,

        3: `SLIDE 3 — PONTO 2 DE 3:
CONTEÚDO: extraia o SEGUNDO ponto/sinal/benefício da legenda — título diferente do slide 2 (3-5 palavras) + 2-3 linhas.
VISUAL: ${visualElement} diferente do slide 2 mas dentro do mesmo sistema gráfico.
DETALHE: "→" discreto canto inferior direito.
MANTER O SISTEMA VISUAL DA SÉRIE acima — idêntico ao slide 2 em estrutura, apenas o conteúdo muda.`,

        4: `SLIDE 4 — PONTO 3 DE 3:
CONTEÚDO: extraia o TERCEIRO ponto/sinal/benefício da legenda — título diferente dos slides 2 e 3 (3-5 palavras) + 2-3 linhas.
VISUAL: ${visualElement} diferente dos slides anteriores mas no mesmo sistema gráfico.
DETALHE: "→" discreto canto inferior direito.
MANTER O SISTEMA VISUAL DA SÉRIE acima — IDÊNTICO em estrutura aos slides 2 e 3. Só muda o conteúdo textual e o visual de apoio.`,

        5: `SLIDE 5 — CONCLUSÃO / CTA:
⚠️ ATENÇÃO: Gere APENAS UM slide único. NÃO gere collage, grade ou montagem com múltiplas imagens.
CONTEÚDO: mensagem de fechamento (1-2 frases curtas, não repita o headline) + CTA: "Salve este post", "Compartilhe" ou "Agende sua consulta".
IDENTIDADE: logo + nome + especialidade + registro — destaque maior que nos outros slides.${carStyle === 'foto' ? '\nVISUAL: se houver foto do profissional, retomá-la como elemento central de autoridade.' : ''}
MANTER O SISTEMA VISUAL DA SÉRIE acima — ${carStyle === 'tipo' ? 'fundo off-white OBRIGATÓRIO, mesmo que este seja o slide de CTA. Destaque o CTA com elemento de cor pequeno (faixa, botão), sem trocar o fundo.' : 'mesma paleta, tipografia e estrutura dos slides anteriores.'}`,
      };

      variationGuide[designStyle] = `${styleTokens[carStyle]}

━━━ CONTEÚDO ESPECÍFICO DESTE SLIDE (slide ${slideNum}/5) ━━━
${slideContent[slideNum] || slideContent[1]}

⚠️ LEMBRETE FINAL: o sistema visual da série acima é ABSOLUTO. Qualquer elemento deste slide que contradiga o sistema (fundo errado, tipografia errada, cor errada) deve ser ignorado em favor do sistema.`;
    }

    // Slides de conteúdo do carrossel (2-4) NÃO usam o headline da capa
    const isCarrosselSlide = /^carrossel_(foto|tipo|graf)_(\d+)$/.test(designStyle);
    const isCarrosselContentSlide = /^carrossel_(foto|tipo|graf)_[2-4]$/.test(designStyle);
    const isCarrosselConclusionSlide = /^carrossel_(foto|tipo|graf)_5$/.test(designStyle);
    const carrosselSlideNum = isCarrosselSlide ? parseInt(designStyle.match(/_(\d+)$/)![1]) : null;

    const headlineInstruction = isCarrosselContentSlide
      ? `TÍTULO DO SLIDE: derive um título curto e específico (3-5 palavras) do ponto de conteúdo correspondente na legenda. PROIBIDO usar o headline da capa ou repetir títulos de outros slides.`
      : isCarrosselConclusionSlide
        ? `TEXTO DE FECHAMENTO: mensagem de conclusão ou CTA impactante (não repetir o headline da capa).`
        : headline
          ? `HEADLINE APROVADO PELO PROFISSIONAL (use EXATAMENTE): "${headline}"`
          : `Crie um headline de alto impacto (4-8 palavras) relacionado ao tema.`;

    const subtitleInstruction = isCarrosselContentSlide || isCarrosselConclusionSlide
      ? `Subtítulo opcional breve.`
      : subtitle
        ? `SUBTÍTULO APROVADO (use EXATAMENTE): "${subtitle}"`
        : `Subtítulo de apoio opcional — frase curta.`;

    const prompt = `Crie um post profissional para Instagram de saúde — padrão de agência de marketing médico premium do Brasil.

REFERÊNCIAS DE ESTILO (analise e replique o nível de qualidade):
As imagens enviadas mostram o padrão visual alvo. Observe e replique: paleta muted/editorial, tipografia refinada com mix serifado+italic, fotos cinematográficas com overlay sutil, identidade discreta em small caps, ZERO sombra de texto. Este é o nível de qualidade esperado.

REGRAS TÉCNICAS ABSOLUTAS (violação = arte rejeitada):
1. SEM bordas brancas, SEM moldura, SEM frame, SEM card flutuante — a imagem NÃO tem borda de nenhum tipo
2. O pixel mais externo de cada lado da imagem é parte do fundo/design, nunca branco ou cinza de preenchimento
3. Fundo preenche 100% do canvas de borda a borda — válido para TODAS as variações
4. CONTRASTE OBRIGATÓRIO: todo texto visível com contraste mínimo 4.5:1. Texto claro (branco/creme) em fundos escuros. Texto escuro (preto/#222) em fundos claros. NUNCA texto escuro sobre fundo escuro.
5. PROIBIDO sombra de texto (text-shadow/drop-shadow) em qualquer variação. Legibilidade garantida por: (a) posicionar o texto em área da foto com contraste natural, (b) overlay/gradiente suave APENAS na região onde o texto aparece, ou (c) fundo sólido atrás do bloco de texto. Texto limpo, sem efeitos.${isCarrosselSlide ? `
6. SLIDE ÚNICO OBRIGATÓRIO: Você está gerando o SLIDE ${carrosselSlideNum} de 5 de um carrossel do Instagram. Gere APENAS UMA imagem independente e completa. PROIBIDO gerar collage, grade, mosaico, painel com múltiplos frames, ou montagem que mostre outros slides dentro da imagem. Cada slide do carrossel é gerado e publicado separadamente.` : ''}

DIMENSÕES E FORMATO — REGRA ABSOLUTA:
${layoutInstructions[format]}
⚠️ A arte DEVE preencher 100% do canvas no formato especificado. PROIBIDO gerar em outro formato ou deixar áreas vazias/barras pretas. Se o formato é 9:16 (Stories), a imagem INTEIRA deve ser 9:16. Se é 1:1, deve ser quadrada. Se é 4:5, deve ser retrato 4:5.

${categoryVisualGuide[category]}

${variationGuide[designStyle] || variationGuide.fotografico}

IDENTIDADE VISUAL DA MARCA:
- Cor primária: ${primaryColor}
- Cor secundária/destaque: ${secondaryColor}
- ${fontInstruction}

TEXTOS DO POST (aprovados pelo profissional — use exatamente como especificado):
- Tema: "${theme}"
- ${headlineInstruction}
- ${subtitleInstruction}
- Profissional: "${professionalName}"${specialty ? ` — ${specialty}` : ''}

${councilVisualRules}

IDENTIFICAÇÃO PROFISSIONAL (aparecer UMA ÚNICA VEZ na arte — nunca duplicar):
- Linha 1: "${professionalName}"${specialty ? ` | ${specialty}` : ''}
- Linha 2: "${registration}"
- Posicione conforme indicado na variação. PROIBIDO exibir o nome em dois locais distintos da mesma arte.

OBRIGATÓRIO:
- Todos os textos com contraste garantido sobre o fundo
- Elementos visuais 100% originais e sintéticos — NUNCA copiar rostos ou pessoas das referências
- Resultado: imagem pronta para publicar no Instagram, que transmite autoridade médica e profissionalismo`;

    // Carregar imagens de referência: prioriza as da categoria, completa com as gerais
    const referenceImages = this.loadReferenceImages(category);
    this.logger.log(`[${designStyle}] Usando ${referenceImages.length} refs + ${userPhotoUrl ? '1 foto do usuário' : 'sem foto'}`);

    // Montar parts multimodal
    const contentParts: any[] = [
      // Referências visuais
      ...referenceImages.map((img) => ({
        inlineData: { mimeType: img.mimeType, data: img.data },
      })),
    ];

    // Instrução crítica sobre as referências — deve vir LOGO APÓS as imagens de referência
    if (referenceImages.length > 0) {
      contentParts.push({
        text: `⚠️ INSTRUÇÃO OBRIGATÓRIA SOBRE AS IMAGENS ACIMA:
As ${referenceImages.length} imagens acima são EXCLUSIVAMENTE referências de ESTILO VISUAL (composição, hierarquia tipográfica, paleta de cores, qualidade editorial, enquadramento).
NÃO USE, NÃO COPIE e NÃO REPRODUZA absolutamente nenhum elemento dessas imagens na arte gerada:
- PROIBIDO: copiar rostos, pessoas, identidade visual, logos ou elementos específicos
- PROIBIDO: usar como modelo ou base qualquer profissional de saúde visível nas fotos
- OBRIGATÓRIO: criar todos os elementos visuais (pessoas, cenários, objetos) de forma 100% original e sintética
As referências servem apenas para nortear qualidade, composição e estilo — nunca como conteúdo.`,
      });
    }

    // Foto profissional — para variação fotográfica individual e slides 1/5 da série foto do carrossel
    const isPhotoSlide = designStyle === 'fotografico'
      || designStyle === 'carrossel_foto_1'
      || designStyle === 'carrossel_foto_5';
    if (userPhotoUrl && isPhotoSlide) {
      try {
        let photoBase64: string | undefined;
        let photoMime = 'image/jpeg';

        const base64Match = userPhotoUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (base64Match) {
          photoMime = base64Match[1];
          photoBase64 = base64Match[2];
        } else {
          // URL do R2 (HTTPS) — baixa e converte para base64
          const res = await fetch(userPhotoUrl);
          if (res.ok) {
            const ct = res.headers.get('content-type');
            if (ct) photoMime = ct.split(';')[0];
            photoBase64 = Buffer.from(await res.arrayBuffer()).toString('base64');
          }
        }

        if (photoBase64) {
          contentParts.push({ inlineData: { mimeType: photoMime, data: photoBase64 } });
          contentParts.push({
            text: `⚠️ INSTRUÇÃO CRÍTICA — VARIAÇÃO FOTOGRÁFICA COM FOTO DO PROFISSIONAL:
A imagem imediatamente acima é a FOTO REAL DO PRÓPRIO PROFISSIONAL DE SAÚDE que assina este post.
OBRIGATÓRIO para esta variação:
- O PROFISSIONAL DA FOTO deve ser o SUJEITO PRINCIPAL e CENTRAL da arte
- Posicione a foto do profissional em destaque (pode ser: fundo full-bleed com a pessoa, elemento central da composição, ou foto integrada ao layout de forma editorial)
- Os textos (headline, subtítulo, identidade) devem ser sobrepostos de forma elegante sobre ou ao redor da foto
- PROIBIDO: ignorar a foto e gerar uma ilustração, gráfico ou imagem médica sem o profissional
- OBRIGATÓRIO: o profissional deve aparecer claramente na arte final`,
          });
          this.logger.log(`[${designStyle}] Foto do profissional carregada (${photoMime})`);
        }
      } catch (err: any) {
        this.logger.warn(`[${designStyle}] Falha ao carregar foto do profissional: ${err?.message}`);
      }
    }

    // Foto contextual (consultório, procedimento, etc.) — enviada para TODAS as variações
    if (contextPhotoUrl) {
      try {
        let ctxBase64: string | undefined;
        let ctxMime = 'image/jpeg';

        const ctxMatch = contextPhotoUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (ctxMatch) {
          ctxMime = ctxMatch[1];
          ctxBase64 = ctxMatch[2];
        } else {
          const res = await fetch(contextPhotoUrl);
          if (res.ok) {
            const ct = res.headers.get('content-type');
            if (ct) ctxMime = ct.split(';')[0];
            ctxBase64 = Buffer.from(await res.arrayBuffer()).toString('base64');
          }
        }

        if (ctxBase64) {
          contentParts.push({ inlineData: { mimeType: ctxMime, data: ctxBase64 } });
          contentParts.push({
            text: `⚠️ FOTO CONTEXTUAL DO PROFISSIONAL:
A imagem acima é uma foto enviada pelo profissional (pode ser consultório, procedimento, equipamento, etc.).
INCORPORE esta foto de forma natural na arte — pode ser como fundo, elemento visual de apoio ou composição editorial.
NÃO ignore esta foto. Ela deve aparecer na arte final de alguma forma.`,
          });
          this.logger.log(`[${designStyle}] Foto contextual carregada (${ctxMime})`);
        }
      } catch (err: any) {
        this.logger.warn(`[${designStyle}] Falha ao carregar foto contextual: ${err?.message}`);
      }
    }

    // Logo: NÃO enviar para a IA — será aplicada via overlay com Sharp no pós-processamento
    // Instrução para a IA deixar o canto limpo para o overlay
    if (brandKit.logoUrl || brandKit.logoWhiteUrl) {
      contentParts.push({
        text: `⚠️ LOGO: NÃO inclua logo, logotipo, marca d'água ou qualquer símbolo de marca na arte.
Deixe o canto superior esquerdo LIMPO e sem elementos visuais (sem texto, sem ícone).
A logo será adicionada automaticamente em pós-processamento.`,
      });
    }

    contentParts.push({ text: prompt });

    const models = [
      process.env.GOOGLE_IMAGE_MODEL || 'nano-banana-pro-preview',
      'gemini-2.5-flash-image',
    ];

    for (const model of models) {
      try {
        this.logger.log(`Gerando imagem com modelo: ${model} (${referenceImages.length} refs)`);
        const response = await this.gemini.models.generateContent({
          model,
          contents: { role: 'user', parts: contentParts },
          config: {
            responseModalities: [Modality.IMAGE],
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData?.data);

        if (imagePart?.inlineData?.data) {
          this.logger.log(`Imagem gerada com sucesso via ${model}`);
          return {
            base64: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType || 'image/jpeg',
          };
        }

        this.logger.warn(`${model} retornou resposta sem imagem, tentando próximo modelo...`);
      } catch (err: any) {
        this.logger.warn(`${model} falhou: ${err.message} — tentando próximo modelo...`);
      }
    }

    throw new Error('Nenhum modelo conseguiu gerar a imagem');
  }

  async generateProfessionalPhoto(params: {
    referencePhotoBase64s: { data: string; mimeType: string }[];
    stylePrompt: string;
    profession: Profession;
  }): Promise<{ base64: string; mimeType: string }> {
    const { referencePhotoBase64s, stylePrompt, profession } = params;

    const professionLabel: Record<string, string> = {
      MEDICO: 'médico(a)',
      NUTRICIONISTA: 'nutricionista',
      PSICOLOGO: 'psicólogo(a)',
      ENFERMEIRO: 'enfermeiro(a)',
      DENTISTA: 'dentista',
      FARMACEUTICO: 'farmacêutico(a)',
      OUTRO: 'profissional de saúde',
    };

    const contentParts: any[] = [];

    // Enviar todas as fotos de referência
    for (const photo of referencePhotoBase64s) {
      contentParts.push({ inlineData: { mimeType: photo.mimeType, data: photo.data } });
    }

    contentParts.push({
      text: `TAREFA: Gerar uma foto profissional de alta qualidade de um(a) ${professionLabel[profession] || 'profissional de saúde'}.

IDENTIDADE VISUAL — PRESERVAÇÃO OBRIGATÓRIA:
As ${referencePhotoBase64s.length} imagens acima mostram a MESMA PESSOA real que você deve fotografar.
Analise cuidadosamente e preserve EXATAMENTE:
- Formato e estrutura do rosto (formato do queixo, maçãs do rosto, testa)
- Cor e tom de pele
- Cor, textura e estilo do cabelo
- Sobrancelhas, olhos e cor dos olhos
- Nariz e boca
- Barba/bigode (se houver) — preservar o mesmo estilo e espessura
- Acessórios marcantes (brincos, óculos, piercings, etc.) — preservar exatamente
Esta pessoa DEVE ser reconhecível na foto gerada. Não substitua por uma pessoa genérica.

EXPRESSÃO FACIAL — REGRA CRÍTICA:
Analise as fotos de referência e identifique o padrão de expressão natural desta pessoa.
- Se as fotos de referência NÃO mostram sorriso com dentes expostos: NUNCA gere sorriso com dentes. Use sorriso fechado suave ou expressão neutra e confiante.
- Se as fotos mostram sorriso com dentes: pode reproduzir o mesmo sorriso.
- PROIBIDO: inventar ou exagerar expressões que não aparecem nas referências.

CENÁRIO DESEJADO:
${stylePrompt}

REQUISITOS TÉCNICOS:
- Foto realista, fotográfica, de alta qualidade (não ilustração, não cartoon)
- Iluminação profissional, nítida
- Proporção retrato (3:4 ou 4:5)
- Roupa profissional adequada à especialidade
- Fundo desfocado (bokeh) para destacar a pessoa`,
    });

    const models = [
      process.env.GOOGLE_IMAGE_MODEL || 'nano-banana-pro-preview',
      'gemini-2.5-flash-image',
    ];

    for (const model of models) {
      try {
        this.logger.log(`[foto-pro] Gerando com ${model} (${referencePhotoBase64s.length} referências)...`);
        const response = await this.gemini.models.generateContent({
          model,
          contents: { role: 'user', parts: contentParts },
          config: {
            responseModalities: [Modality.IMAGE],
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData?.data);

        if (imagePart?.inlineData?.data) {
          this.logger.log(`[foto-pro] Imagem gerada com sucesso via ${model}`);
          return {
            base64: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType || 'image/jpeg',
          };
        }

        this.logger.warn(`[foto-pro] ${model} retornou sem imagem, tentando próximo...`);
      } catch (err: any) {
        this.logger.warn(`[foto-pro] ${model} falhou: ${err.message}`);
      }
    }

    throw new Error('Nenhum modelo conseguiu gerar a foto profissional');
  }
}
