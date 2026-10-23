# Feature: web-github-netlify — the launch website in the repo, published by Netlify from pull requests

## Objective
User 2026-10-23: "vincular github, para que cuando quiera cambiar algo en la web solo haga el PR y listo", in the
existing public repo `ignaluna/el-lado-oscuro-del-mono` ("subilo así público y abrí el PR").

## Why / problem
The website only existed outside the repo (first a temporary scratchpad, then a local folder) and was published by
hand. Changes need a reviewable path: PR → preview → merge → live.

## Scope / constraints
- The website goes in `web/`, independent of the Railway app (no shared code; Playwright from the repo for tests).
- Branch `feat/web-netlify` from `origin/main` in a separate worktree: `feat/perf-assets` (unpushed commits and
  uncommitted work) stays untouched.
- Public repo (user's choice): no secrets in the website (checked: no keys, emails or private links; no audio).
- Netlify: `netlify.toml` at the repo root, base `web/`; `main` → final site (`--release`), PR previews → DEV tools.
  Connecting Netlify to GitHub (OAuth) is the user's step.
- Conventional commits, no AI attribution. Route: inline (user declined subagents for this website). TDD not
  configured: harness scenarios.
- Size: importing an existing, tested project is one cohesive unit (~10k lines); splitting it would be artificial →
  size exception, stated in the PR.

## Tasks
- [x] G1 Branch + `web/` with the website (src, tools, docs), repo-relative Playwright, `.gitignore`, README.
- [x] G2 Netlify: root `netlify.toml` (contexts production / deploy-preview / branch-deploy), docs, root README link.
- [x] G3 Verify: builds as Netlify will run them (production and preview), harness from the repo, then push + PR.

## Acceptance criteria
From the repo: `node web/tools/build.cjs` reproduces the published page; the harness runs with the repo's Playwright;
`netlify.toml` builds `web/dist` with the right address per context; PR open against `main`.

## Progress / evidence
- 2026-10-23: document created (3 tasks). G1: website copied from `el-lado-oscuro-del-mono-web` (the permanent copy of
  the v10 project), local absolute paths removed (check.cjs, sheet.cjs → `require('playwright')`; DESIGN.md root).

- G1 checks (from the repo, worktree `el-lado-oscuro-del-mono-wt-web`): `node web/tools/build.cjs` → artifact
  identical to v10 (`cmp`); `check.cjs --syntax` OK; `--scenario smoke,cabin,mini --viewport mobile` green with the
  repo's Playwright. Commit 61e2b61 (31 files, +9771).
- G2/G3 checks: production build (`URL=https://el-lado-oscuro.netlify.app`) → DEV hidden, invitations and og:image on
  that address; preview build (`DEPLOY_PRIME_URL=https://deploy-preview-1--…`) → DEV shown, both on the preview; empty
  `$URL` falls back to the page address. Preview build with its `_headers` (`--dist`): smoke, selftest (18/18
  players), mini green on desktop. TOML not machine-validated (no parser available locally): plain tables and strings.

- Commits 61e2b61 (website) + abb2b17 (Netlify); PR https://github.com/ignaluna/el-lado-oscuro-del-mono/pull/1 →
  `main`. Size exception: one cohesive import of the tested v10 project (~9.8k lines) + a 40-line config commit.
- Review (RDD on): `gentle-ai review assess` on 0bb40c0..abb2b17 → medium (configuration change in netlify.toml,
  slice budget reached); START offered consent; the user declined for this change (2026-10-23, "Saltear esta vez").
  Verification of record: the writer checks above.

## Next step
User: merge, then connect Netlify to the repo (Import an existing project → GitHub), then a first small PR to see the preview.
Railway: if it deploys from this repo, set Watch Paths so web/ changes do not redeploy the app.
