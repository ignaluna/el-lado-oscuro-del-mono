# Feature: leads-sheet — sign-ups land in a Google spreadsheet

## Objective
User 2026-10-23: about 1,000 people will leave their details to be told when the album is out; be ready for 10,000;
"vincularlo a un excel… o algún tipo de base de datos, lo que sea más económico" → "armalo con la planilla de Google".

## Why / problem
`LEAD_ENDPOINT` is `null`: every sign-up stays only in the visitor's browser and reaches nobody.

## Scope / constraints
- Google Sheets + a Google Apps Script web app bound to the sheet (free; 10,000 rows ≈ 150,000 cells of the
  10,000,000 a sheet allows). Quotas (consumer account): 30 simultaneous executions per user, 6 min per run.
- The script (`tools/leads/Code.gs`) validates again on its side (the endpoint is public), ignores the honeypot,
  refuses duplicates (same WhatsApp, email or Instagram already in the sheet) under a lock, writes every user value
  as plain text (no formulas, the WhatsApp keeps its "+"), and answers JSON.
- The page posts the JSON as `text/plain` (a "simple" request: Apps Script answers no CORS preflight), follows
  Google's redirect, retries twice on failure (bursts over the 30-at-once quota), keeps the visitor's values on error.
- CSP `connect-src` gets the endpoint's origin at build time (+ `script.googleusercontent.com` for Apps Script).
- Privacy note: only the factual sentence about where the data is kept changes with the endpoint; the band reviews the
  rest of the text. `source` tells production, previews and local tests apart (page host).
- The user creates the sheet and deploys the script with their Google account (instructions in Spanish:
  `tools/leads/LEEME.md`); the URL then goes into `LEAD_ENDPOINT`.
- Delivery: one cohesive PR (script + page + tests + docs, ~600 lines): the user reviews by trying the preview, not by
  reading the diff → size exception recorded here. Route: inline (user declined subagents for this website). TDD not
  configured: node tests for the script, harness scenario for the page.

## Tasks
- [x] S1 Apps Script: `doPost` (validate, honeypot, duplicates under a lock, plain-text row, JSON answer) and `doGet`
      (health check), pure helpers testable in Node; `node --test` suite with an in-memory sheet.
- [x] S2 Page: text/plain POST with retries and a longer timeout, `source` from the host, privacy sentence by mode,
      CSP origin from `LEAD_ENDPOINT` in the build, preflight checks the endpoint's health.
- [x] S3 Harness: a mock endpoint behaving like the script (`--leads mock`), scenario `leads` (row content, duplicate,
      honeypot, a busy endpoint retried, a dead endpoint keeps the form); regression of form/tour.
- [x] S4 Docs (LEEME for the user, web README), commit, PR.
- [ ] S5 With the user's URL: set `LEAD_ENDPOINT`, one real test sign-up, check the row.

## Acceptance criteria
A sign-up on the site appears as one row in the band's sheet with the data as typed; the same person twice → one row
and the "ya estabas" message; junk or honeypot posts add nothing; a busy endpoint is retried; a dead one shows the
error and keeps what the visitor typed.

## Progress / evidence
- 2026-10-23: document created (5 tasks). Branch `feat/leads-sheet` from main 860f00a.
- S1: `tools/leads/Code.gs` (`@OnlyCurrentDoc`, parseLead / toRow / ensureSheet / findDuplicate, doGet / doPost
  with `LockService.tryLock(20000)`), `sheet-sim.cjs` (the script in a vm with Google's services faked and an
  in-memory sheet that drops a leading apostrophe like Sheets does), `node --test web/tools/leads/Code.test.cjs`
  8/8 (health check; first row + headers + frozen row as typed; "+" kept and formula-like text; duplicates by
  email / WhatsApp / Instagram in any case; honeypot; 9 invalid bodies; trimming; busy lock).
- S2: `submitLead` posts text/plain, follows the redirect, 3 tries (1.2 s, 3 s), 15 s each, stops on `invalid`;
  `source` = `prelaunch:<host>`; `#privacy-where` → `COPY.privacySheet` when an endpoint is set; `build.cjs` adds the
  endpoint origin (+ script.googleusercontent.com) to `connect-src` (checked with a test URL); `preflight.cjs` warns
  on a null endpoint, checks its health and, with `--site`, that the CSP lets sign-ups out.
- S3: `LeadsMock` in `check.cjs` (the real script on another port, 302 → JSON echo, 405 to preflights, `busy`,
  `down`), pages opened with `?leads=mock` point at it; scenario `leads` green on desktop: one row as typed with its
  origin and consent, text/plain with no preflight, the same email from another device stays one row ("Ya estabas"),
  honeypot sends nothing, busy ×2 → 3 tries and the row lands, unreachable → error + form kept, then it goes through.
  Found on the way: a comment of mine had cut the sign-up object line (syntax check caught it before any run).

## Next step
S4 regression + commit + PR; S5 needs the user's `/exec` address (tools/leads/LEEME.md).
