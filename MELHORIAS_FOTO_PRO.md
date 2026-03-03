# Melhorias: Foto Pro — Diversidade de Looks e Contextos

## 📋 Problema Identificado

1. **Estetoscópio cliche**: Médicos SEMPRE apareciam com estetoscópio em TODAS as 10 fotos
   - Feedback: "ficou muito cliche para medicos"
   - Solução: manter estetoscópio, mas em poucas fotos (1-2)

2. **Sem roupa social**: Apenas jaleco/uniforme
   - Feedback: "Talvez ter também uma versão de roupa social"
   - Solução: adicionar camisa social (homens) e blazer (mulheres)

3. **Profissões diferentes precisam de looks diferentes**
   - Psicólogos: sem equipamento médico ✅ (já estava correto)
   - Nutricionistas: diversidade de looks profissionais
   - Dentistas, Farmacêuticos: idem

## ✅ Soluções Implementadas

### 1. Estetoscópio Reduzido para Médicos

**Antes:**
```javascript
MEDICO: 'vestindo jaleco branco profissional com estetoscópio'
// Aplicado em TODOS os 10 prompts → estetoscópio em todas as fotos
```

**Depois:**
```javascript
MEDICO: [
  'vestindo jaleco branco profissional com estetoscópio',           // Apenas 1-2 fotos
  'vestindo jaleco branco limpo e profissional',                    // Jaleco sem estetoscópio
  'vestindo camisa social ou blazer profissional elegante',         // NOVO: Roupa social
  'em roupa social clean (camisa social lisa ou blazer)',           // NOVO: Roupa social
  'vestindo roupa smart-casual profissional sem equipamento médico', // NOVO: Casual profissional
]
```

**Resultado:** Variação visual natural entre fotos de médico:
- 1 com estetoscópio (clássica)
- 1 com jaleco sem estetoscópio (profissional clean)
- 3 com roupa social (camisa/blazer)

### 2. Roupa Social para Todos os Profissionais

Agora todas as profissões têm opções de roupa social/blazer:

**NUTRICIONISTA:**
- jaleco clean
- roupa social (sem jaleco)
- roupa profissional clean moderna

**PSICOLOGO:**
- blazer ou camisa social (mais formal agora)
- roupa clean acolhedora
- blazer elegante (variação)

**ENFERMEIRO:**
- uniforme de enfermagem/jaleco
- roupa profissional clean (sem uniforme)
- smart-casual profissional

**DENTISTA:**
- jaleco odontológico
- roupa social/blazer
- roupa clean profissional

**FARMACEUTICO:**
- jaleco de farmácia
- roupa social (sem jaleco)
- roupa professional

### 3. Distribuição Inteligente nos 10 Prompts

Os 10 prompts agora usam **rotação de looks**:

**Estúdio (3 fotos):**
- Foto 1: Look 1 (jaleco/uniforme ou estetoscópio)
- Foto 2: Look 2 (jaleco sem estetoscópio ou alternativo)
- Foto 3: Look 3 (roupa social/blazer)

**Ambiente profissional (4 fotos):**
- Usa rotação: Look 1, Look 2, Look 3, Look 4
- Garante variedade de roupas entre ambientes

**Enquadramento/Exterior (3 fotos):**
- Prioriza looks mais formais: roupa social/blazer
- Um com look mais casual-profissional

## 📊 Exemplo de Resultado — Médico

### ANTES (10 estetoscópios):
```
1. Foto estúdio — jaleco com estetoscópio, fundo cinza
2. Foto estúdio — jaleco com estetoscópio, fundo branco
3. Foto estúdio — jaleco com estetoscópio, fundo cinza gradiente
4. Consultório — jaleco com estetoscópio, consultório ao fundo
5. Consultório — jaleco com estetoscópio, braços cruzados
6. Consultório — jaleco com estetoscópio, sentado em mesa
7. Consultório — jaleco com estetoscópio, retrato 3/4
8. Close-up — jaleco com estetoscópio, fundo cinza
9. Exterior — jaleco com estetoscópio, parque ao fundo
10. Parede branca — jaleco com estetoscópio, braços cruzados
```

