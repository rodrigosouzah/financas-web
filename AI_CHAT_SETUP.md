# Assistente VR

The global header **Assistente VR** button prepares one new expense, income, card, bank account, person, goal or saving from a conversation. On mobile it is an icon-only chat bubble with sparkle and opens a full-screen sheet. It never writes financial records itself. **Revisar e confirmar** opens the corresponding existing form prefilled with a new draft; only the user's Save creates the record through the canonical workspace flow. Existing records cannot be edited or deleted by assistant drafts.

- Uses OpenAI Responses API, `gpt-6-luna`, strict structured output and `store:false`.
- Requires server-only `OPENAI_API_KEY` in Sites runtime secrets. Never commit an env file or expose the key to browser code.
- Requests require authenticated identity, exact same-origin POST, owner header and a profile belonging to that owner in the saved cloud workspace.
- Sends conversation text and a limited catalog of registered types, card names/final four/currencies, account names/final four/currencies and active people names and goal names/currencies (not target or saved balances). Does not send workspace expense history, balances, card limits, passwords or profile identity fields.
- Conversation is held in the open UI only. Closing it discards the conversation. OpenAI's API data policies still apply; `store:false` is not a claim of zero retention.
- The `finance_ai_usage` table stores daily request counters only. Atomic limits: 20 requests per account and 200 requests globally per UTC day, including failed upstream requests after reservation. These limits cap requests, not a dollar budget. Configure provider billing independently.
- No shell, payments, authentication account creation, ledger deletion, edits or autonomous posting. Creating bank-account registry records is allowed only through user-reviewed forms. Unknown references and missing fields require follow-up or manual correction. Totals and dates for installment counts are calculated locally with exact cents and month-end clamping.
- The entered installment amount can be total or monthly; the review always shows the calculated total, matching the existing Despesas schema. Interest or different final installment amounts need manual review; not invented.
- Pending or newly registered local data must sync before the server catalog can recognize it.
- Mac Nuvem uses this same web feature; legacy local profiles do not gain chat automatically.

Checks: in-memory synthetic proposal tests; live synthetic structured-output API verification without posting an entry. Real profile/chat/save and mobile presentation require user acceptance testing.

## FAQ

`lib/assistant-faq.ts` contains curated help answers, including explicit feature limitations. Exact recognized help questions are answered locally without an API request or usage counter. The server also intercepts recognized FAQ questions before reserving quota. Other help questions can use AI with the same FAQ context, but must return `action:null,data:null`; they never write financial records. Unknown functionality is not invented. FAQ content is version-controlled and shared by web and Mac Nuvem.
