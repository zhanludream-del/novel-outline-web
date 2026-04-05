# Fanqie Browser Search Service

This service keeps the browser-only search fallback online even when your local computer is off.

It is intended to be deployed on a server platform that can run Playwright, for example:

- Railway
- Render
- Fly.io
- A VPS or Docker host

## What it does

- Opens the Fanqie search page in a real browser
- Waits for the page to complete the browser-side verification flow
- Captures the successful `search_book` JSON response
- Returns raw `search_book_data_list` records to the main worker
- Persists browser session state so verification does not have to be repeated every request

## Endpoints

- `GET /health`
- `GET /search?keyword=生子&limit=10`

Example response:

```json
{
  "ok": true,
  "keyword": "生子",
  "source": "browser_network",
  "totalCount": 300,
  "rawBooks": [
    {
      "book_name": "...",
      "author": "...",
      "book_abstract": "...",
      "book_id": "7272217661927328808"
    }
  ],
  "challengeObserved": true,
  "needsVerification": false
}
```

## Environment variables

- `PORT=8789`
- `PLAYWRIGHT_HEADLESS=true`
- `FANQIE_ORIGIN=https://fanqienovel.com`
- `SEARCH_TIMEOUT_MS=25000`
- `MAX_RESULTS_LIMIT=20`
- `SEARCH_RELOAD_RETRY_COUNT=1`
- `STORAGE_STATE_PATH=./data/storage-state.json`

## Local run

```bash
cd browser-search-service
npm install
npm start
```

Then test:

```bash
curl "http://127.0.0.1:8789/search?keyword=%E7%94%9F%E5%AD%90&limit=5"
```

## Handling verification

Most of the time the browser-side token challenge completes automatically inside Playwright.

If Fanqie escalates to an interactive verification challenge:

1. Temporarily run the service with `PLAYWRIGHT_HEADLESS=false`.
2. Open the server environment once, complete the verification manually in that browser.
3. Let the service finish one successful search so it writes `STORAGE_STATE_PATH`.
4. Switch back to `PLAYWRIGHT_HEADLESS=true` for normal server use.

When the service detects a challenge but still cannot get book data, the JSON response will include:

- `challengeObserved: true`
- `needsVerification: true`

That tells the main worker this is a verification/session issue, not an ordinary empty-result search.

## Connect it to the main worker

After deploying this service, set:

```toml
[vars]
BROWSER_SEARCH_API_URL = "https://your-browser-service.example.com/search"
```

in:

- `worker/wrangler.toml`
- or the Cloudflare dashboard environment variables for `fanqie-rank-worker`

The main worker will only call this service when the direct Fanqie search API and the HTML-state fallback both fail.
