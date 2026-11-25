# Before you push: checklist

Based on `docs/SUBMISSION.md`. Deadline: **4 days from your invitation email** (late only if you tell them in advance).

## Files to add yourself
- [ ] `workflow/support_copilot_v2.json` (n8n: ⋯ → Download), plus v1 if you built it
- [ ] `screenshots/workflow.png` (full canvas)
- [ ] `screenshots/tickets.png` (the Tickets tab with the tickets created)
- [ ] `screenshots/audit_log.png` (the Audit Log tab with all 25 rows)

## Results (nothing here may be invented)
- [ ] Run all 25 emails on v2, and at least 10 on v1
- [ ] Fill `TEST_REPORT.md`: v2 results for all 25, v1 comparison, and the failures you couldn't fix
- [ ] Fill every **[BRACKET]** in `README.md`
- [ ] If you could not finish the 25-email run or v1, say so plainly in both files

## README items
- [ ] Google Sheet link (view access) showing all 25 emails and the tickets
- [ ] Recording link
- [ ] Real model names you ran (Classify URL and Gemini Chat Model node)
- [ ] Q2 cost worked out with the model's published prices, with the pricing page cited
- [ ] Time spent
- [ ] Section 8 (AI tools) rewritten in your own words, keeping only what is true

## 5-minute screen recording (Loom, Drive or unlisted YouTube)
- [ ] Your workflow and a quick tour of the main branches
- [ ] At least three emails running end to end, including one that creates a ticket
- [ ] One thing that doesn't work well yet, and why

## No secrets
- [ ] Search the workflow JSON and every file for `key`, `token`, `secret`, `Bearer`, `sk-`, `AIza`

## Send
Reply to your invitation email with: the GitHub repo link, the recording link, the Google Sheet link. Keep the workflow and the Sheet running until they reply.

## Push
```
cd kesar-submission
git init
git add .
git commit -m "Kesar support copilot submission"
git branch -M main
git remote add origin <YOUR_REPO_URL>
git push -u origin main
```
