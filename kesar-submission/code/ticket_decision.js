// Node: Ticket Decision (Code, Run Once for All Items) - runs after "Get Tickets"
// Creates a new ticket, or updates the open ticket for the same order ID (no duplicates).
let d;
try { d = $('Finalize').first().json; } catch (e) { d = $('Decide').first().json; }

const blank = { ticket_id:'', created_at:'', updated_at:'', order_id:'', customer_email:'', email_ids:'', intent:'', priority:'', status:'', summary:'', notes:'' };

if (!d.ticket_needed || !d.order_for_agent) return [{ json: blank }];

const rows = $input.all().map(i => i.json).filter(r => r.ticket_id);
const orderId = d.order_for_agent.order_id;
const now = new Date().toISOString();
const rank = { Low: 1, Medium: 2, High: 3 };

const open = rows.find(r =>
  String(r.order_id).trim() === orderId &&
  String(r.status).trim().toLowerCase() !== 'closed');

if (open) {
  const ids = String(open.email_ids || '').split(',').map(s => s.trim()).filter(Boolean);
  const isNew = !ids.includes(d.email_id);
  if (isNew) ids.push(d.email_id);
  const priority = (rank[d.priority] || 0) > (rank[open.priority] || 0) ? d.priority : open.priority;
  const notes = isNew
    ? String(open.notes || '') + `\n${now}: new email ${d.email_id} (${d.intent}) - ${d.summary}`
    : String(open.notes || '');
  return [{ json: {
    ticket_id: open.ticket_id,
    created_at: open.created_at,
    updated_at: now,
    order_id: orderId,
    customer_email: open.customer_email,
    email_ids: ids.join(', '),
    intent: open.intent,
    priority,
    status: open.status,
    summary: open.summary,
    notes,
  } }];
}

const maxNum = rows.reduce((m, r) => {
  const n = parseInt(String(r.ticket_id).replace(/\D/g, ''), 10);
  return isNaN(n) ? m : Math.max(m, n);
}, 0);

return [{ json: {
  ticket_id: 'T-' + String(maxNum + 1).padStart(4, '0'),
  created_at: now,
  updated_at: now,
  order_id: orderId,
  customer_email: d.from_email,
  email_ids: d.email_id,
  intent: d.intent,
  priority: d.priority,
  status: 'Open',
  summary: d.summary,
  notes: `Created from ${d.email_id}. ${d.return_note || ''} Reasons: ${(d.human_reasons || []).join(', ') || 'none'}`.trim(),
} }];
