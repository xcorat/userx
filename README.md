# `userx`

Mobile-first SvelteKit + Svelte 5 web client for `araliya-net`, powered in-browser by [`araliya-net-wasm`](../araliya-net/crates/araliya-net-wasm).

---

## Architecture

`userx` enforces a strict layered client architecture:

```text
Components (Svelte 5) → Stores (*.svelte.ts) → Services (araliyaService, vault.storage) → $wasm (araliya_net_wasm)
```

- **`$wasm` Alias ([svelte.config.js](svelte.config.js)):** Resolves to `./vendor/araliya-net-wasm` (`vite.config.ts` excludes `$wasm` from `optimizeDeps`), vendoring the built `araliya-net-wasm` package inside the repository so standalone builds (including Cloudflare Workers Builds) succeed.
- **Service Layer ([src/lib/services/araliya.service.ts](src/lib/services/araliya.service.ts)):** Singleton `araliyaService` wrapping `AraliyaWasmApp` and `WasmEventPoller`. When an HTTP bootstrap URL/proxy is configured (`PUBLIC_RELAY_HTTP_URL`, defaulting to `/relay` only in `vite dev`), it checks `GET /status` (with optional `POST /genesis/vouch`); otherwise (including production builds without `PUBLIC_RELAY_HTTP_URL`), it connects directly over Iroh using `PUBLIC_RELAY_ENDPOINT_ID` (or a runtime override in `localStorage`) and verifies reachability with an anonymous `eventHeadSeq` probe. All identity, profile, encrypted private storage, Q&A, and event polling RPCs execute over signed Iroh QUIC/WSS streams inside WASM.
- **Reactive Stores:**
  - [src/lib/stores/session.svelte.ts](src/lib/stores/session.svelte.ts) (`sessionStore`): Relay status checks, account creation, password unlock, WebCrypto quick-unlock restoration, recovery-key import/export, `lock()` / `logout()` / `resetAccount()`, and onboarding state.
  - [src/lib/stores/ledger.svelte.ts](src/lib/stores/ledger.svelte.ts) (`ledgerStore`): Hydrates private profile fields (`getPrivateProfileFields`), private Q&A responses (`qnaListMyPrivateResponses`), and public questions (`qnaListQuestions` + `qnaGetResults`) into memory, saves profile fields/answer visibility toggles, and maintains live updates via `startPublicQnaPoller` (`WasmEventPoller`).
  - [src/lib/stores/theme.svelte.ts](src/lib/stores/theme.svelte.ts) (`themeStore`): Device-local UI theme state.

---

## Local Key Custody & WebCrypto Quick-Unlock

Vault persistence and browser-session quick-unlock live in [src/lib/services/vault.storage.ts](src/lib/services/vault.storage.ts):

- **Encrypted Vault (`localStorage['araliya_vault_v1']`):** Stores only the password-encrypted Ed25519 primary key vault (`PBKDF2-HMAC-SHA256` + `AES-256-GCM`) produced by `araliya-net-wasm`.
- **Same-Session Quick-Unlock:** Upon unlock/create/recover, `saveQuickUnlockSecret` wraps the 32-byte primary secret key using a **non-extractable AES-256-GCM `CryptoKey`** stored in IndexedDB (`araliya_userx_keys` → object store `session_keys`, key `araliya_session_key`) and writes only the `{ iv, ciphertext, pubkey }` token to `sessionStorage['araliya_session_token']`. On reload in the same browser session, `loadQuickUnlockSecretBytes()` unwraps the secret into WASM memory via `unlockWithSecretKeyBytes` and immediately zeroes the JS buffer (`fill(0)`).
- **Non-Sensitive UI State:** `localStorage['userx_ui_state_v1']` holds `{ onboardingStep, activeTab, pendingVouchToken }`, and `localStorage['userx_local_only_theme']` stores the local theme selection (never synced to relays).
- **Legacy Cleanup:** `purgeLegacyPlaintextStorage()` removes legacy plaintext keys (`userx_session_v1`, `userx_ledger_v1`) on startup.

---

## Running with `araliya-net-relay`

`araliya-net-relay` requires a root identity flag on startup (`--genesis`, `--dev`, `--root-pubkey`, or `--root-secret`).

### 1. Start the Relay (Browser WASM Mode)

Because web browsers cannot open raw UDP sockets, live browser-to-relay WASM QUIC/WSS traffic requires Iroh relay connectivity:

```bash
cd ../araliya-net

# Using default public Iroh relays + genesis onboarding + seeded onboarding questions:
cargo run -p araliya-net-relay -- \
  --genesis --ui --seed-qna ./seed-qna.json \
  --data-dir /tmp/araliya-genesis --http-addr 127.0.0.1:8080

# Or pin a self-hosted / local iroh-relay instead of public relays:
cargo run -p araliya-net-relay -- \
  --genesis --ui --iroh-relay-url http://127.0.0.1:3340 --seed-qna ./seed-qna.json \
  --data-dir /tmp/araliya-genesis --http-addr 127.0.0.1:8080
```

> **Note on `--local-only`:** `araliyaService.ensureConnected` propagates `local_only` from `GET /status` into `AraliyaWasmApp.connect({ relayPeer, relayUrls, localOnly, onlineTimeoutMs })`. When the relay is started with `--local-only`, `userx` sets `localOnly: true` (`RelayMode::Disabled`) so the browser never issues external Pkarr DNS lookups (`https://dns.iroh.link/...`). However, direct UDP sockets are unavailable in browsers, so `--local-only` relays cannot accept WASM QUIC connections; the login screen displays a warning banner in `--local-only` mode.

