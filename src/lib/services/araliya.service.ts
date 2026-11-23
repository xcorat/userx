import { browser } from '$app/environment';
import { RELAY_BASE_URL } from '$lib/config/genesis.config';
import type {
	FieldVisibility,
	GeneratedKeypair,
	ProfileFieldKey,
	QuestionItem,
	QuestionOption,
	RecoveryPayload,
	RelayStatusInfo,
	UserIdentity
} from '$lib/types';
import type { AraliyaWasmApp, WasmEventPoller } from '$wasm/araliya_net_wasm';

type WasmModule = typeof import('$wasm/araliya_net_wasm');

interface WireQuestionDto {
	cid: number[];
	text: string | null;
	answers: string[] | null;
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

interface WireOnboardingStateRow {
	completed: boolean;
	step_cursor: string;
	updated_at_ms: number;
}

export interface WireUserRegistration {
	username: string;
	display_name: string;
	created_at_ms: number;
	updated_at_ms: number;
}

export interface QnaDomainEventHint {
	domain: string;
	channel: string;
	kind: string;
	resource_id: number[];
}

export interface QnaEventBatch {
	cursor: number;
	domain_events: QnaDomainEventHint[];
}

export function bytesToHex(bytes: number[] | Uint8Array): string {
	return Array.from(bytes, (b) => (b & 0xff).toString(16).padStart(2, '0')).join('');
}

function errorMessage(err: unknown, fallback: string): string {
	if (err instanceof Error) return err.message;
	if (typeof err === 'string' && err.trim().length > 0) return err;
	return fallback;
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
			})();
		}
		return this.wasmPromise;
	}

	async getRelayStatus(): Promise<RelayStatusInfo> {
		const res = await fetch(`${RELAY_BASE_URL}/status`);
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
			baseUrl: RELAY_BASE_URL,
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

	async requestGenesisVouch(subjectPubkey: string): Promise<string> {
		const res = await fetch(`${RELAY_BASE_URL}/genesis/vouch`, {
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
		const resolved = status ?? (await this.getRelayStatus());
		if (!resolved.connected) {
			throw new Error(resolved.error ?? 'Relay offline');
		}
		const targetPeer = resolved.dialPeerAddress || resolved.endpointId;
		if (!targetPeer) {
			throw new Error('Relay status did not provide a valid Iroh peer address');
		}
		if (this.app && this.connectedPeer === targetPeer) {
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

	async generateKeypair(): Promise<GeneratedKeypair> {
		const wasm = await this.ensureWasm();
		return wasm.generateKeypair() as GeneratedKeypair;
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

	async ensureRegisteredAndUpdateProfile(
		username: string,
		displayName: string,
		vouchToken?: string | null
	): Promise<{ usedVouch: boolean }> {
		const app = this.requireApp();
		const id = app.identity() as UserIdentity | null;
		if (!id) {
			throw new Error('Vault is locked');
		}
		const existing = await this.getUserByPubkey(id.userPubkey);
		if (existing) {
			await app.updateProfile(username, displayName);
			return { usedVouch: false };
		}
		const cleanedVouch = vouchToken?.trim();
		if (cleanedVouch) {
			await app.registerWithVouchCard(username, displayName, cleanedVouch);
			return { usedVouch: true };
		}
		await app.registerUser(username, displayName);
		return { usedVouch: false };
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
				ownerType: isGenesis ? 'genesis' : 'community',
				authorPubkeyHex,
				authorHandle: isGenesis ? '@genesis' : `@${authorPubkeyHex.slice(0, 8)}`,
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
		intervalMs = 3000
	): Promise<void> {
		const app = await this.ensureConnected();
		this.stopEventPoller();
		this.poller = (await app.startEventPoller(
			[{ Domain: { domain: 'qna', channel: 'pub' } }],
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
