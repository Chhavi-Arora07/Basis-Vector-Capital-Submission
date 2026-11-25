# Test report

> **Status: results not yet recorded.** The full 25-email run on v2 and the v1 comparison had not been completed when this folder was prepared. Do not submit this file with invented results. Fill in each **[...]** from your Audit Log sheet, and if a run was not done, say so plainly in "Honest limitations" below.
>
> Follow the structure of `templates/test_report_template.md` from the assignment repo if its headings differ from these.

## 1. What was run

| Version | Emails run | How they were sent | Date |
|---|---|---|---|
| v2 (final) | **[N of 25]** | **[script / Hoppscotch / n8n test run]** | **[DATE]** |
| v1 (early version) | **[N, at least 10 required]** | **[...]** | **[DATE]** |

Verified by hand during the build (observed in n8n, not yet in a full batch):

- **E01** (order status, KC-1041): classified as `order_status`, order found and verified by sender email, agent produced a draft, row appended to the Audit Log.
- **[ADD each other email you really ran, for example E04, E07, E21, and what you saw.]**

## 2. Results per email (v2)

Fill from the Audit Log sheet. Leave a row blank if the email was not run.

| ID | Expected behaviour | Intent | needs_human | action_taken | ticket_id | Pass / Fail | Notes |
|---|---|---|---|---|---|---|---|
| E01 | Order status, verified, draft reply | order_status | false | agent_draft | none | **[Pass if confirmed]** | |
| E02 | **[from test_emails.json]** | | | | | | |
| E03 | | | | | | | |
| E04 | Return/refund: ticket created | | | | | | |
| E05 | | | | | | | |
| E06 | | | | | | | |
| E07 | Sender does not match order: privacy block | | | | | | |
| E08 | | | | | | | |
| E09 | | | | | | | |
| E10 | | | | | | | |
| E11 | | | | | | | |
| E12 | | | | | | | |
| E13 | | | | | | | |
| E14 | | | | | | | |
| E15 | | | | | | | |
| E16 | | | | | | | |
| E17 | | | | | | | |
| E18 | | | | | | | |
| E19 | | | | | | | |
| E20 | Skin question: needs human, no medical advice | | | | | | |
| E21 | Same order as E04: existing ticket updated, no duplicate | | | | | | |
| E22 | | | | | | | |
| E23 | | | | | | | |
| E24 | | | | | | | |
| E25 | | | | | | | |

"Expected behaviour" for rows other than E01, E04, E07, E20 and E21 must come from `data/test_emails.json`, which was not available when this file was prepared.

## 3. v1 vs v2

**[State what v1 was, what you changed for v2, and what the numbers showed. If v1 was not built, write "v1 was not built" here.]**

| Measure | v1 | v2 |
|---|---|---|
| Emails run | **[ ]** | **[ ]** |
| Valid classification JSON | **[ ]** | **[ ]** |
| Correct routing | **[ ]** | **[ ]** |
| Privacy mismatches blocked | **[ ]** | **[ ]** |
| Duplicate tickets | **[ ]** | **[ ]** |

## 4. Failures and what I changed

Real problems met while building (these did happen):

1. Gemini returned `503 model overloaded` during testing. Change: Retry On Fail on the Classify node.
2. Order ID came back null even though the email contained it. Change: the order ID is now taken from the email text by pattern in code, never from the model.
3. Fields were empty downstream because a node reference pointed at the Webhook node instead of Normalize. Change: node names corrected.

**[ADD failures from the full run, with the email ID and what you changed.]**

## 5. Honest limitations

- Keyword lists for damaged/missing items, skin reactions and "opened or used" in `Decide` are a first version and have **not been tuned against all 25 emails**.
- **[State whether the full 25-email run happened.]**
- **[State whether the v1 comparison happened.]**
- Replies are drafts only; nothing is sent to customers.
- Hindi and Hinglish replies were **[tested / not tested]**.
