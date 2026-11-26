import { browser } from '$app/environment';
import {
	extractEndpointId,
	getConfiguredEndpointIds,
	getConfiguredRelayUrls,
	getConfiguredRootPubkey,
	getDefaultRelayHttpUrl,
	loadManualRelayOverride,
	parsePeerList
} from '$lib/config/genesis.config';
import type {
	DirectoryUser,
	FieldVisibility,
	GeneratedKeypair,
	IssuedVouchCard,
	ProfileFieldKey,
	PublicProfileField,
	QuestionItem,
	QuestionOption,
	RecoveryPayload,
	RelayStatusInfo,
	UserIdentity,
	VouchCertInfo,
	VouchInspection,
	VouchRequestItem
} from '$lib/types';
import {
	parseOnboardingManifest,
	type OnboardingManifest
} from '$lib/config/onboarding.manifest';
import type { AraliyaWasmApp, WasmEventPoller } from '$wasm/araliya_net_wasm';

type WasmModule = typeof import('$wasm/araliya_net_wasm');

const DEFAULT_ALPNS = [
	'/araliya/doc/1',
	'/araliya/blob/1',
	'/araliya/table/1',
	'/araliya/events/1'
];

const IROH_PROBE_TIMEOUT_MS = 10_000;

interface WireQuestionDto {
	cid: number[];
	text: string | null;
	answers: string[] | null;
	multiple: boolean;
	author_pubkey: number[];
	scope: 'Pub' | 'Prv' | { Group: { group_pubkey: number[]; namespace_id: string } };
	status: 'Published' | 'Redacted';
}

interface WireResultsDto {
	question_cid: number[];
	total_responses: number;
	counts: Array<[number[], number]>;
}

interface WirePrivateResponseRow {
	question_cid: number[];
	selected: number[][];
	visible_public: boolean;
	updated_at_ms: number;
}

interface WireProfileFieldRow {
	field_key: string;
	value_json: string;
	visibility: 'Public' | 'Private';
	updated_at_ms: number;
}

interface WirePublicProfileFieldRow {
	field_key: string;
	value_json: string;
	updated_at_ms: number;
}

interface WireOnboardingStateRow {
	completed: boolean;
	step_cursor: string;
	updated_at_ms: number;
}

export interface WireUserRegistration {
	user_pubkey?: number[] | Uint8Array | string;
	x25519_pubkey?: number[] | null;
	username: string;
	display_name: string;
	avatar_blob_cid?: number[] | null;
	created_at_ms: number;
	updated_at_ms: number;
}

export interface QnaDomainEventHint {
	domain: string;
	channel: string;
	kind: string;
	resource_id: number[];
}

export interface RelayEventItem {
	seq: number;
	topic: unknown;
	kind: Record<string, unknown>;
	ts_ms: number;
}

export interface QnaEventBatch {
	cursor: number;
	events?: RelayEventItem[];
	updated_users?: number[][];
	domain_events: QnaDomainEventHint[];
}

export function bytesToHex(bytes: number[] | Uint8Array): string {
	return Array.from(bytes, (b) => (b & 0xff).toString(16).padStart(2, '0')).join('');
}

export function pubkeyToBytes(pubkeyB64UrlOrHex: string): number[] {
	const hex = pubkeyToHex(pubkeyB64UrlOrHex);
	if (hex.length !== 64) return [];
	const out: number[] = [];
	for (let i = 0; i < 64; i += 2) {
		out.push(Number.parseInt(hex.slice(i, i + 2), 16));
	}
	return out;
}

/**
 * Normalize a 32-byte Ed25519 public key (base64url or hex) into lowercase 64-char hex.
 */
export function pubkeyToHex(pubkeyB64UrlOrHex: string): string {
	const trimmed = pubkeyB64UrlOrHex.trim();
	if (!trimmed) return '';
	if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
		return trimmed.toLowerCase();
	}
	try {
		const b64 = trimmed.replace(/-/g, '+').replace(/_/g, '/');
		const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
		const bin = atob(padded);
		const bytes = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i += 1) {
			bytes[i] = bin.charCodeAt(i);
		}
		return bytesToHex(bytes);
	} catch {
		return trimmed.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
	}
}

function wirePubkeyToHex(pk: number[] | Uint8Array | string | null | undefined): string {
	if (pk instanceof Uint8Array || Array.isArray(pk)) {
		return bytesToHex(pk);
	}
	if (typeof pk === 'string') {
		return pubkeyToHex(pk);
	}
	return '';
}

