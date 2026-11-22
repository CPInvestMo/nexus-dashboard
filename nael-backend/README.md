# NAEL backend — safe implementation foundation

This code is **not yet deployed**, and there is NO verified live Worker URL. It is intentionally fail-closed until configuration and external adapters are verified.

## Current implemented endpoints
- `GET /api/health`: real D1 query, 200 or 503.
- `GET /api/status`: authenticated, reads persisted integration flags.
- `GET /api/executions/:id`: authenticated, reads a real execution record.
- `POST /api/actions/run-now`: only `targetType=task,targetId=nael-db-self-check` supported; real DB check, persisted execution record and audit rows. All other task/agent dispatch returns 422.
- `POST /api/approvals/:id/decide`: authenticated REJECT with persisted audit. APPROVE returns 422 until a real external action adapter is safely installed, without changing approval state.
- `POST /api/integrations/sync-all`: does a real D1 read and persist its execution, reports external adapters as not configured. This is NOT Google/WhatsApp/Gmail sync.
- `POST /api/deployments/deploy-and-test`: explicit 422 UNSUPPORTED_ADAPTER; cannot claim deployment.

## Deployment prerequisites
1. Authorize deployment only to Cloudflare Free plan, verify account and existing `nael-db` name, stable D1 database ID, quota/cost exposure, and no auto-upgrade/paid feature.
2. Put verified `database_id` into `wrangler.jsonc` (ID is not a credential).
3. Provision `NAEL_ADMIN_TOKEN` using `wrangler secret put NAEL_ADMIN_TOKEN` (**at least 32 random characters**). NEVER commit the token.
4. Apply D1 migration with `npm run db:migrate:remote`; get Cloudflare execution receipt and inspect tables.
5. Only then deploy with `npm run deploy`, inspect logs, and probe /api/health from outside the deployment service. This requires a real authorized Cloudflare runtime not currently available in ChatGPT session.
6. Add `nael-db-self-check` internal test task only in designated QA project, with a unique id and a FK-valid projects record. Do not seed real customer leads or mark actual business tasks completed.
7. Integrate Cloudflare Access for user-facing authentication **before exposing a production browser client**. The bearer secret in this initial Worker is only a server-to-server bootstrap; never embed it in a public frontend.
8. Approval execution, Gmail/Outlook/Drive adapters, WhatsApp verified webhook/HMAC and signing, queue dispatch, and deployment adapter are NOT implemented. Do not make their buttons look operational.
9. Make explicit decision whether to preserve existing Meta Business Agent on +20 10 66505665 without disrupting current webhook. Use non-customer test sender only after specific authorization.
10. Money: do not activate paid services. TinyFish <= USD 20/month with enforced provider cap; no auto recharge.

## API example: database self-check (QA only)
```shell
curl -X POST https://ACTUAL_VERIFIED_WORKER_URL/api/actions/run-now \
 -H 'Authorization: Bearer <PRIVATE_SERVER_TOKEN>' -H 'Content-Type: application/json' \
 -d '{"targetType":"task","targetId":"nael-db-self-check","idempotencyKey":"qa-db-check-20261122"}'
```
The worker returns a persisted executionId only if the migration, seeded QA task, and authorization succeeded. Not a simulated receipt.

## Known limitations
- This Worker has no production OAuth/session implementation, no central queue, no business task adapter, no live deployment integration, no external sync, and no external action sending.
- Existing NAEL static dashboard is separate and requires its own GitHub Pages publication verification.
- Do not copy private Google Sheets, secrets, financial records, or customer messages into the public repo.
