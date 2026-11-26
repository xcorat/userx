# `userx`

Mobile-first SvelteKit + Svelte 5 web client for `araliya-net`, powered in-browser by [`araliya-net-wasm`](../araliya-net/crates/araliya-net-wasm).

---

## Architecture

`userx` enforces a strict layered client architecture:

```text
Components (Svelte 5) → Stores (*.svelte.ts) → Services (araliyaService, vault.storage) → $wasm (araliya_net_wasm)
```

- **`$wasm` Alias ([svelte.config.js](svelte.config.js)):** Resolves to `./vendor/araliya-net-wasm` (`vite.config.ts` excludes `$wasm` from `optimizeDeps` and adds `./vendor` to `server.fs.allow` for `vite dev`), vendoring the built `araliya-net-wasm` package inside the repository so standalone builds (including Cloudflare Workers Builds) succeed.
- **Service Layer ([src/lib/services/araliya.service.ts](src/lib/services/araliya.service.ts)):** Singleton `araliyaService` wrapping `AraliyaWasmApp` and `WasmEventPoller`. When an HTTP bootstrap URL/proxy is configured (`PUBLIC_RELAY_HTTP_URL`, defaulting to `/relay` only in `vite dev`), it checks `GET /status` (with optional `POST /genesis/vouch`); otherwise (including production builds without `PUBLIC_RELAY_HTTP_URL`), it connects directly over Iroh using `PUBLIC_RELAY_ENDPOINT_ID` (or a runtime override in `localStorage`) and verifies reachability with an anonymous `eventHeadSeq` probe. Exposes `createPublicQuestion`, `inspectVouchToken` / `inspectVouchTokenAsync` (`decodeVouchCard`), `checkInitialVouch`, `registerWithSubmittedVouch`, `submitVouchRequest`, `submitVouchCard`, `issueVouchCard`, `listIncomingVouchRequests`, `listMyVouchRequests`, `dismissVouchRequest`, `sealLocalDraft` / `unsealLocalDraft`, `pubkeyToHex`, `pubkeyToBytes`, and resets cached WASM init promises on load errors. All identity, vouching, profile, encrypted private storage, Q&A, and event polling RPCs execute over signed Iroh QUIC/WSS streams inside WASM.
- **Reactive Stores:**
  - [src/lib/stores/session.svelte.ts](src/lib/stores/session.svelte.ts) (`sessionStore`): Relay status checks, URL `?vouch=` / `#vouch=` and peer invite `?voucher=` / `#voucher=` capture, `admissionStatus` tracking (`'admitted' | 'pending-vouch' | 'expired' | 'open' | 'unknown'`), 72-hour pending-vouch timer & tab-focus checks, real-time `VouchIssued` no-paste-back auto-completion (`checkAndAutoCompleteVouch`), incoming request management (`refreshIncomingVouchRequests`, `approveIncomingVouch`, `declineIncomingVouch`), 3 key custody modes (`'browser-encrypted'`, `'password-vault-wiped'`, `'manual-no-store'`), password unlock, WebCrypto quick-unlock restoration, recovery/secret-key unlock (`unlockWithKeyInput`), `lock()` / `logout()` / `resetAccount()`, and the onboarding + walkthrough token/credit state.
  - [src/lib/stores/ledger.svelte.ts](src/lib/stores/ledger.svelte.ts) (`ledgerStore`): Hydrates optional profile fields (`getPrivateProfileFields`), private Q&A responses (`qnaListMyPrivateResponses`), and public questions (`qnaListQuestions` + `qnaGetResults`) into memory, stages and flushes encrypted local onboarding drafts (`araliya_pending_draft_v1`) while waiting for a vouch, protects private `@username` selections via pseudonymous `gardener_<pk8>` relay directory registration, publishes new questions via `createQuestion`, and maintains live updates (including `{ User: pkBytes }` vouch events alongside `{ Domain: { domain: 'qna', channel: 'pub' } }`) via `startPublicQnaPoller` (`WasmEventPoller`).
  - [src/lib/stores/theme.svelte.ts](src/lib/stores/theme.svelte.ts) (`themeStore`): Device-local UI theme state defaulting to **Forest Dark** (`'forest'`, alongside `'obsidian'`, `'solaris'`, `'araliya'`, and `'monolith'`).

---

## Onboarding Flow (Scroll-Up Hero Intro + Setup Steps)

See [docs/plans/02-onboarding-flow.md](docs/plans/02-onboarding-flow.md) for the full state machine and component map:

