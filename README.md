# Better Proposals to Zapier Integration

Monitors 18 Better Proposals accounts for sent, signed, and paid proposals and triggers Zapier webhooks.

## Endpoints

- /api/check-sent - Checks for newly sent proposals
- /api/check-signed - Checks for newly signed proposals
- /api/check-paid - Checks for newly paid proposals

## Environment Variables

| Variable | Description |
|----------|-------------|
| UPSTASH_REDIS_REST_URL | From Upstash Console |
| UPSTASH_REDIS_REST_TOKEN | From Upstash Console |
| ZAPIER_WEBHOOK_SENT | Zapier Catch Hook URL for sent |
| ZAPIER_WEBHOOK_SIGNED | Zapier Catch Hook URL for signed |
| ZAPIER_WEBHOOK_PAID | Zapier Catch Hook URL for paid |
| BP_API_KEYS | Comma-separated API keys (18) |
| BP_SENDER_EMAILS | Comma-separated sender emails (18) |
| BP_SENDER_NAMES | Comma-separated sender names (18) |
| CRON_SECRET | Secret to protect endpoints |

## Cron Setup (cron-job.org)

Create 3 cron jobs running every 5 minutes with header Authorization: Bearer YOUR_CRON_SECRET
