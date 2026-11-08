# Finanças Web

A Portuguese personal-finance web app/PWA for Mac and Windows, preserving the established Finanças cards and widgets design. Version **0.3.0-web.6**.

## User features

- Separate profiles, optional profile access passwords, no seeded financial records.
- Imported rows remain reviewable drafts until **Salvar lançamentos**; a persistent banner and action appear on every page. Only valid rows are posted, once. Invalid rows remain editable.
- Widget organization supports direct pointer dragging of the whole card or handle (mouse, trackpad and touch), gap drop targets, edge auto-scroll, Escape cancellation, keyboard-accessible move arrows and hide controls. Grid order follows the displayed sequence.
- Mac-style monthly payment calendar: Monday-first seven-column grid, complete month including empty days, daily/monthly totals, purchase-mode filter and day-to-expenses drilldown carrying that filter. Reference conversions are marked; unavailable rates leave original currencies separate.
- Customizable dashboard widgets on an aligned grid: payment calendar, reimbursements by person, card bills, installments, savings, Brazil transfers, spending types, and compact FX.
- Bank-branded credit/debit cards. Contas lists bills paid directly from bank accounts or debit cards, with monthly amounts and a link to the canonical expense row. Credit-card purchases stay in Cartões even when they have a funding account. Bank registries, balances and cumulative projections remain accessible through Contas bancárias e saldos.
- One editable expense table; Excel `.xlsx`/`.xlsm` and clipboard import with mapping/review, multi-cell selection, bulk replacement, type colors, filtering/sorting, deletion confirmations and Excel export.
- Monthly installment calculations in integer cents. The last installment absorbs rounding. Viewing a future month never confirms a payment or silently reduces a reported bank debt.
- Full gross expenses remain payable; shared reimbursement percentages are calculated separately. Salary can recur two days before month-end.
- Savings assigned to goals, target dates, progress and monthly saving requirements.
- Notifications with session history. Magic Suggestions is explicitly under construction; no AI service is connected.
- EUR/BRL/USD with local SVG flags and online ECB reference rates. These are reference rates, not a Wise executable quote or transfer-fee estimate.

## Saving and privacy

Hosted access is owner-private by default. The hosting platform supplies ChatGPT identity. D1 records are scoped to its stable authenticated user ID. The API checks the expected owner and uses compare-and-swap revisions to prevent overwriting another device's changes. Conflicts preserve the local data and offer a backup before loading the cloud version.

IndexedDB holds a device copy for offline use after the first online visit. The service worker caches the app shell and public assets only; financial API responses are never cached by it. Profiles with access passwords use salted PBKDF2 hashes, but this is a UI access gate, **not end-to-end encryption**. Avoid leaving an authenticated session on shared computers. JSON backups contain the complete workspace and should be stored privately.

The web app does not automatically migrate or modify the native Mac app's stored profiles. Users import their own records. Excel exports retain direction, inclusion flags and confirmed installment history in hidden metadata columns. JSON is the complete profile backup, including accounts, people, cards and goals.

## Development

Use Node >=24 for the TypeScript model tests, Git, and the standard locked npm dependencies.

```sh
npm ci
npm test
npx tsc --noEmit
npm run dev -- --hostname 127.0.0.1 --port 5173
```

For Sites publication, follow the installed Sites skill. `.openai/hosting.json` retains this Site's identity and D1 binding; do not create a replacement Site. Build through the supported Sites build helper. Generated migrations live in `drizzle/`; never replay an already applied migration manually. Local preview sign-in is simulated only on loopback by the supplied starter; production identity is platform-owned.

Do not commit `.tools`, `.wrangler`, `.sites-runtime`, personal financial files, profile backups, credentials, or publication archives. This directory has its own Git repository and must never be confused with the native app repository or public download-only release repository.

## Validation

`tests/` contains only in-memory synthetic model fixtures. Tests cover cents, installment schedules, deleted-link warnings without loss of gross obligations, stable reimbursement beneficiaries, cumulative account forecasts, goal allocation, type colors, data validation, FX cross rates, actual XLSX round trips and duplicate-import behavior. No financial profile is created or imported during these tests.

## Assets

Public bank marks are stored locally with their retained catalog notices/licenses under `public/banks/`. Icons use Lucide; the app wallet artwork is retained from the existing app. The application stack includes React, Vinext, Drizzle and fflate, under their respective dependency licenses. Bank marks identify their owners and do not imply affiliation.

Public source: https://github.com/rodrigosouzah/financas-web. See [RELEASING.md](RELEASING.md) for the required dual publication workflow.