- **Returning User Gate (`UnlockRecoverScreen`):** Shown automatically when a local vault exists (`araliya_vault_v1`), or via `"Unlock"` on the hero intro bar, supporting password unlock as well as pasting an `araliya-recovery:v1:...` or base64 Ed25519 key for session-only or password-saved unlock.
- **Full-Bleed Scroll-Up Hero Intro + Identity (`OnboardingHeroFlow`):** 3 vertical full-screen animated SVG hero slides (*Digital Commons*, *Peer-to-Peer Sovereignty*, and *Planting the Seeds*) driven by scroll/wheel, swipe-up, keyboard, or dot controls, stopping on Slide 4 (`KeypairCustodyScreen`, **Step 1 / 8**) for Ed25519 key generation with local password encryption or `"Store secret manually →"`.
- **Human Vouch & Profile Setup (`Steps 2–5`):** Captures `?vouch=` tokens or `?voucher=<alice_pubkey>` peer invite links (auto-submitting a 72-hour `VouchRequest` to the inviter on the relay), checks for already-submitted relay vouches (`checkInitialVouch`), auto-requests `--genesis` vouches over HTTP when no peer link is present, or lets users **Continue Onboarding While Waiting (72h)** (`HumanVouchScreen`), staging their `@handle` (`ClaimHandleScreen`) and optional details (`PersonalDetailsPreviewScreen`) encrypted locally until the vouch arrives, and displaying `PendingVouchBanner` (during read-only Feed browsing) or `VouchExpiredScreen` if the 72h window expires or is declined.
- **Interactive Q&A Walkthrough (`Steps 6–8`):** Public-question/private-answer demo (*"Pepsi or Coke?"*, `PublicQuestionDemoScreen`), local-only sponsored-question walkthrough (*"We don't need nukes."*, simulated demo-token state, `SponsoredQuestionDemoScreen`), and publishing the user's first real public question to the relay via `qnaCreateQuestion`. After publishing, Genesis asks whether the user would contribute (feedback, invest $5+, help develop, other, or no); a chosen response is saved privately through Q&A, not added to public tallies. The prompt can be skipped. Pending-vouch users can browse read-only from `AskFirstQuestionScreen`.
- **In-App Peer Invite & Vouch (`UserDashboard` → `Profile`):** Admitted members get a copyable `/?voucher=<pubkey>` onboarding link, a live **Pending Requests** queue (**Approve & Vouch** with `24h`/`72h`/`7d`/`None` validity, **Decline**, and copyable fallback `VouchCard` tokens/links), and a manual pubkey / offline `VouchCard` issuer.

---

## Local Key Custody & WebCrypto Quick-Unlock

Vault persistence and browser-session quick-unlock live in [src/lib/services/vault.storage.ts](src/lib/services/vault.storage.ts):

- **Encrypted Vault (`localStorage['araliya_vault_v1']`):** Stores the password-encrypted Ed25519 primary key vault (`PBKDF2-HMAC-SHA256` + `AES-256-GCM`) produced by `araliya-net-wasm`. Choosing **manual session-only custody** on Screen 3 or **wiping the vault** on Screen 6 omits/deletes `araliya_vault_v1` from `localStorage`.
- **Same-Session Quick-Unlock:** Upon unlock/create/recover (including manual-custody sessions), `saveQuickUnlockSecret` wraps the 32-byte primary secret key using a **non-extractable AES-256-GCM `CryptoKey`** stored in IndexedDB (`araliya_userx_keys` → object store `session_keys`, key `araliya_session_key`) and writes only the `{ iv, ciphertext, pubkey }` token to `sessionStorage['araliya_session_token']`. On reload in the same browser session, `loadQuickUnlockSecretBytes()` unwraps the secret into WASM memory via `unlockWithSecretKeyBytes` and immediately zeroes the JS buffer (`fill(0)`).
- **Encrypted Staged Draft (`localStorage['araliya_pending_draft_v1']`):** While a new user waits during the 72-hour pending-vouch window, their staged `@handle` and optional personal details are sealed on-device via WASM (`XChaCha20-Poly1305` `sealLocalDraft` / `unsealLocalDraft`) and automatically flushed to the relay & deleted once `VouchIssued` completes registration.
- **Non-Sensitive UI State:** `localStorage['userx_ui_state_v2']` (migrated automatically from `userx_ui_state_v1`) holds `{ onboardingStep, activeTab, custodyMode, pendingVouchToken, pendingVouchInviter, pendingVoucherPubkey, pendingVouchRequest, vouchedByHandle, demoTokenBalance, firstQuestionCreditUsed }`, and `localStorage['userx_local_only_theme']` stores the local theme selection (never synced to relays).
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
  --genesis --ui --seed-qna ./data/seed_qna.json \
  --data-dir /tmp/araliya-genesis --http-addr 127.0.0.1:8080

# Or pin a self-hosted / local iroh-relay instead of public relays:
cargo run -p araliya-net-relay -- \
  --genesis --ui --iroh-relay-url http://127.0.0.1:3340 --seed-qna ./data/seed_qna.json \
  --data-dir /tmp/araliya-genesis --http-addr 127.0.0.1:8080
