# `userx`

Mobile-first SvelteKit + Svelte 5 web client for `araliya-net`, powered in-browser by [`araliya-net-wasm`](../araliya-net/crates/araliya-net-wasm).

---

## Architecture

`userx` enforces a strict layered client architecture:

```text
Components (Svelte 5) → Stores (*.svelte.ts) → Services (araliyaService, vault.storage) → $wasm (araliya_net_wasm)
```

- **`$wasm` Alias ([svelte.config.js](svelte.config.js)):** Resolves directly to `../araliya-net/crates/araliya-net-wasm/pkg` (`vite.config.ts` excludes `$wasm` from `optimizeDeps` and allows parent-directory reads via `server.fs.allow: ['..']`).
- **Service Layer ([src/lib/services/araliya.service.ts](src/lib/services/araliya.service.ts)):** Singleton `araliyaService` wrapping `AraliyaWasmApp` and `WasmEventPoller`. Only HTTP bootstrap calls (`GET /status` and `POST /genesis/vouch` via `RELAY_BASE_URL = '/relay'`) use `fetch`; all identity, profile, encrypted private storage, Q&A, and event polling RPCs execute over signed Iroh QUIC/WSS streams inside WASM.
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
```

### 3. Run, Check, and Build `userx`

```bash
# Development server (Vite proxies /relay -> http://127.0.0.1:8080)
npm run dev

# SvelteKit sync + TypeScript / Svelte diagnostics
npm run check

# Production build (@sveltejs/adapter-cloudflare)
npm run build

# Preview production build
npm run preview
```

*(If `$HOME/.config` is read-only when running `npm run build` or `npm run check` with `@sveltejs/adapter-cloudflare` / Wrangler, set `export WRANGLER_LOG_DIR=/tmp/wrangler-logs` or `XDG_CONFIG_HOME=/tmp`.)*
