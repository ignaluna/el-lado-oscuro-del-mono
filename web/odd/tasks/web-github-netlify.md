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
- [ ] G2 Netlify: root `netlify.toml` (contexts production / deploy-preview / branch-deploy), docs, root README link.
- [ ] G3 Verify: builds as Netlify will run them (production and preview), harness from the repo, then push + PR.

## Acceptance criteria
From the repo: `node web/tools/build.cjs` reproduces the published page; the harness runs with the repo's Playwright;
`netlify.toml` builds `web/dist` with the right address per context; PR open against `main`.

## Progress / evidence
- 2026-10-23: document created (3 tasks). G1: website copied from `el-lado-oscuro-del-mono-web` (the permanent copy of
  the v10 project), local absolute paths removed (check.cjs, sheet.cjs → `require('playwright')`; DESIGN.md root).

## Next step
G2.