Example `seed-qna.json` (root onboarding questions omit `position`):

```json
[
  {
    "text": "Do you value local-first key custody?",
    "answers": ["Yes", "No"]
  },
  {
    "text": "Preferred workspace mode?",
    "answers": ["Solo", "Group", "Hybrid"],
    "multiple": false
  }
]
```

### 2. Rebuild WASM Package (when Rust workspace changes)

```bash
cd ../araliya-net
wasm-pack build crates/araliya-net-wasm --target web -- --offline

# Sync updated WASM build into userx/vendor/araliya-net-wasm
cd ../userx
pnpm run sync:wasm
```

### 3. Run, Check, Build, and Deploy `userx`

```bash
# Development server (Vite proxies /relay -> http://127.0.0.1:8080)
pnpm run dev

# SvelteKit sync + TypeScript / Svelte diagnostics
pnpm run check

# Production build (@sveltejs/adapter-cloudflare)
pnpm run build

# Preview production build
pnpm run preview

# Build and deploy to Cloudflare Workers (via wrangler.jsonc)
pnpm run deploy
```

*(If `$HOME/.config` is read-only when running `pnpm run build` or `pnpm run check` with `@sveltejs/adapter-cloudflare` / Wrangler, set `export WRANGLER_LOG_DIR=/tmp/wrangler-logs` or `XDG_CONFIG_HOME=/tmp`.)*

---

## Cloudflare Workers Deployment

- **Worker Config ([wrangler.jsonc](wrangler.jsonc)):** Targets `.svelte-kit/cloudflare/_worker.js` as `main`, enables `nodejs_compat`, sets `"keep_vars": true` (so Dashboard-configured runtime variables survive `wrangler deploy`), binds static assets (`ASSETS`) to `.svelte-kit/cloudflare`, and enables invocation/worker logs.
- **Vendored WASM (`vendor/araliya-net-wasm/`):** The compiled `araliya-net-wasm` artifacts are vendored in-repo so standalone Cloudflare Workers Builds succeed without checking out or building the sibling `araliya-net` Rust workspace. Whenever `araliya-net-wasm` changes, rebuild it and run `pnpm run sync:wasm` before committing.
- **Cloudflare Workers Builds Commands:**
  - Install: `pnpm install --frozen-lockfile`
  - Build: `pnpm run build`
  - Deploy: `npx wrangler deploy` (or locally `pnpm run deploy`)

### Production Environment Variables (see [.env.example](.env.example))

Configure these in **Cloudflare Dashboard → Workers & Pages → `userx` → Settings → Variables and Secrets** (Plaintext runtime variables, preserved across deploys by `"keep_vars": true` in [wrangler.jsonc](wrangler.jsonc)) — or in **Settings → Build → Variables and secrets**:

| Variable | Prod Status | Description / Value Source |
| :--- | :--- | :--- |
| `PUBLIC_RELAY_ENDPOINT_ID` | **Required** *(when `PUBLIC_RELAY_HTTP_URL` is unset)* | Relay Iroh `EndpointId` (or full `EndpointAddr` JSON, or comma-separated `EndpointId`s). Probed directly over Iroh WSS via `AraliyaWasmApp.connect` + anonymous `eventHeadSeq`. Can also be overridden per-browser in the login screen's **Configure Relay** drawer. |
| `PUBLIC_ROOT_PUBKEY` | **Recommended** | Relay 32-byte Ed25519 `root_pubkey` (64-char hex or base64url) from relay logs / `GET /status`, used to label genesis onboarding questions as `@genesis`. |
| `PUBLIC_RELAY_HTTP_URL` | **Optional** *(leave unset for now)* | Public HTTP relay URL/proxy. Takes precedence over `PUBLIC_RELAY_ENDPOINT_ID` when set (with automatic fallback to `PUBLIC_RELAY_ENDPOINT_ID` if HTTP fails). Defaults to `'/relay'` only in local `vite dev` and `''` in production. |
| `PUBLIC_RELAY_URLS` | **Optional** *(leave unset for default Iroh relays)* | Comma-separated custom Iroh/DERP relay URLs; only needed if `araliya-net-relay` was started with `--iroh-relay-url`. |

To inspect the values from a running local relay:

```bash
curl -s http://127.0.0.1:8080/status | jq '{endpoint_id, root_pubkey, dial_peer_address, relay_urls}'
```

### Manual Vouching Against a Local `--genesis` Relay (Direct Iroh Mode)

1. Start `araliya-net-relay --genesis --ui --seed-qna ./seed-qna.json --http-addr 127.0.0.1:8080` **without** `--local-only` so it connects outbound to an Iroh relay.
2. Set `PUBLIC_RELAY_ENDPOINT_ID` (and optionally `PUBLIC_ROOT_PUBKEY`) on Cloudflare — or paste `endpoint_id` into the login screen's **Configure Relay** drawer.
3. Open the deployed `userx` app, create a local vault, and copy your generated `pk` (`userPubkey`) — or click **Copy curl** on the post-creation card.
4. Mint a `VouchCard` locally against your localhost relay:
   ```bash
   curl -s -X POST http://127.0.0.1:8080/genesis/vouch \
     -H 'Content-Type: application/json' \
     -d '{"subject_pubkey":"<USER_PUBKEY>","ttl_secs":86400}'
   ```
5. Paste the returned `vouch_card_token` (`araliya-vouch-card:v1:...`) into `userx` and submit username registration (`registerWithVouchCard` over Iroh). *(If the relay runs with `--admission-policy open`, leave the vouch token blank.)*
