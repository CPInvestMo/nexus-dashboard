# NAEL backend v1 — execution contract
Status: IMPLEMENTATION CONTRACT, NOT a deployed or tested API. Source: NAEL full master specification, 22 Nov 2026.
Timezone in UI Africa/Cairo. Persist all timestamps UTC ISO-8601; convert only on display.

## Trust boundaries
- **Authenticate before every /api route** with server-verified identity; NEVER trust user ID, role, project access, agent permissions, approval actor, or finance cap submitted by the browser.
- RBAC: OWNER/ADMIN/EDITOR/VIEWER. Least privilege per project. DENY BY DEFAULT.
- One database authority. D1 preferred only if actual connectivity and credentials are verified. SQLite D1 migration: `migrations/0001_core_d1.sql`.
- Every mutation checks JSON schema, authorization, idempotency, and policy. Mutations and audit insertion use one transaction / D1 batch; on failure return a non-2xx error with a stable code.
- Use app-generated UUIDv7 or ULID identifiers and cryptographically strong idempotency keys scoped by actor+operation+payload. Replays of the same key and same payload retrieve the existing receipt, NEVER dispatch twice. Same key different payload returns 409.
- Never put tokens, client contact data, OAuth secrets, access credentials or payment details in public HTML, local logs, or `output_json`.
- Allow independent RENT and SALE pipelines. RENT demand only with rental supply; SALE demand only with sale inventory. Verified original source time != report batch time != sync time. Preserve status UNKNOWN rather than inventing data. No Leil private records in commercial broker report products.
- Reject attempts to mark an integration operational without a successful live adapter test (not only authorization).
- Async workers must claim QUEUED runs atomically, record RUNNING with lease, record terminal output/error and audit. Retrying requires explicit fresh attempt or safe replay policy; do not report QUEUED as SUCCEEDED.
- Approvals are bound to the EXACT immutable payload hash, recipient, scope, amount and currency. Approvals can be decided once; stale / changed payload requires a new approval. Approval by itself is not proof of executed action.

## API common error envelope
HTTP 400 VALIDATION_ERROR; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND; 409 CONFLICT; 422 UNSUPPORTED_ADAPTER/DEPENDENCY_UNAVAILABLE; 429 RATE_LIMITED; 503 INTEGRATION_UNAVAILABLE.
Body: `{ error: { code, message, details? }, requestId, auditedAt }`. No fake HTTP 200 success.

## 1. POST /api/actions/run-now
Input: `{targetType:"task"|"agent",targetId:string,idempotencyKey?:string}`
Action: verify user + scope, check task/agent not disabled, authorized permissions, existing duplicate; persist execution_runs state QUEUED with audit; enqueue to verified worker adapter; worker later updates RUNNING then SUCCEEDED/FAILED/TIMED_OUT. On enqueue unavailable return 503 and mark FAILED with evidence.
202: `{executionId,state:"QUEUED",auditedAt,statusUrl:"/api/executions/{id}"}`.
200 only for idempotent replay of an identical execution with actual persisted state.
GET /api/executions/:id returns execution state, timestamps, source evidence, redacted result and error.

## 2. POST /api/approvals/:id/decide
Input: `{decision:"APPROVE"|"REJECT",reason?:string}`
UI must fetch complete server-stored immutable payload including recipient, action, scope, cost and time BEFORE confirmation. Verify approving user, policy, expiry and payload hash. TinyFish cap: USD 20 per calendar month with actual enforced provider spending limit; if provider cannot guarantee it, block auto-top-ups and any pending top-up.
Atomic compare-and-swap PENDING -> APPROVED/REJECTED; reject => no dispatch. Approve => queue EXACTLY one authorized action with execution_id (not executed state); persist audit.
202: `{approvalId,status,executionId?,auditedAt}`.
409 if approval already decided or payload changed.
For sending email/WhatsApp, recipient-by-recipient approval and idempotency required.

## 3. POST /api/integrations/sync-all
Input: `{services?:string[],idempotencyKey?:string}`
Verify scope per adapter. Trigger per-service reads/writes only for authorized modes. Timeouts, pagination and retries bounded. Each result includes exact `connected,authorized,reachable,tested,operational,lastReadAt,lastWriteAt,lastSyncAt,error`; never infer operational from connected.
202: `{executionId,state:"QUEUED",statusUrl:"/api/executions/{id}"}`.
Once terminal GET gives `{succeeded:[...],failed:[...],syncedAt}`. Partial failures are failures, not blanket success.

## 4. POST /api/deployments/deploy-and-test
Input: `{hostingTarget:string,gitRevision:string,idempotencyKey?:string}`
Require OWNER/ADMIN, allowed host, reviewed actual revision, cost/security approval if risky. Refuse suspended Render/Railway accounts. Build -> deploy -> health probes: HTTPS, /api/health 200, database SELECT+test transaction write+read+rollback, authentication, safe task run, persistence. Never mark success on GitHub workflow commit alone.
202: `{executionId,state:"QUEUED",statusUrl:"/api/executions/{id}"}`; terminal output includes `{deploymentId,revision,url,healthStatus,checks}` or actual failure.

## Additional mutation semantics
Pause/Resume schedule: persisted state and scheduler backend confirmation, not client-only toggle.
Create Task: persistent UUID, project FK, source provenance and audit.
Retry: reuse immutable external-event idempotency semantics; no duplicate external transmission.
Export Report: produce a real file from authorized rows and provenance; never mix rental and sale.
Open WhatsApp: validated wa.me prefill only; does not imply message sent.

## Minimum end-to-end gates — 8-part delivery
1. Verified HTTPS URL and independent HTTP 200 check.
2. GitHub repo, exact deployed commit and build log.
3. Hosting + D1/PostgreSQL migration logs, restart persistence proof.
4. Integration matrix (connected / authorized / reachable / tested / operational), evidence timestamps and error messages.
5. Actual execution IDs, state transitions, `execution_runs` and `audit_logs` readback.
6. Four core buttons with successful and failure test cases; repeated keys produce exactly one external action.
7. Unresolved blockers with owner decision needed, no invented status.
8. Next actionable engineering step.

## Non-negotiable acceptance tests
- Fresh D1 migration executes twice without errors; FK and CHECK constraints reject invalid data.
- DB restart retains 1 safe test project, execution and audit log; no secrets in DB logs.
- Unauthenticated write = 401, unauthorized project = 403, invalid enum = 400.
- Duplicate concurrent Run Now with identical idempotency key -> one execution.
- Two approval decisions on same approval -> one 202, one 409. REJECT triggers zero actions.
- External message attempted without approval => 403 and ZERO sends.
- Sync adapter offline -> failed adapter with diagnostic, never operational.
- Deploy to suspended host -> explicit error, no fabricated URL.
- UI shows independent RENT / SALE pipelines, original source timestamps, verified vs pending revenue, Arabic RTL/mobile and English LTR.
- Source-of-truth account scopes reviewed before any customer data access.
