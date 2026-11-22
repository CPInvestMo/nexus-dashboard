# NAEL Command Center — Railway-ready public-safe PWA

This branch contains only the static NAEL mobile dashboard shell. It does **not** include live customer data, a backend, the Cloudflare Worker, D1 migrations, or WhatsApp integration.

## Deploy on Railway

Create a Railway service using repo `CPInvestMo/nexus-dashboard` and branch `nael-railway-ready`. The repository root contains `index.html`, which Railpack recognizes as a static website. Generate a public Railway domain once a successful deployment is confirmed.

This app displays operational navigation and can optionally connect to a user's own authorized Google Sheets OAuth credentials within their browser. Do not report the site as a complete private production system before its real integrations and access control are implemented.