function mapWireUserToDirectoryUser(row: WireUserRegistration): DirectoryUser {
	return {
		userPubkeyHex: wirePubkeyToHex(row.user_pubkey),
		username: (row.username ?? '').trim(),
		displayName: (row.display_name ?? row.username ?? '').trim(),
		createdAtMs: Number(row.created_at_ms ?? 0),
		updatedAtMs: Number(row.updated_at_ms ?? 0)
	};
}

function errorMessage(err: unknown, fallback: string): string {
	if (err instanceof Error) return err.message;
	if (typeof err === 'string' && err.trim().length > 0) return err;
	return fallback;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | null = null;
	try {
		return await Promise.race([
			promise,
			new Promise<never>((_, reject) => {
				timer = setTimeout(() => reject(new Error(message)), ms);
			})
		]);
	} finally {
		if (timer !== null) {
			clearTimeout(timer);
		}
	}
}

function parseJsonStringValue(valueJson: string): string {
	try {
		const parsed = JSON.parse(valueJson);
		return typeof parsed === 'string' ? parsed : String(parsed ?? '');
	} catch {
		return valueJson;
	}
}

async function parseJsonSafe(res: Response): Promise<Record<string, unknown> | string | null> {
	const text = await res.text();
	if (!text) return null;
	try {
		return JSON.parse(text) as Record<string, unknown>;
	} catch {
		return text;
	}
}

class AraliyaService {
	private wasmPromise: Promise<WasmModule> | null = null;
	private app: AraliyaWasmApp | null = null;
	private connectedPeer: string | null = null;
	private connectedRelayUrlsKey = '';
	private activeStatus: RelayStatusInfo | null = null;
	private connectInFlight: Promise<AraliyaWasmApp> | null = null;
	private poller: WasmEventPoller | null = null;

	private async ensureWasm(): Promise<WasmModule> {
		if (!browser) {
			throw new Error('WASM is only available in the browser');
		}
		if (!this.wasmPromise) {
			this.wasmPromise = (async () => {
				const [mod, wasmUrlMod] = await Promise.all([
					import('$wasm/araliya_net_wasm.js'),
					import('$wasm/araliya_net_wasm_bg.wasm?url')
				]);
				await mod.default({ module_or_path: wasmUrlMod.default });
				return mod;
			})().catch((err) => {
				this.wasmPromise = null;
				throw err;
			});
		}
		return this.wasmPromise;
	}

	async resetConnection(): Promise<void> {
		this.stopEventPoller();
		this.activeStatus = null;
		this.connectedPeer = null;
		this.connectedRelayUrlsKey = '';
		if (this.app) {
			try {
				this.app.free();
			} catch {
				// Ignore stale free
			}
			this.app = null;
		}
	}

	private async fetchHttpRelayStatus(baseUrl: string): Promise<RelayStatusInfo> {
		const res = await fetch(`${baseUrl}/status`);
		if (!res.ok) {
			throw new Error(`Relay status HTTP ${res.status}`);
		}
		const data = (await res.json()) as Record<string, unknown>;

		// `/status` reports genesis mode directly. Do not probe `/genesis/status`:
		// that route only exists when the relay is started with `--genesis`, so
		// probing it always logs a spurious 404 in a normal (non-genesis) relay.
		const genesisMode = Boolean(data.genesis_mode);
		const endpointId = String(data.endpoint_id ?? '');

		return {
			connected: data.status === 'ok',
			source: 'http',
			httpAvailable: true,
			baseUrl,
			endpointId,
			dialPeerAddress: String(data.dial_peer_address ?? endpointId),
			relayUrls: Array.isArray(data.relay_urls) ? data.relay_urls.map(String) : [],
			rootPubkey: String(data.root_pubkey ?? ''),
			alpns: Array.isArray(data.alpns) ? data.alpns.map(String) : [],
			localOnly: Boolean(data.local_only),
			devWriteEnabled: Boolean(data.dev_write_enabled),
			genesisMode,
			admissionPolicy: String(data.admission_policy ?? 'vouch')
		};
	}

