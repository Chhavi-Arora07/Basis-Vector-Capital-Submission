# Kesar & Co. Support Copilot — [YOUR NAME]


## 1. Summary

- **What I built:** A support copilot in n8n. It receives each customer email through a webhook, classifies it with an LLM (JSON matching `schemas/llm_output.schema.json`), looks up the order, and either drafts a reply with an AI agent or sends the case to a person. Return/refund and complaint emails get a ticket, and every email is logged to a Google Sheet audit log.
- **Platform and LLM:** n8n Cloud; Google Gemini via API. Classification model: **gemini-3.1-flash-lite**. Agent model: **gemini-3.1-flash-lite**.
- **Time spent (approx. hours):** **12 hours**
- **What works / what doesn't:** **While I have not been able to run all 25 cases together, the model that I have build provides excellent results for the one query at a time.**
  - Verified by hand during the build: email E01 runs end to end (classified, order found and verified, reply drafted, row logged). **Similarly, runs for E07 AND E04 has also been successfull**
- **Google Sheet (view access):** **(https://docs.google.com/spreadsheets/d/1ihgxKQsnQ58qavP0WBrmVzsXyWuw5iVNUOdoA2uziB8/edit?usp=sharing)**
- **Screen recording:** **(https://drive.google.com/file/d/1fP0OChymDdEZN12Dc0qzd1mKHd2YxQ7E/view?usp=sharing)**

## 2. Architecture

Core design: **the LLM only extracts facts and writes wording. Code makes the decisions** (order lookup, ownership check, return eligibility, priority, tickets, needs-human). The readable source of every Code node is in `code/`. The workflow export goes in `workflow/` (see `workflow/README.md`).

| Step / node | What it does | Why I designed it this way |
|---|---|---|
| Webhook | Receives one email (POST) and answers immediately | Works with `scripts/send_test_emails.py`; no timeout while the LLM runs |
| Normalize (code) | Cleans the email and builds the Gemini request | The email is wrapped in tags and treated as data, not instructions |
| Classify (HTTP, Gemini) | Returns JSON through a response schema, temperature 0, retries on failure | Schema-enforced output; also gives token counts |
| Parse Classification (code) | Validates every field against the repo schema; falls back to `other` + needs human if invalid; takes the order ID from the email text by pattern, never from a guess | The brief requires valid output every time and forbids guessing order IDs |
| Get Orders (HTTP) | Fetches `orders.json` (the "order API") | Matches the setup guide |
| Decide (code) | Order lookup (ID, else sender email only when no ID is given), **ownership check**, 7-day return window from the email's `received_at`, opened/used check, priority, ticket yes/no, needs-human reasons, whether the agent drafts | Policy and privacy rules cannot be talked out of by an email |
| Use Agent? (If) | Sends cases with a verified order, or a product question, to the agent; everything else gets a fixed reply | The agent never sees an order it may not share |
| AI Agent + Gemini Chat Model + tools `get_order`, `search_faq` | Drafts the reply in brand voice | `get_order` returns only the order that the ownership check already verified; `search_faq` returns `faq.md` |
| Finalize (code) | Output guardrails: `[[NEEDS_HUMAN]]` marker, the word "approved", emoji, empty agent output | A second check after the model, in code |
| Get Tickets → Ticket Decision (code) → Has ticket? | Creates a ticket, or updates the open one for the same order ID | No duplicate tickets |
| Append or Update Ticket (Sheets) | Writes the **Tickets** tab, matching on `ticket_id` | Simple ticketing system |
| Build Audit Row (code) → Append row in sheet | One row per email, including the draft, `needs_human`, ticket ID and classification tokens | Every decision is traceable |


## 3. Setup — how someone else can run this

1. **Accounts and credentials needed (no actual keys here):** n8n (Cloud trial or self-hosted); a Google Gemini API key from Google AI Studio; a Google account for Google Sheets.
2. **Import the workflow:** n8n → Workflows → Import from file → `workflow/support_copilot_v2.json` ****.
3. **Credentials in n8n:**
   - **Header Auth** with header name `x-goog-api-key` and your Gemini key, used by the *Classify* node.
   - **Google Gemini(PaLM) API** with the same key, used by the *Gemini Chat Model* node.
   - **Google Sheets OAuth2**, used by all Google Sheets nodes.
   - Then select your Sheet in each Google Sheets node.
4. **Create the Google Sheet** with tabs **Audit Log** and **Tickets** from the CSV templates in `templates/`. Add the columns `cls_input_tokens` and `cls_output_tokens` to the audit tab. 
5. **Run the test emails:** publish the workflow, then `python scripts/send_test_emails.py --url <PRODUCTION_WEBHOOK_URL> --delay 10`. Use `--only E01,E07` for a subset.

## 4. Prompts

Final prompts are in `prompts/`:

- `classification_prompt.md` (v2): the system instruction used in the *Normalize* node
- `agent_system_prompt.md` (v2): the agent's system message


Model settings: classification at temperature 0 with a JSON response schema; the agent at temperature 0.3. 

## 5. Key decisions and assumptions

- **Low-confidence handling:** below 0.75 always goes to a human. A case becomes an auto-send candidate only at 0.90 or above with no risk flags. In between, it is a draft for one-click approval. The `notes` column shows the mode for each email. Nothing is actually sent; replies are drafts.
- **No duplicate tickets:** before creating a ticket, *Ticket Decision* looks for a non-closed ticket with the same order ID. If there is one, it adds the new email ID and a note instead.
- **Order details only to the right customer:** *Decide* compares the sender's email with the order's `customer_email`. On a mismatch, no order data goes to the agent and a fixed privacy reply is used. The `get_order` tool can only return the order that this check already verified.
- **FAQ grounding:** the agent answers only from `search_faq`, the `get_order` result and the case facts. If it can't, it outputs `[[NEEDS_HUMAN]]` and code marks the email as needs human. The 7-day return window is computed in code from the email's `received_at`, not by the model.
- **Prompt injection:** the email is passed as tagged data, the classifier flags instructions aimed at the system (`suspicious_instructions`), and flagged emails go to a human without an agent draft.
- **Other assumptions:** today is 20 Nov 2026; damaged, wrong or missing items are treated as high priority and always need a human; keyword lists for damage, medical and opened/used mentions are a first version and **have not been tuned against all 25 emails**.

## 6. Scaling to 1,000 emails/day

1. Free-tier LLM rate limits and "model overloaded" (503) errors, which I hit while building. Change: a queue plus retries with backoff.
2. Duplicate tickets when two emails for the same order arrive at the same moment. Change: a lock or a unique check on order ID.
3. Google Sheets as a database. Change: a real database for orders, tickets and the audit log.

## 7. Product-thinking questions

1. **Auto-send vs. draft:** I'd auto-send only low-risk replies: order status for a verified customer (sender email matches the order), product and policy answers taken straight from the FAQ, and return instructions for clearly eligible returns (within 7 days, sealed). Anything that needs a decision stays with a person: refund or replacement approval, damaged, wrong or missing items, angry customers, skin reactions, and anything the FAQ doesn't cover. Threshold: below 0.75 confidence always goes to a human. Auto-send needs 0.90 or above and a safe category. In between, the copilot writes a draft for one-click approval. A wrong auto-sent refund promise costs far more than ten seconds of a person approving a draft, so I'd start strict and loosen with data.

2. **Cost:** Assumptions: classification call = 800 input + 100 output tokens. Agent call = 2,000 input (instructions, order, FAQ) + 200 output tokens. About 70% of emails reach the agent. Prices: **[REPLACE with your model's published rates per 1M input and output tokens, and cite the pricing page]**. With P_in and P_out as the prices per token:
   - Classification: 800 × P_in + 100 × P_out
   - Agent: (2,000 × P_in + 200 × P_out) × 0.7
   - Per email = sum of the two; per day = × 1,000; per month = × 30

   **[WORK OUT the numbers with the real rates and show them here.]** Tool calls add input tokens, so real cost may be somewhat higher. The audit log records classification tokens per email so this can be checked against reality.

3. **Success metric:** In week 1 I'd track one thing: of the drafts the copilot writes, how many are correct and go out with little or no editing. If most do (I'd aim for around 7 in 10), it is accurate and lightening the load for the one person answering about 60 emails a day. I'd also ask that person whether checking drafts is quicker than writing replies from scratch. I'd switch it off if a wrong refund or order detail reaches a customer, if one customer's details go to someone else, or if the person says it makes their day harder.

4. **Failure experience:** Since replies are drafts, most wrong answers are caught before the customer sees them. If one slips through, the customer sees something like a wrong delivery date, a wrong policy, or a declined refund that should have been approved. To limit the damage: rules live in code, not just the prompt (ownership check, return window, no "approved" wording), risky cases are reviewed by a person, and the full draft is kept in the audit log so we can trace it. A human then sends an apology and correction within 24 business hours and reopens the ticket. Goodwill gestures would be a human decision, never something the AI offers.

5. **Don't automate:** Replies about skin conditions or reactions (for example E20, eczema). The FAQ says support must not give medical advice or claim a product treats a condition, and a wrong answer could harm someone. The copilot can only say the product is a cosmetic and suggest seeing a doctor; a person takes it from there.

## 8. How I used AI tools

**[REWRITE IN YOUR OWN WORDS and keep only what is true for you.]** Draft of what happened: I used Claude (Anthropic) throughout the build as a pair-programmer. It proposed the architecture ("LLM extracts, code decides"), wrote the first versions of the Code node scripts and prompts, and helped me debug problems as they came up (for example a node-name mix-up that made the Webhook data reach the wrong node, the order-ID extraction, and Gemini 503 overload errors). I ran, tested and edited everything in n8n myself. **[Add anything you changed or decided on your own.]**

## 9. If I had one more week

- Replies in Hindi and Hinglish tested properly, then regional languages (Tamil, Bengali, Marathi), since Kesar sells across India.
- Retries with backoff and a queue for LLM rate limits.
- Safer duplicate-ticket handling when two emails for the same order arrive at once.
- A larger test set than 25 emails, and tuning of the keyword rules against it.
- Token and cost tracking for the agent call, not just classification.

<img width="1915" height="892" alt="Screenshot 2026-11-25 123203" src="https://github.com/user-attachments/assets/aee2b988-5c22-4d55-9b33-69e0f631afbc" />
<img width="1915" height="687" alt="Screenshot 2026-11-25 122714" src="https://github.com/user-attachments/assets/03065f37-bd5b-44f5-aad0-7f2acd3cd266" />
<img width="1917" height="695" alt="Screenshot 2026-11-25 122704" src="https://github.com/user-attachments/assets/8a4ffed1-e2ab-4f35-98f1-e92cf5b76fd3" />
