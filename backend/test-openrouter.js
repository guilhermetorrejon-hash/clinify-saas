require('dotenv').config();
const OpenAI = require('openai').default;

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

console.log('Modelo:', process.env.OPENROUTER_TEXT_MODEL || 'anthropic/claude-sonnet-4-6');

client.chat.completions.create({
  model: process.env.OPENROUTER_TEXT_MODEL || 'anthropic/claude-sonnet-4-6',
  max_tokens: 800,
  messages: [
    { role: 'system', content: 'Você é copywriter de saúde.' },
    { role: 'user', content: 'Gere headline, subtitle e caption para um post educativo sobre hidratação. Retorne JSON: {"headline":"","subtitle":"","caption":""}' }
  ]
})
  .then(r => console.log('OK:', r.choices[0].message.content))
  .catch(e => console.error('ERRO:', e.status, e.message, JSON.stringify(e.error)));
