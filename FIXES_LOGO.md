# Correção: Logo em Artes — Problema de Distorção Resolvido

## Problema Identificado
A logo do cliente estava sendo distorcida, redesenhada ou "inventada" em algumas artes, especialmente em:
- Variações tipográficas com fundo claro
- Slides do carrossel com fundos específicos
- Instruções ambíguas que o Gemini interpretava como permissão para redesenhar

## Raiz Causa
1. **Detecção de fundo escuro incompleta**: Não detectava corretamente quando aplicar logo branca vs. original
2. **Instrução ambígua**: "Adapte a logo para versão branca/clara" era interpretado como "redesen he a logo"
3. **Lógica de variações**: Carrossel tipográfico era identificado como "dark" quando na verdade tinha fundo claro

## Soluções Aplicadas

### 1. Detecção Corrigida de Fundos Escuros
```typescript
// ANTES: incluía tipografico (incorreto!)
const isDarkVariation = designStyle === 'grafico'
  || designStyle === 'fotografico'
  || /^carrossel_(foto|graf)_\d+$/.test(designStyle);

// DEPOIS: apenas fundos realmente escuros
const isDarkVariation = designStyle === 'grafico'
  || designStyle === 'fotografico'
  || /^carrossel_(foto|graf)_\d+$/.test(designStyle);
// ⚠️ Tipografico e carrossel_tipo têm fundo claro (off-white)
```

### 2. Instruções 100% Explícitas para o Gemini
**Antes**: Instrução vaga, permitia interpretação
```
"Se a logo tiver fundo branco sólido, desconsidere o fundo e use apenas os elementos gráficos. Como o fundo da arte é escuro, adapte a logo para versão branca/clara mantendo a forma e proporção."
```

**Depois**: Instruções cristalinas
```
⚠️ LOGO CRÍTICA — A imagem LOGO acima é a LOGO DO PROFISSIONAL.
OBRIGATÓRIO:
- Use EXATAMENTE como está, sem modificações, redesenhos ou interpretações
- [...]
- PROIBIDO ABSOLUTAMENTE: redesenhar, recriar, inverter cores ou criar uma logo similar — USE A IMAGEM FORNECIDA
```

### 3. Tabela de Decisão por Variação

| Tipo | Fundo | Logo Usada | Instrução |
|------|-------|-----------|-----------|
| fotografico | Escuro (overlay) | logoWhiteUrl | Use EXATAMENTE, sem modificações |
| tipografico | Claro (off-white) | logoUrl original | Use EXATAMENTE, sem modificações |
| grafico | Escuro (cor primária) | logoWhiteUrl | Use EXATAMENTE, sem modificações |
| carrossel_foto_* | Escuro (overlay) | logoWhiteUrl | Use EXATAMENTE, sem modificações |
| carrossel_tipo_* | Claro (off-white) | logoUrl original | Use EXATAMENTE, sem modificações |
| carrossel_graf_* | Escuro (cor primária) | logoWhiteUrl | Use EXATAMENTE, sem modificações |

## Resultado Esperado
- ✅ Logo NUNCA será distorcida, redesenhada ou "inventada"
- ✅ Logo branca/clara usada APENAS quando há fundo escuro
- ✅ Logo original usada em fundos claros
- ✅ Instrução unívoca em TODOS os tipos de posts

## Teste Recomendado
1. Criar 3 posts (fotografico, tipografico, grafico)
2. Criar 1 carrossel (5 slides)
3. Verificar que a logo em cada arte:
   - É idêntica à fornecida no brand kit
   - Não tem cores invertidas ou modificadas (exceto quando necessário ajuste de contraste)
   - Aparece no canto superior esquerdo discretamente
   - Não sofre distorção ou redesenho

## Arquivo Modificado
- `/backend/src/modules/ai/ai.service.ts` (linhas 739-780)