	private async probeIrohPeer(
		peer: string,
		relayUrls: string[],
		timeoutMs = IROH_PROBE_TIMEOUT_MS
	): Promise<AraliyaWasmApp> {
		const wasm = await this.ensureWasm();
		const urlsKey = relayUrls.join(',');

		if (this.app && this.connectedPeer === peer && this.connectedRelayUrlsKey === urlsKey) {
			const existing = this.app;
			try {
				await withTimeout(
					existing.eventHeadSeq([{ Domain: { domain: 'qna', channel: 'pub' } }]),
					timeoutMs,
					`Timed out reaching Iroh peer ${extractEndpointId(peer)}`
				);
				return existing;
			} catch (err) {
				this.stopEventPoller();
				if (this.app === existing) {
					this.app = null;
					this.connectedPeer = null;
					this.connectedRelayUrlsKey = '';
				}
				throw err;
			}
		}

		const candidate = (await wasm.AraliyaWasmApp.connect({
			relayPeer: peer,
			relayUrls: relayUrls.length > 0 ? relayUrls : undefined,
			localOnly: false,
			onlineTimeoutMs: 5000
		})) as AraliyaWasmApp;

		const probePromise = candidate.eventHeadSeq([{ Domain: { domain: 'qna', channel: 'pub' } }]);
		let installed = false;

		try {
			await withTimeout(
				probePromise,
				timeoutMs,
				`Timed out reaching Iroh peer ${extractEndpointId(peer)}`
			);

			this.stopEventPoller();
			if (this.app) {
				try {
					this.app.free();
				} catch {
					// Ignore stale free
				}
			}
			this.app = candidate;
			this.connectedPeer = peer;
			this.connectedRelayUrlsKey = urlsKey;
			installed = true;
			return candidate;
		} finally {
			if (!installed) {
				void probePromise.then(
					() => {
						try {
							candidate.free();
						} catch {
							// Ignore stale free
						}
					},
					() => {
						try {
							candidate.free();
						} catch {
							// Ignore stale free
						}
					}
				);
			}
		}
	}

	private async probeIrohPeerList(
		peers: string[],
		relayUrls: string[],
		rootPubkey: string,
		source: 'iroh-env' | 'iroh-manual'
	): Promise<RelayStatusInfo> {
		let lastErr: unknown = null;
		for (const peer of peers) {
			try {
				await this.probeIrohPeer(peer, relayUrls);
				const status: RelayStatusInfo = {
					connected: true,
					source,
					httpAvailable: false,
					baseUrl: '',
					endpointId: extractEndpointId(peer),
					dialPeerAddress: peer,
					relayUrls,
					rootPubkey,
					alpns: DEFAULT_ALPNS,
					localOnly: false,
					devWriteEnabled: false,
					genesisMode: false,
					admissionPolicy: 'vouch'
				};
				this.activeStatus = status;
				return status;
			} catch (err) {
				lastErr = err;
			}
		}

		const targetLabel = peers.length === 1 ? extractEndpointId(peers[0]) : `${peers.length} endpoints`;
		throw new Error(
			`Iroh relay unreachable (${targetLabel}): ${errorMessage(lastErr, 'connection failed')}`
		);
	}

	/**
	 * Resolve and check relay connectivity.
	 *
	 * Precedence:
	 * 1. Explicit manual peer-address override in localStorage (direct Iroh probe).
	 * 2. HTTP `/status` when `PUBLIC_RELAY_HTTP_URL` is configured (or `/relay` in Vite dev).
	 *    If HTTP fails and `PUBLIC_RELAY_ENDPOINT_ID` is also set, falls back to direct Iroh.
	 * 3. Direct Iroh probe using `PUBLIC_RELAY_ENDPOINT_ID`.
	 */
	async resolveRelayStatus(): Promise<RelayStatusInfo> {
		const envRelayUrls = getConfiguredRelayUrls();
		const envRootPubkey = getConfiguredRootPubkey();

		const manualOverride = loadManualRelayOverride();
		if (manualOverride) {
			const manualPeers = parsePeerList(manualOverride.endpointId);
			if (manualPeers.length > 0) {
				const relayUrls =
					manualOverride.relayUrls.length > 0 ? manualOverride.relayUrls : envRelayUrls;
				const rootPubkey = manualOverride.rootPubkey || envRootPubkey;
				return await this.probeIrohPeerList(
					manualPeers,
					relayUrls,
					rootPubkey,
					'iroh-manual'
				);
			}
		}

		const httpUrl = getDefaultRelayHttpUrl();
		const envPeers = getConfiguredEndpointIds();

		if (httpUrl) {
			try {
				const status = await this.fetchHttpRelayStatus(httpUrl);
				this.activeStatus = status;
				return status;
			} catch (httpErr) {
				if (envPeers.length === 0) {
					this.activeStatus = null;
					throw httpErr;
				}
			}
		}

		if (envPeers.length > 0) {
			return await this.probeIrohPeerList(envPeers, envRelayUrls, envRootPubkey, 'iroh-env');
		}

		this.activeStatus = null;
		return {
			connected: false,
			source: 'none',
			httpAvailable: false,
			baseUrl: httpUrl,
			endpointId: '',
			dialPeerAddress: '',
			relayUrls: envRelayUrls,
			rootPubkey: envRootPubkey,
			alpns: [],
			localOnly: false,
			devWriteEnabled: false,
			genesisMode: false,
			admissionPolicy: 'vouch',
			error: 'No relay configured (set PUBLIC_RELAY_ENDPOINT_ID or configure a peer address)'
		};
	}