```

> **Note on `--local-only`:** `araliyaService.ensureConnected` propagates `local_only` from `GET /status` into `AraliyaWasmApp.connect({ relayPeer, relayUrls, localOnly, onlineTimeoutMs })`. When the relay is started with `--local-only`, `userx` sets `localOnly: true` (`RelayMode::Disabled`) so the browser never issues external Pkarr DNS lookups (`https://dns.iroh.link/...`). However, direct UDP sockets are unavailable in browsers, so `--local-only` relays cannot accept WASM QUIC connections; the relay status header displays a warning banner in `--local-only` mode.

The single canonical onboarding manifest is [`../araliya-net/data/seed_qna.json`](../araliya-net/data/seed_qna.json). It contains Q&A content, response visibility, local demo presentation, and profile-field defaults. The relay publishes it as the public doc `onboarding/manifest-v1`; `userx` loads it over Iroh. Only entries marked `relay_seed: true` become public Q&A questions. “Pepsi or Coke?” is a public question with a private onboarding response. The sponsored question is a local-only walkthrough with simulated demo tokens, not a real sponsored question or payment.

Seeding is additive/idempotent, not a database reset: older seeded rows are not deleted or rewritten. In particular, a pre-existing sponsored-demo row remains in the relay, and the corrected single-choice Genesis follow-up has a new CID. Back up and use a deliberate reset/migration if you need to remove legacy rows.

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
| `PUBLIC_VOUCH_REQUEST_TTL_MS` | **Optional** *(defaults to 72h / `259200000`)* | Provisional pending-vouch waiting window duration in milliseconds (minimum `5000` ms when set, useful for testing expiry). |

To inspect the values from a running local relay:

```bash
curl -s http://127.0.0.1:8080/status | jq '{endpoint_id, root_pubkey, dial_peer_address, relay_urls}'
```

### Manual Vouching Against a Local `--genesis` Relay (Direct Iroh Mode)

1. From the `araliya-net` directory, start `araliya-net-relay --genesis --ui --seed-qna ./data/seed_qna.json --http-addr 127.0.0.1:8080` **without** `--local-only` so it connects outbound to an Iroh relay.
2. Set `PUBLIC_RELAY_ENDPOINT_ID` (and optionally `PUBLIC_ROOT_PUBKEY`) on Cloudflare — or click the **Settings** gear on the Step 1 (`Your Lock & Key`) or Step 2 (`Human Vouch`) card to configure a custom `EndpointId`.
3. Open `userx`, scroll through the 3 hero slides (or click **Skip intro →**) to Slide 4 (`KeypairCustodyScreen`) to generate your Ed25519 identity and choose password or manual key custody, then continue to Step 2 (`HumanVouchScreen`).
4. On Step 2, click **Send Vouch Request to Relay Maintainer** and **Copy curl** (or copy your `userPubkey`), then mint a `VouchCard` locally against your localhost relay:
   ```bash
   curl -s -X POST http://127.0.0.1:8080/genesis/vouch \
     -H 'Content-Type: application/json' \
     -d '{"subject_pubkey":"<USER_PUBKEY>","ttl_secs":86400}'
   ```
5. Paste the returned `vouch_card_token` (`araliya-vouch-card:v1:...`, or the full JSON response) into Step 2, click **Apply Vouch Token**, and claim your `@handle` on Step 3 (`registerWithVouchCard` over Iroh). *(If the relay runs with `--admission-policy open`, click **Open Relay · Enter the Network** without a vouch token.)*

### Peer-to-Peer Vouching (`?voucher=<pubkey>`)

1. An admitted user (**Alice**) opens **Dashboard → Profile → Invite & Vouch**, copies **Your Onboarding Link** (`https://<host>/?voucher=<ALICE_PUBKEY>`), and sends it to **Bob**.
2. **Bob** opens Alice's link, completes Step 1 (`KeypairCustodyScreen`), and arrives on Step 2 (`HumanVouchScreen`), which automatically submits a 72-hour `VouchRequest` to Alice on the relay (bypassing any `--genesis` auto-vouch).
3. Bob can click **Continue Onboarding While Waiting (72h)** to stage his handle/details locally (encrypted in `araliya_pending_draft_v1`) and browse the public Q&A feed read-only under `PendingVouchBanner`.
4. Alice sees Bob's request on her **Profile** tab and clicks **Approve & Vouch** (`submitVouchCard`, also yielding an optional fallback `araliya-vouch-card:v1:...` link/token).
5. Bob's app receives `EventKind::VouchIssued` over the unified `{ Domain, User }` `WasmEventPoller` (or on reload/tab-focus check), registers automatically via `registerWithSubmittedVouch`, flushes his staged profile fields, and unlocks full write access with zero paste-back. If the 72-hour window expires or Alice declines first, Bob is routed to `VouchExpiredScreen` with his vault and staged handle preserved.
