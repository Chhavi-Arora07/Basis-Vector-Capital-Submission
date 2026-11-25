// Node: Build Audit Row (Code, Run Once for All Items) - one row per email for the Audit Log tab
let d;
try { d = $('Finalize').first().json; } catch (e) { d = $('Decide').first().json; }
const t = $('Ticket Decision').first().json;

let action = 'logged_only';
if (d.use_agent) action = 'agent_draft';
else if (d.holding_reply) action = 'holding_reply';
if (d.ownership_mismatch) action = 'privacy_block';

return [{
  json: {
    email_id: d.email_id,
    received_at: d.received_at,
    from_email: d.from_email,
    intent: d.intent,
    secondary_intent: d.secondary_intent ?? '',
    order_id: d.order_id ?? '',
    language: d.language,
    sentiment: d.sentiment,
    confidence: d.confidence,
    order_found: d.order_found,
    action_taken: action,
    needs_human: d.needs_human,
    ticket_id: t.ticket_id || '',
    reply_draft: d.final_reply ?? d.holding_reply ?? '',
    prompt_version: 'v2',
    processed_at: new Date().toISOString(),
    error: d.classification_error ?? '',
    notes: `mode=${d.mode}; ${d.summary}; reasons: ${(d.human_reasons || []).join(', ') || 'none'}; ${d.return_note || ''}`,
    cls_input_tokens: d.cls_input_tokens,
    cls_output_tokens: d.cls_output_tokens,
  }
}];