	async requestGenesisVouch(subjectPubkey: string, baseUrl?: string): Promise<string> {
		const resolvedBaseUrl = (baseUrl ?? this.activeStatus?.baseUrl ?? getDefaultRelayHttpUrl()).replace(
			/\/+$/,
			''
		);
		if (!resolvedBaseUrl) {
			throw new Error(
				'HTTP genesis vouch endpoint is unavailable; mint a vouch card via local curl.'
			);
		}
		const res = await fetch(`${resolvedBaseUrl}/genesis/vouch`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ subject_pubkey: subjectPubkey, ttl_secs: 86400 })
		});
		if (!res.ok) {
			const errData = await parseJsonSafe(res);
			const msg =
				typeof errData === 'object' && errData !== null && 'message' in errData
					? String(errData.message)
					: `Genesis vouch failed (HTTP ${res.status})`;
			throw new Error(msg);
		}
		const data = (await res.json()) as { vouch_card_token?: string };
		if (!data.vouch_card_token) {
			throw new Error('Relay returned empty vouch_card_token');
		}
		return data.vouch_card_token;
	}

	async ensureConnected(status?: RelayStatusInfo): Promise<AraliyaWasmApp> {
		const resolved = status ?? this.activeStatus ?? (await this.resolveRelayStatus());
		if (!resolved.connected) {
			throw new Error(resolved.error ?? 'Relay offline');
		}
		const targetPeer = resolved.dialPeerAddress || resolved.endpointId;
		if (!targetPeer) {
			throw new Error('Relay status did not provide a valid Iroh peer address');
		}
		const urlsKey = resolved.relayUrls.join(',');
		if (this.app && this.connectedPeer === targetPeer && this.connectedRelayUrlsKey === urlsKey) {
			return this.app;
		}
		if (this.connectInFlight) {
			return this.connectInFlight;
		}

		this.connectInFlight = (async () => {
			const wasm = await this.ensureWasm();
			this.stopEventPoller();
			if (this.app) {
				try {
					this.app.free();
				} catch {
					// Ignore stale free
				}
				this.app = null;
				this.connectedPeer = null;
				this.connectedRelayUrlsKey = '';
			}
			try {
				const app = (await wasm.AraliyaWasmApp.connect({
					relayPeer: targetPeer,
					relayUrls: resolved.relayUrls.length > 0 ? resolved.relayUrls : undefined,
					localOnly: resolved.localOnly,
					onlineTimeoutMs: 5000
				})) as AraliyaWasmApp;
				this.app = app;
				this.connectedPeer = targetPeer;
				this.connectedRelayUrlsKey = urlsKey;
				return app;
			} catch (err) {
				const base = errorMessage(err, 'Failed to connect Iroh WASM client');
				if (resolved.localOnly) {
					throw new Error(
						`${base} (Relay is running with --local-only; browser WASM requires Iroh relay connectivity)`
					);
				}
				throw new Error(base);
			}
		})();

		try {
			return await this.connectInFlight;
		} finally {
			this.connectInFlight = null;
		}
	}

	private requireApp(): AraliyaWasmApp {
		if (!this.app) {
			throw new Error('Not connected to relay');
		}
		return this.app;
	}

	hasUnlockedWasmSession(): boolean {
		return Boolean(this.app?.identity());
	}

	async generateKeypair(): Promise<GeneratedKeypair> {
		const wasm = await this.ensureWasm();
		return wasm.generateKeypair() as GeneratedKeypair;
	}

	async derivePublicKey(secretKeyB64: string): Promise<string> {
		const wasm = await this.ensureWasm();
		return wasm.derivePublicKey(secretKeyB64);
	}

	inspectVouchToken(rawInput: string): VouchInspection {
		const trimmed = rawInput.trim();
		if (!trimmed) {
			return {
				validFormat: false,
				format: 'invalid',
				tokenOrJson: '',
				error: 'Paste a vouch token or JSON payload.'
			};
		}

		if (trimmed.startsWith('araliya-vouch-card:v1:')) {
			const body = trimmed.slice('araliya-vouch-card:v1:'.length);
			if (body.length < 32 || !/^[A-Za-z0-9_-]+=*$/.test(body)) {
				return {
					validFormat: false,
					format: 'invalid',
					tokenOrJson: trimmed,
					error: 'Malformed araliya-vouch-card:v1 token payload.'
				};
			}
			return {
				validFormat: true,
				format: 'token',
				tokenOrJson: trimmed
			};
		}

		if (trimmed.startsWith('{')) {
			try {
				const parsed = JSON.parse(trimmed) as Record<string, unknown>;
				const card =
					parsed.vouch_card && typeof parsed.vouch_card === 'object'
						? (parsed.vouch_card as Record<string, unknown>)
						: parsed;
				const cert =
					card.cert && typeof card.cert === 'object'
						? (card.cert as Record<string, unknown>)
						: null;
				if (!cert) {
					return {
						validFormat: false,
						format: 'invalid',
						tokenOrJson: trimmed,
						error: 'JSON does not contain a VouchCard cert object.'
					};
				}

				const extractPk = (val: unknown): string | undefined => {
					if (typeof val === 'string' && val.trim().length > 0) return val.trim();
					if (Array.isArray(val) && val.length === 32) {
						return bytesToHex(val as number[]);
					}
					return undefined;
				};

				const tokenFromEnvelope =
					typeof parsed.vouch_card_token === 'string' && parsed.vouch_card_token.trim()
						? parsed.vouch_card_token.trim()
						: JSON.stringify(card);

				return {
					validFormat: true,
					format: 'json',
					tokenOrJson: tokenFromEnvelope,
					subjectPubkey: extractPk(cert.subject_pk),
					voucherPubkey: extractPk(cert.voucher_pk),
					expiresAtMs:
						typeof cert.expires_at_ms === 'number' ? cert.expires_at_ms : null
				};
			} catch {
				return {
					validFormat: false,
					format: 'invalid',
					tokenOrJson: trimmed,
					error: 'Invalid VouchCard JSON.'
				};
			}
		}

		return {
			validFormat: false,
			format: 'invalid',
			tokenOrJson: trimmed,
			error: 'Expected araliya-vouch-card:v1:... token or VouchCard JSON.'
		};
	}

	async inspectVouchTokenAsync(rawInput: string): Promise<VouchInspection> {
		const trimmed = rawInput.trim();
		if (!trimmed) {
			return {
				validFormat: false,
				format: 'invalid',
				tokenOrJson: '',
				error: 'Paste a vouch token or JSON payload.'
			};
		}
		try {
			const wasm = await this.ensureWasm();
			const decoded = wasm.decodeVouchCard(trimmed) as {
				rootPubkey?: string | null;
				cert: VouchCertInfo;
			};
			return {
				validFormat: true,
				format: trimmed.startsWith('{') ? 'json' : 'token',
				tokenOrJson: trimmed,
				subjectPubkey: decoded.cert.subjectPubkey,
				voucherPubkey: decoded.cert.voucherPubkey,
				expiresAtMs: decoded.cert.expiresAtMs ?? null,
				isValid: decoded.cert.isValid,
				isExpired: decoded.cert.isExpired,
				role: decoded.cert.role,
				rootPubkey: decoded.rootPubkey ?? undefined
			};
		} catch (err) {
			return {
				validFormat: false,
				format: 'invalid',
				tokenOrJson: trimmed,
				error: errorMessage(err, 'Invalid vouch token or JSON.')
			};
		}
	}

	async createVaultJson(secretKeyB64: string, password: string): Promise<string> {
		const wasm = await this.ensureWasm();
		return JSON.stringify(wasm.createKeyVault(secretKeyB64, password));
	}

	async importRecoveryKey(recoveryKey: string): Promise<GeneratedKeypair> {
		const wasm = await this.ensureWasm();
		return wasm.importRecoveryKey(recoveryKey) as GeneratedKeypair;
	}

	async exportRecoveryKey(secretKeyB64: string): Promise<string> {
		const wasm = await this.ensureWasm();
		return wasm.exportRecoveryKey(secretKeyB64);
	}

	async answerLeafHex(answerText: string): Promise<string> {
		const wasm = await this.ensureWasm();
		return wasm.answerLeafHex(answerText);
	}

	async unlockWithVault(
		vaultJson: string,
		password: string,
		status?: RelayStatusInfo
	): Promise<UserIdentity> {
		const app = await this.ensureConnected(status);
		return (await app.unlockWithVault(vaultJson, password)) as UserIdentity;
	}

	async unlockWithSecretKey(
		secretKeyB64: string,
		status?: RelayStatusInfo
	): Promise<UserIdentity> {
		const app = await this.ensureConnected(status);
		return (await app.unlockWithSecretKey(secretKeyB64)) as UserIdentity;
	}

	async unlockWithSecretKeyBytes(
		secretBytes: Uint8Array,
		status?: RelayStatusInfo
	): Promise<UserIdentity> {
		const app = await this.ensureConnected(status);
		return (await app.unlockWithSecretKeyBytes(secretBytes)) as UserIdentity;
	}

	async exportRecoveryPayload(): Promise<RecoveryPayload> {
		return (await this.requireApp().exportRecoveryPayload()) as RecoveryPayload;
	}

	async lock(): Promise<void> {
		this.stopEventPoller();
		if (!this.app) return;
		await this.app.lock();
	}

	async getUserByPubkey(pubkey: string): Promise<WireUserRegistration | null> {
		const res = (await this.requireApp().getUserByPubkey(pubkey)) as WireUserRegistration | null;
		return res ?? null;
	}

	async getUserByUsername(username: string): Promise<WireUserRegistration | null> {
		const res = (await this.requireApp().getUserByUsername(
			username
		)) as WireUserRegistration | null;
		return res ?? null;
	}

	async listUsers(
		limit = 50,
		cursor: string | null = null
	): Promise<{ items: DirectoryUser[]; nextCursor: string | null }> {
		const app = await this.ensureConnected();
		const res = (await app.listUsers(limit, cursor ?? null)) as {
			items?: WireUserRegistration[];
			nextCursor?: string | null;
		};
		return {
			items: (res?.items ?? []).map(mapWireUserToDirectoryUser),
			nextCursor: res?.nextCursor ?? null
		};
	}

	async lookupDirectoryUserByUsername(username: string): Promise<DirectoryUser | null> {
		const cleaned = username.trim().replace(/^@+/, '');
		if (!cleaned) return null;
		const app = await this.ensureConnected();
		const res = (await app.getUserByUsername(cleaned)) as WireUserRegistration | null;
		return res ? mapWireUserToDirectoryUser(res) : null;
	}

	async getPublicProfileFields(userPubkey: string): Promise<PublicProfileField[]> {
		const app = await this.ensureConnected();
		const rows = (await app.getPublicProfileFields(
			userPubkey
		)) as WirePublicProfileFieldRow[];
		return (rows ?? []).map((row) => ({
			key: row.field_key,
			value: parseJsonStringValue(row.value_json),
			updatedAt: new Date(row.updated_at_ms).toISOString()
		}));
	}

	async checkInitialVouch(): Promise<VouchCertInfo | null> {
		const res = (await this.requireApp().checkInitialVouch()) as VouchCertInfo | null;
		return res ?? null;
	}

	async registerWithSubmittedVouch(
		username: string,
		displayName: string
	): Promise<{ user: WireUserRegistration; vouch: VouchCertInfo }> {
		return (await this.requireApp().registerWithSubmittedVouch(username, displayName)) as {
			user: WireUserRegistration;
			vouch: VouchCertInfo;
		};
	}

	async issueVouchCard(
		subjectPubkey: string,
		role: string,
		rootPubkey?: string | null,
		relayEndpointId?: string | null,
		relayPeerAddress?: string | null,
		expiresAtMs?: number | null
	): Promise<IssuedVouchCard> {
		return (await this.requireApp().issueVouchCard(
			subjectPubkey,
			role,
			rootPubkey?.trim() ? rootPubkey.trim() : null,
			relayEndpointId ?? null,
			relayPeerAddress ?? null,
			expiresAtMs ?? null
		)) as IssuedVouchCard;
	}

	async submitVouchCard(
		subjectPubkey: string,
		role: string,
		rootPubkey?: string | null,
		relayEndpointId?: string | null,
		relayPeerAddress?: string | null,
		expiresAtMs?: number | null
	): Promise<IssuedVouchCard> {
		return (await this.requireApp().submitVouchCard(
			subjectPubkey,
			role,
			rootPubkey?.trim() ? rootPubkey.trim() : null,
			relayEndpointId ?? null,
			relayPeerAddress ?? null,
			expiresAtMs ?? null
		)) as IssuedVouchCard;
	}

	async submitVouchRequest(
		voucherPubkey: string,
		requestedHandle: string | null,
		expiresAtMs: number
	): Promise<VouchRequestItem> {
		return (await this.requireApp().submitVouchRequest(
			voucherPubkey,
			requestedHandle,
			expiresAtMs
		)) as VouchRequestItem;
	}

	async listIncomingVouchRequests(): Promise<VouchRequestItem[]> {
		return (await this.requireApp().listIncomingVouchRequests()) as VouchRequestItem[];
	}

	async listMyVouchRequests(): Promise<VouchRequestItem[]> {
		return (await this.requireApp().listMyVouchRequests()) as VouchRequestItem[];
	}

	async dismissVouchRequest(subjectPubkey: string): Promise<VouchRequestItem> {
		return (await this.requireApp().dismissVouchRequest(subjectPubkey)) as VouchRequestItem;
	}

	async sealLocalDraft(plaintextJson: string): Promise<string> {
		return await this.requireApp().sealLocalDraft(plaintextJson);
	}

	async unsealLocalDraft(sealedB64: string): Promise<string> {
		return await this.requireApp().unsealLocalDraft(sealedB64);
	}

	async ensureRegisteredAndUpdateProfile(
		username: string,
		displayName: string,
		vouchToken?: string | null,
		useSubmittedVouch = false
	): Promise<{ usedVouch: boolean; usedSubmittedVouch: boolean }> {
		const app = this.requireApp();
		const id = app.identity() as UserIdentity | null;
		if (!id) {
			throw new Error('Vault is locked');
		}
		const existing = await this.getUserByPubkey(id.userPubkey);
		if (existing) {
			await app.updateProfile(username, displayName);
			return { usedVouch: false, usedSubmittedVouch: false };
		}
		const cleanedVouch = vouchToken?.trim();
		if (cleanedVouch) {
			await app.registerWithVouchCard(username, displayName, cleanedVouch);
			return { usedVouch: true, usedSubmittedVouch: false };
		}
		if (useSubmittedVouch) {
			await app.registerWithSubmittedVouch(username, displayName);
			return { usedVouch: true, usedSubmittedVouch: true };
		}
		await app.registerUser(username, displayName);
		return { usedVouch: false, usedSubmittedVouch: false };
	}

	async setProfileField(
		fieldKey: ProfileFieldKey,
		value: string,
		isPublic: boolean
	): Promise<void> {
		await this.requireApp().setProfileField(fieldKey, JSON.stringify(value), isPublic);
	}

	async getPrivateProfileFields(): Promise<
		Array<{ key: string; value: string; visibility: FieldVisibility; updatedAt: string }>
	> {
		const rows = (await this.requireApp().getPrivateProfileFields()) as WireProfileFieldRow[];
		return (rows ?? []).map((row) => ({
			key: row.field_key,
			value: parseJsonStringValue(row.value_json),
			visibility: row.visibility === 'Public' ? 'public' : 'private',
			updatedAt: new Date(row.updated_at_ms).toISOString()
		}));
	}

	async getOnboardingState(): Promise<{ completed: boolean; stepCursor: string } | null> {
		const row = (await this.requireApp().getOnboardingState()) as WireOnboardingStateRow | null;
		if (!row) return null;
		return {
			completed: Boolean(row.completed),
			stepCursor: row.step_cursor
		};
	}

	async getOnboardingManifest(status?: RelayStatusInfo): Promise<OnboardingManifest> {
		const app = await this.ensureConnected(status);
		const raw = (await app.getPublicDoc(
			'onboarding',
			new TextEncoder().encode('manifest-v1')
		)) as Uint8Array | null;
		if (!raw?.length) {
			throw new Error(
				'Onboarding content is missing from this relay. The relay maintainer must start it with the onboarding seed manifest.'
			);
		}
		let parsed: unknown;
		try {
			parsed = JSON.parse(new TextDecoder().decode(raw));
		} catch {
			throw new Error('Relay onboarding manifest is not valid JSON');
		}
		return parseOnboardingManifest(parsed);
	}

	async completeOnboardingStep(stepCursor: string, completed: boolean): Promise<void> {
		await this.requireApp().completeOnboardingStep(stepCursor, null, completed);
	}

	async listPublicQuestions(rootPubkeyHex: string): Promise<QuestionItem[]> {
		const app = await this.ensureConnected();
		const wasm = await this.ensureWasm();
		const res = (await app.qnaListQuestions({ scope: 'pub', limit: 50 })) as {
			items?: WireQuestionDto[];
		};
		const rawItems = res?.items ?? [];
		const normalizedRoot = rootPubkeyHex.trim().toLowerCase();

		const mapped: QuestionItem[] = [];
		for (const q of rawItems) {
			if (q.status === 'Redacted' || !q.text || !Array.isArray(q.answers)) continue;

			const cid = bytesToHex(q.cid);
			const authorPubkeyHex = bytesToHex(q.author_pubkey ?? []);
			const isGenesis =
				normalizedRoot.length > 0 && authorPubkeyHex.toLowerCase() === normalizedRoot;

			const options: QuestionOption[] = q.answers.map((ansText, idx) => ({
				id: `opt_${idx}`,
				text: String(ansText),
				leafHex: wasm.answerLeafHex(String(ansText))
			}));

			mapped.push({
				cid,
				text: q.text,
				options,
				multiple: q.multiple,
				ownerType: isGenesis ? 'genesis' : 'community',
				authorPubkeyHex,
				authorHandle: isGenesis ? '@araliya' : `@${authorPubkeyHex.slice(0, 8)}`,
				scope: 'pub',
				defaultPublic: true,
				communityCounts: {}
			});
		}

		const countResults = await Promise.allSettled(
			mapped.map((q) => this.getQuestionResults(q.cid, q.options))
		);
		countResults.forEach((result, idx) => {
			if (result.status === 'fulfilled') {
				mapped[idx].communityCounts = result.value;
			}
		});

		mapped.sort((a, b) => {
			if (a.ownerType === b.ownerType) return 0;
			return a.ownerType === 'genesis' ? -1 : 1;
		});
		return mapped;
	}

	async getQuestionResults(
		cidHex: string,
		options: QuestionOption[]
	): Promise<Record<string, number>> {
		const app = await this.ensureConnected();
		const dto = (await app.qnaGetResults(cidHex)) as WireResultsDto;
		const counts: Record<string, number> = {};
		for (const [leafBytes, count] of dto?.counts ?? []) {
			const leafHex = bytesToHex(leafBytes);
			const matched = options.find((o) => o.leafHex === leafHex);
			if (matched) {
				counts[matched.id] = Number(count) || 0;
			}
		}
		return counts;
	}

	async setAnswerVisibility(
		questionCidHex: string,
		leafHex: string,
		isPublic: boolean
	): Promise<void> {
		await this.requireApp().qnaSetAnswerVisibility(questionCidHex, [leafHex], isPublic);
	}

	async createPublicQuestion(
		text: string,
		answers: string[]
	): Promise<{ cid: string; created: boolean }> {
		const res = (await this.requireApp().qnaCreateQuestion({
			text: text.trim(),
			answers: answers.map((a) => a.trim()),
			multiple: false,
			scope: 'pub'
		})) as { item?: { cid?: number[] | string }; created?: boolean };

		const rawCid = res?.item?.cid;
		const cid =
			typeof rawCid === 'string'
				? rawCid
				: Array.isArray(rawCid)
					? bytesToHex(rawCid)
					: '';
		return {
			cid,
			created: Boolean(res?.created)
		};
	}

	async listMyPrivateResponses(): Promise<
		Array<{
			questionCid: string;
			selectedLeafHex: string;
			visibility: FieldVisibility;
			answeredAt: string;
		}>
	> {
		const rows =
			(await this.requireApp().qnaListMyPrivateResponses()) as WirePrivateResponseRow[];
		const out: Array<{
			questionCid: string;
			selectedLeafHex: string;
			visibility: FieldVisibility;
			answeredAt: string;
		}> = [];
		for (const row of rows ?? []) {
			const firstSelected = row.selected?.[0];
			if (!firstSelected) continue;
			out.push({
				questionCid: bytesToHex(row.question_cid),
				selectedLeafHex: bytesToHex(firstSelected),
				visibility: row.visible_public ? 'public' : 'private',
				answeredAt: new Date(row.updated_at_ms).toISOString()
			});
		}
		return out;
	}

	async startPublicQnaPoller(
		onBatch: (batch: QnaEventBatch) => void,
		onError?: (err: string) => void,
		intervalMs = 3000,
		userPubkey?: string
	): Promise<void> {
		const app = await this.ensureConnected();
		this.stopEventPoller();
		const topics: Array<Record<string, unknown>> = [{ Domain: { domain: 'qna', channel: 'pub' } }];
		if (userPubkey) {
			const bytes = pubkeyToBytes(userPubkey);
			if (bytes.length === 32) {
				topics.push({ User: bytes });
			}
		}
		this.poller = (await app.startEventPoller(
			topics,
			intervalMs,
			onBatch,
			onError ?? null
		)) as WasmEventPoller;
	}

	stopEventPoller(): void {
		if (!this.poller) return;
		try {
			this.poller.stop();
			this.poller.free();
		} catch {
			// Ignore already-freed poller
		} finally {
			this.poller = null;
		}
	}
}

export const araliyaService = new AraliyaService();
