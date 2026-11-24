# `userx` WASM Client Implementation Architecture

**Status:** Implemented (MVP)  
**Target Workspace:** `/data/p2p/userx` (SvelteKit 2 + Svelte 5 + Vite)  
**Upstream Package:** `$wasm` (`./vendor/araliya-net-wasm`, synced from `../araliya-net/crates/araliya-net-wasm/pkg` via `pnpm run sync:wasm`, built from `araliya-net-core`, `araliya-net-user`, `araliya-net-qna` `[client]`, and `araliya-net-transport-iroh`)  
**Related Roadmap:** [05-qna-and-userx-mvp-integration.md](file:///data/p2p/araliya-net/docs/mvp_roadmap/05-qna-and-userx-mvp-integration.md)

---

## 1. Purpose & Ownership

`araliya-net` provides the protocol, zero-knowledge storage relay (`araliya-net-relay`), client cryptography/caching (`araliya-net-user`), Q&A client extensions (`araliya-net-qna`), and the unified `wasm-pack` ES module facade (`araliya-net-wasm`, exposing `AraliyaWasmApp`, `WasmEventPoller`, and vault/recovery helpers).

`userx` consumes that pre-built `$wasm` package directly through a layered frontend stack with zero duplicated cryptography and zero secret keys transmitted over HTTP:

```text
Svelte Components → Reactive Stores (*.svelte.ts) → Services (araliyaService, vault.storage) → $wasm (AraliyaWasmApp)
```

---

## 2. Implemented MVP Responsibilities

1. **Direct Iroh QUIC/WSS Transport & HTTP Bootstrap ([araliya.service.ts](file:///data/p2p/userx/src/lib/services/araliya.service.ts))**
   - Bootstraps relay discovery solely via `GET /relay/status` (and `POST /relay/genesis/vouch` during `--genesis` account creation). Legacy HTTP Q&A RPCs, `/debug/sign`, and `/public/doc/profile_public` writes have been removed.
   - Connects `AraliyaWasmApp.connect({ relayPeer, relayUrls, localOnly, onlineTimeoutMs: 5000 })` using `dialPeerAddress`, `relayUrls`, and `localOnly` from `/status`. Passing `localOnly: resolved.localOnly` ensures `--local-only` relays do not trigger external `dns.iroh.link` Pkarr DNS lookups from the browser.
   - Keeps the underlying pooled `Arc<IrohTransport>` alive across `unlock` / `lock` transitions.

2. **Local Key Custody & WebCrypto Quick-Unlock ([vault.storage.ts](file:///data/p2p/userx/src/lib/services/vault.storage.ts))**
   - Password-wraps the Ed25519 primary secret key in `araliya_vault_v1` (`PBKDF2-HMAC-SHA256` + `AES-256-GCM`) via WASM (`createKeyVault` / `unlockWithVault`), supports `araliya-recovery:v1:...` backup/recovery (`exportRecoveryKey` / `importRecoveryKey`), and purges legacy plaintext `userx_session_v1` / `userx_ledger_v1` keys.
   - Implements same-session reload quick-unlock by storing a non-extractable AES-256-GCM `CryptoKey` in IndexedDB (`araliya_userx_keys` / `araliya_session_key`) and the wrapped secret payload in `sessionStorage` (`araliya_session_token`), zeroing decrypted `Uint8Array` buffers immediately after WASM unlock.

3. **Profile, Onboarding & Public/Private Q&A ([session.svelte.ts](file:///data/p2p/userx/src/lib/stores/session.svelte.ts), [ledger.svelte.ts](file:///data/p2p/userx/src/lib/stores/ledger.svelte.ts))**
   - Handles `registerWithVouchCard` / `registerUser` / `updateProfile`, per-field encrypted/public visibility via `setProfileField` and `getPrivateProfileFields`, and onboarding state via `completeOnboardingStep` / `getOnboardingState`.
   - Loads public genesis & community questions via `qnaListQuestions` + `qnaGetResults`, persists toggleable answers via `qnaSetAnswerVisibility` (`UserPrivate` `qna_private_responses` + optional public vote mirror), hydrates saved answers via `qnaListMyPrivateResponses`, and streams live public Q&A updates via `startEventPoller` (`WasmEventPoller` on `{ Domain: { domain: 'qna', channel: 'pub' } }`).

4. **SvelteKit / Vite / Cloudflare Workers Configuration**
   - [svelte.config.js](file:///data/p2p/userx/svelte.config.js) maps `$wasm` to `./vendor/araliya-net-wasm` (vendored in-repo so standalone CI/Cloudflare builds succeed without a sibling `araliya-net` checkout) using `@sveltejs/adapter-cloudflare`.
   - [vite.config.ts](file:///data/p2p/userx/vite.config.ts) excludes `$wasm` from `optimizeDeps` and proxies `/relay/*` to `http://127.0.0.1:8080` during local development.
   - [src/routes/+layout.ts](file:///data/p2p/userx/src/routes/+layout.ts) sets `ssr = false`, and [src/app.d.ts](file:///data/p2p/userx/src/app.d.ts) provides Vite `?url` WASM import types.
   - [wrangler.jsonc](file:///data/p2p/userx/wrangler.jsonc) configures the Cloudflare Worker (`name: "userx"`, `main: ".svelte-kit/cloudflare/_worker.js"`, `compatibility_date: "2025-01-01"`, `nodejs_compat`, `ASSETS` static assets directory `.svelte-kit/cloudflare`, and observability logs); [package.json](file:///data/p2p/userx/package.json) provides `pnpm run sync:wasm` and `pnpm run deploy`.