### DEPOIS (Diversificado):
```
1. Foto estúdio — jaleco com estetoscópio, fundo cinza ✅
2. Foto estúdio — jaleco LIMPO, fundo branco ✅
3. Foto estúdio — CAMISA SOCIAL, fundo cinza gradiente ✅ NOVO
4. Consultório — jaleco com estetoscópio, consultório ao fundo ✅
5. Consultório — CAMISA SOCIAL, braços cruzados ✅ NOVO
6. Consultório — jaleco limpo, sentado em mesa ✅
7. Consultório — ROUPA SMART-CASUAL, retrato 3/4 ✅ NOVO
8. Close-up — BLAZER/CAMISA SOCIAL, fundo cinza ✅ NOVO
9. Exterior — CAMISA SOCIAL, parque ao fundo ✅ NOVO
10. Parede branca — ROUPA CLEAN, braços cruzados ✅
```

**Resultado:** Profissional parece ter variedade de contextos e roupas, não só médico com estetoscópio em tudo.

## 🔧 Mudanças Técnicas

### Arquivo Modificado
- **Arquivo**: `backend/src/queues/photo-generation.processor.ts`
- **Função**: `getStylePrompts(profession: Profession): string[]`

### Antes → Depois

**Antes:**
- Objeto simples: `outfit: Record<string, string>`
- Cada profissão tinha UMA string de roupa
- Aplicada em TODOS os prompts

**Depois:**
- Array de variações: `outfitVariations: Record<string, string[]>`
- Cada profissão tem 3-5 opções de roupa
- Prompts selecionam diferentes índices: `outfitOptions[0]`, `outfitOptions[1]`, etc.

### Exemplo de Código

```typescript
const outfitVariations: Record<string, string[]> = {
  MEDICO: [
    'vestindo jaleco branco profissional com estetoscópio',      // [0]
    'vestindo jaleco branco limpo e profissional',                // [1]
    'vestindo camisa social ou blazer profissional elegante',    // [2]
    'em roupa social clean (camisa social lisa ou blazer)',      // [3]
    'vestindo roupa smart-casual profissional sem equipamento', // [4]
  ],
  // ... outras profissões
};

// Prompts usam índices diferentes:
`FOTO DE ESTÚDIO. ${outfitOptions[0]}, ...`  // Usa primeira opção
`...${outfitOptions[2]}, ...`                // Usa terceira opção (roupa social)
```

## 📝 Contextos por Profissão

### MÉDICO
- ✅ Estetoscópio: Apenas 1-2 fotos
- ✅ Jaleco clean: 2-3 fotos
- ✅ Camisa social/blazer: 3-4 fotos
- ✅ Consultório ao fundo: Contextualizado

### PSICÓLOGO
- ✅ Sem equipamento médico
- ✅ Blazer/camisa social: Todas as fotos
- ✅ Escritório acolhedor: Contextualizado

### NUTRICIONISTA / DENTISTA / FARMACÊUTICO
- ✅ Mix: jaleco (1-2), roupa social (2-3), clean profissional (2-3)
- ✅ Ambientes contextualizados

## 🧪 Como Testar

1. Acesse `/fotos` (Foto Pro)
2. Faça upload de 3+ fotos sua profissão
3. Clique em "Gerar fotos com IA"
4. Espere a geração (máx 5 min)
5. Veja as 10 fotos geradas
6. **Verifique:**
   - ✅ Variedade de roupas (não tudo igual)
   - ✅ Médico: estetoscópio em poucas fotos, não em todas
   - ✅ Psicólogo: sem equipamento médico
   - ✅ Mix de profissional (jaleco + social + casual-profissional)

## 📌 Resumo das Mudanças

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Médico com estetoscópio** | 10/10 fotos | 1-2/10 fotos ✅ |
| **Roupa social** | Não existe | Sim, em 3-4 fotos ✅ |
| **Psicólogo** | Sem equipamento ✅ | Continua sem ✅ |
| **Diversidade visual** | Baixa (tudo igual) | Alta (múltiplas roupas) ✅ |
| **Contextos profissionais** | Básicos | Contextualizados por profissão ✅ |

## 🚀 Próximas Melhorias (Futuro)

- Adicionar acessórios variados (óculos, relógio) para profissionais
- Opção de gênero para referências de roupa (femino/masculino mais específico)
- Backgrounds customizáveis por preferência do profissional
