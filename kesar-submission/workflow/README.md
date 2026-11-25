# Workflow export

Put your n8n exports here:

- `support_copilot_v2.json` (final version)
- `support_copilot_v1.json` (early version, only if you built it)

How to export: open the workflow in n8n, click the **⋯** menu at the top right, then **Download**.

**Before committing, open each JSON file in a text editor and search for your Gemini key (it usually starts with `AIza`) and for the word `Bearer`.** The brief says never to commit API keys. n8n normally stores credentials by reference, not by value, but check anyway.

The readable source of every Code node is in `../code/`.
