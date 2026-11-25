// Node: Decide (Code, Run Once for All Items)
// Code makes the decisions: order lookup, ownership check, return window, priority, tickets, needs-human.
const d = $('Parse Classification').first().json;

// ---- Collect orders however Get Orders delivered them ----
let orders = [];
for (const item of $('Get Orders').all()) {
  const j = item.json;
  if (Array.isArray(j.orders)) orders.push(...j.orders);
  else if (j.order_id) orders.push(j);
  else if (typeof j.data === 'string') {
    try { orders.push(...(JSON.parse(j.data).orders || [])); } catch (e) {}
  }
}

const sender = (d.from_email || '').toLowerCase().trim();
const text = ((d.subject || '') + ' ' + (d.body || '')).toLowerCase();
const firstName = (d.from_name || '').split(' ')[0];

// ---- Order lookup: by order ID, else (only if no ID given) by sender email ----
const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
let order = null;
let lookupBy = 'none';
if (d.order_id) {
  order = orders.find(o => norm(o.order_id) === norm(d.order_id)) || null;
  if (order) lookupBy = 'order_id';
} else {
  const mine = orders.filter(o => o.customer_email.toLowerCase().trim() === sender);
  if (mine.length) {
    mine.sort((a, b) => b.order_date.localeCompare(a.order_date));
    order = mine[0];
    lookupBy = 'sender_email';
  }
}

const orderFound = !!order;
// ---- Ownership check: sender must match the order's customer ----
const verified = orderFound && order.customer_email.toLowerCase().trim() === sender;
const ownershipMismatch = orderFound && !verified;

// ---- Return eligibility (code decides, not the model) ----
const dayOf = s => Date.parse(String(s).slice(0, 10));
let daysSinceDelivery = null;
let returnEligible = null;
let returnNote = '';
if (verified && order.status === 'delivered' && order.delivered_date) {
  daysSinceDelivery = Math.round((dayOf(d.received_at) - dayOf(order.delivered_date)) / 86400000);
  returnEligible = daysSinceDelivery <= 7;
  returnNote = `Delivered ${order.delivered_date}, ${daysSinceDelivery} day(s) before this email; window is 7 days.`;
} else if (verified && order.status !== 'delivered') {
  returnNote = `Order status is "${order.status}", not delivered, so the return window has not started.`;
}

// ---- Flags from the email text (first version, not tuned on all 25 emails) ----
const openedUsed = /\b(opened|used|applied|tried|didn'?t suit|did not suit|no results|didn'?t see results|broken seal)\b/.test(text);
const damageClaim = /\b(damaged|leak|leaking|broken|wrong item|wrong product|missing|not received the|spilled|crushed)\b/.test(text);
const medicalFlag = /\b(rash|itch|itching|burn|burning|allerg|eczema|psoriasis|swelling|reaction|pregnan|dermatolog|doctor|acne)\b/.test(text);

if (returnEligible === true && openedUsed) {
  returnEligible = false;
  returnNote += ' Customer indicates the product was opened or used, which the FAQ does not accept.';
}

// ---- Priority and tickets ----
const intents = [d.intent, d.secondary_intent];
const wantsTicket = intents.includes('return_refund') || intents.includes('complaint');
let priority = 'Low';
if (wantsTicket) priority = 'Medium';
if (intents.includes('complaint') || damageClaim || d.sentiment === 'angry' || medicalFlag) priority = 'High';

// ---- Needs-human reasons ----
const reasons = [];
if (!d.classification_valid) reasons.push('classification invalid or failed');
if (d.confidence < 0.75) reasons.push('low confidence (<0.75)');
if (d.suspicious_instructions) reasons.push('email contains instructions aimed at the system');
if (ownershipMismatch) reasons.push('sender does not match order owner');
if (intents.some(i => ['order_status','return_refund','complaint'].includes(i)) && !orderFound && d.intent !== 'other') reasons.push('order not found');
if (damageClaim) reasons.push('damaged/wrong/missing item claim needs verification');
if (medicalFlag) reasons.push('skin condition or reaction mentioned');
if (d.sentiment === 'angry') reasons.push('angry customer');
if (intents.includes('complaint')) reasons.push('complaint');
if (intents.includes('return_refund') && returnEligible !== true) reasons.push('return not clearly eligible');
const needsHuman = reasons.length > 0;

// ---- Mode ----
let mode = 'approve_draft';
if (needsHuman) mode = 'human_review';
else if (d.confidence >= 0.90) mode = 'auto_send_candidate';

// ---- Does the AI agent draft a reply? ----
const useAgent = d.classification_valid && !d.suspicious_instructions && !ownershipMismatch && d.intent !== 'other' &&
  (verified || d.intent === 'product_query');

// ---- Fixed replies for cases the agent must not handle ----
let holdingReply = '';
if (ownershipMismatch) {
  holdingReply = "Hi " + firstName + ",\n\nThank you for writing to us. To protect our customers' privacy, we can only share order details with the email address used to place the order. Could you write to us from that address, or share your order details there? We'll be glad to help from there.\n\nWarm regards,\nTeam Kesar";
} else if (!useAgent && d.intent !== 'other') {
  holdingReply = "Hi " + firstName + ",\n\nThank you for reaching out. We've received your message, and a member of our team will follow up with you within 24 business hours (Mon-Sat, 10:00-19:00 IST).\n\nWarm regards,\nTeam Kesar";
}

// Only the verified order is ever passed on
const orderForAgent = verified ? order : null;

return [{
  json: {
    ...d,
    orders_loaded: orders.length,
    order_found: orderFound,
    lookup_by: lookupBy,
    order_verified: verified,
    ownership_mismatch: ownershipMismatch,
    order_for_agent: orderForAgent,
    days_since_delivery: daysSinceDelivery,
    return_eligible: returnEligible,
    return_note: returnNote,
    damage_claim: damageClaim,
    medical_flag: medicalFlag,
    priority,
    ticket_needed: wantsTicket && verified,
    needs_human: needsHuman,
    human_reasons: reasons,
    mode,
    use_agent: useAgent,
    holding_reply: holdingReply,
  }
}];
