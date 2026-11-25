// Node: Finalize (Code, Run Once for All Items) - output guardrails after the AI agent
const d = $('Decide').first().json;
const out = String($input.first().json.output || '').trim();

let reply = out;
const reasons = [...(d.human_reasons || [])];
let needsHuman = d.needs_human;

if (!out || out.includes('[[NEEDS_HUMAN]]')) {
  reply = d.holding_reply || "Thank you for writing to Kesar & Co. A member of our team will get back to you within 24 business hours (Mon-Sat, 10:00-19:00 IST).";
  needsHuman = true;
  reasons.push('agent could not answer from FAQ/order data');
}
if (/\bapproved\b/i.test(reply)) { needsHuman = true; reasons.push('draft contains the word "approved"'); }
if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(reply)) { reply = reply.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ''); }

return [{ json: { ...d, final_reply: reply, needs_human: needsHuman, human_reasons: reasons } }];
