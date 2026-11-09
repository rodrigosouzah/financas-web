# Expense chat

In Despesas, **Assistente** prepares one expense from a conversation. It never writes financial records itself. **Revisar e confirmar** opens the existing expense form; only the user's Save posts the validated entry through the canonical workspace flow.

- Uses OpenAI Responses API, `gpt-6-luna`, strict structured output and `store:false`.
- Requires server-only `OPENAI_API_KEY` in Sites runtime secrets. Never commit an env file or expose the key to browser code.
- Requests require authenticated identity, exact same-origin POST, owner header and a profile belonging to that owner in the saved cloud workspace.
- Sends conversation text and a limited catalog of registered types, card names/final four/currencies, account names/final four/currencies and active people names. Does not send workspace expense history, balances, card limits, passwords or profile identity fields.
- Conversation is held in the open UI only. Closing it discards the conversation. OpenAI's API data policies still apply; `store:false` is not a claim of zero retention.
- New `finance_ai_usage` migration stores daily request counters only. Atomic limits: 20 requests per account and 200 requests globally per UTC day, including failed upstream requests after reservation. These limits cap requests, not a dollar budget. Configure provider billing independently.
- No tools, shell, payments, account creation, ledger deletion or autonomous posting. Unknown references and missing fields require follow-up or manual correction. Totals and dates for installment counts are calculated locally with exact cents and month-end clamping.
- The entered installment amount can be total or monthly; the review always shows the calculated total, matching the existing Despesas schema. Interest or different final installment amounts need manual review; not invented.
- Pending or newly registered local data must sync before the server catalog can recognize it.
- Mac Nuvem uses this same web feature; legacy local profiles do not gain chat automatically.

Checks: in-memory synthetic proposal tests; live synthetic structured-output API verification without posting an entry. Real profile/chat/save and mobile presentation require user acceptance testing.
