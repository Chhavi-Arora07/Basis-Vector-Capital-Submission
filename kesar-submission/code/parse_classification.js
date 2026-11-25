// Node: Parse Classification (Code, Run Once for All Items)
// Validates the model output against the repo schema; falls back to "other" + needs human if invalid.
const email = $('Normalize').first().json;
const res = $input.first().json;

const INTENTS = ['order_status','product_query','return_refund','complaint','other'];
const SENTIMENTS = ['positive','neutral','negative','angry'];
const LANGS = ['en','hi','hinglish'];

let parsed = null;
let error = null;

try {
  if (res.error) throw new Error('Classify call failed: ' + (res.error.message || JSON.stringify(res.error)));
  const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty model response');
  parsed = JSON.parse(text);

  if (!INTENTS.includes(parsed.intent)) throw new Error('Invalid intent');
  if (!(parsed.secondary_intent === null || INTENTS.includes(parsed.secondary_intent))) throw new Error('Invalid secondary_intent');
  if (!SENTIMENTS.includes(parsed.sentiment)) throw new Error('Invalid sentiment');
  if (!LANGS.includes(parsed.language)) throw new Error('Invalid language');
  if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) throw new Error('Invalid confidence');
  if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) throw new Error('Invalid summary');

  parsed.summary = parsed.summary.trim().slice(0, 200);
} catch (e) {
  error = e.message;
  parsed = {
    intent: 'other',
    secondary_intent: null,
    order_id: null,
    sentiment: 'neutral',
    language: 'en',
    confidence: 0,
    summary: 'Classification failed or invalid - needs human review.',
  };
}

// Order ID comes from the email text itself (never from the model's guess)
const idMatch = (email.subject + ' ' + email.body).toUpperCase().match(/KC[^A-Z0-9]{0,2}([0-9]{4})/);
const orderId = idMatch ? 'KC-' + idMatch[1] : null;

return [{
  json: {
    ...email,
    ...parsed,
    order_id: orderId,
    suspicious_instructions: parsed.suspicious_instructions === true,
    classification_valid: error === null,
    classification_error: error,
    cls_input_tokens: res.usageMetadata?.promptTokenCount ?? 0,
    cls_output_tokens: res.usageMetadata?.candidatesTokenCount ?? 0,
  }
}];
