// Node: get_order (Code Tool attached to the AI Agent)
// Description for the agent: "Returns the verified order for this customer as JSON, or says none is available. Call this for any order question."
const o = $('Decide').first().json.order_for_agent;
return o ? JSON.stringify(o) : 'No verified order available for this customer.';
