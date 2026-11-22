# NAEL WhatsApp QA Webhook — Isolated Cloudflare Free

**Status: SOURCE READY / NOT DEPLOYED / NOT CONNECTED TO META**

This directory is standalone. No linkage to NAEL or MatchPro production backends, existing WhatsApp agents or Outlook booking.

## Architecture
- src/index.mjs: official Meta Cloud API Webhook QA endpoint only.
- GET /health: confirms QA status without revealing credentials.
- GET /webhook: validates hub.mode=subscribe, constant-time checks hub.verify_token, echoes hub.challenge.
- POST /webhook: verifies X-Hub-Signature-256 HMAC-SHA256 over raw bytes before JSON parsing.
- Isolated SQLite-backed Durable Object deduplicates hashed keys; 24h event-key retention via per-event expiration cleanup.
- No outgoing messages, CRM writes, Meta Graph calls, or raw customer data storage.
- QA_ONLY=true is mandatory; missing secrets/binding fail closed.

## Unit tests (synthetic data only)
From this directory: npm test (node --test test/*.test.mjs)
Test plan: disabled default; valid/invalid GET; signed POST, duplicate replay, wrong HMAC, altered payload, bad JSON, oversized body, unsupported route; signed JSON null; malformed entry; event count overflow; Durable Object with mock SQLite. The local Node tests passed 11/11 on 22 Nov 2026; this is not a deployed Cloudflare runtime test.

## Cloudflare Free — requires separate approval
1. Select the owner's Cloudflare Free account. Deploy a NEW Worker named nael-whatsapp-webhook-qa, not any production Worker.
2. Confirm no custom routes/domains are assigned; workers.dev only.
3. Run local test with dummy secrets in uncommitted .dev.vars: META_VERIFY_TOKEN and META_APP_SECRET. Never use production app secrets in local testing.
4. Only on approval: deploy using npx wrangler deploy (from nael-wa-qa); this creates an isolated SQLite Durable Object namespace subject to Cloudflare Free quotas.
5. Configure secrets ONLY using Cloudflare secure settings or npx wrangler secret put META_VERIFY_TOKEN and npx wrangler secret put META_APP_SECRET; never paste secrets into ChatGPT, GitHub, Sheets or QR codes.
6. GET /health must say QA_ONLY, configured:true, productionConnected:false.
7. GET /webhook with hub.mode=subscribe, hub.verify_token=<local test token>, hub.challenge=1234 must echo 1234; wrong token returns 403.
8. POST test synthetic JSON signed as HMAC-SHA256 over exact raw bytes. Expect 200 unique=1, replay 200 duplicate=1, altered payload 401.
9. Confirm logs contain counters only. Do NOT subscribe production WABA or existing Meta app to this test endpoint.
10. Review limits and quota before further tests. Do not send customer messages.

## QR / Baileys
Baileys QR is unofficial WhatsApp Web linked-device login and does not perform the official Meta Cloud API webhook verification. It is excluded from this official QA pathway. A QR containing the PUBLIC NAEL dashboard URL may be used for iPhone installation; never render a WA login QR/session on a public page.

## Gates to production
- [ ] Local test suite passed
- [ ] Cloudflare QA Worker approved separately and deployed
- [ ] Synthetic handshake and HMAC tests passed
- [ ] Duplicate replay suppressed
- [ ] No customer PII or secrets in logs
- [ ] Outlook/Meta production unchanged
- [ ] Separate explicit owner approval before real WABA webhook subscription
- [ ] Separate explicit owner approval before outbound messaging

No live Meta integration is claimed. See QA_REPORT_2026-11-22.md for exact local results, limits and outstanding QA gates.
