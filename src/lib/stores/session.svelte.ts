import { browser } from '$app/environment';
import {
	clearManualRelayOverride,
	extractEndpointId,
	getConfiguredEndpointIds,
	getConfiguredRelayUrls,
	getConfiguredRootPubkey,
	getDefaultRelayHttpUrl,
	loadManualRelayOverride,
	parsePeerList,
	parseUrlList,
	saveManualRelayOverride
} from '$lib/config/genesis.config';
import { araliyaService } from '$lib/services/araliya.service';
import {
	clearQuickUnlockSession,
	deleteStoredVault,
	hasStoredVault,
	loadQuickUnlockSecretBytes,
	loadStoredVault,
	purgeLegacyPlaintextStorage,
	saveQuickUnlockSecret,
	saveStoredVault
} from '$lib/services/vault.storage';
import { ledgerStore } from '$lib/stores/ledger.svelte';
import type {
	AppTab,
	GeneratedKeypair,
	KeyCustodyMode,
	OnboardingStep,
	RelayStatusInfo,
	UserIdentity
} from '$lib/types';

const UI_STATE_KEY = 'userx_ui_state_v2';
const LEGACY_UI_STATE_KEY = 'userx_ui_state_v1';

const VALID_STEPS = new Set<OnboardingStep>([
	'unlock',
	'welcome',
	'network',
	'keypair',
	'vouch',
	'handle',
	'custody',
	'details',
	'demo-public',
	'demo-sponsored',
	'ask-first',
	'feed'
]);

const PRE_AUTH_STEPS = new Set<OnboardingStep>(['welcome', 'network', 'keypair']);
const POST_REGISTRATION_STEPS = new Set<OnboardingStep>([
	'custody',
	'details',
	'demo-public',
	'demo-sponsored',
	'ask-first'
]);
const PRE_REGISTRATION_STEPS = new Set<OnboardingStep>(['vouch', 'handle']);

interface PersistedUiState {
	onboardingStep: OnboardingStep;
	activeTab: AppTab;
	custodyMode: KeyCustodyMode;
	pendingVouchToken: string | null;
	pendingVouchInviter: string | null;
	vouchedByHandle: string | null;
	demoTokenBalance: number;
	firstQuestionCreditUsed: boolean;
}

function normalizeOnboardingStep(raw: unknown): OnboardingStep | null {
	if (typeof raw !== 'string') return null;
	const legacyMap: Record<string, OnboardingStep> = {
		login: 'unlock',
		manifesto: 'welcome',
		username: 'handle',
		identity: 'details',
		theme: 'details'
	};
	if (raw in legacyMap) return legacyMap[raw];
	return VALID_STEPS.has(raw as OnboardingStep) ? (raw as OnboardingStep) : null;
}

/**
 * Manages password-encrypted or manual local key custody, WebCrypto session quick-unlock,
 * relay connectivity, and the 10-screen onboarding/navigation state.
 */
class SessionStore {
	isInitialized = $state(false);
	isLoggedIn = $state(false);
	hasVault = $state(false);
	identity = $state<UserIdentity | null>(null);
	onboardingStep = $state<OnboardingStep>('welcome');
	activeTab = $state<AppTab>('feed');
	custodyMode = $state<KeyCustodyMode>('browser-encrypted');
	wantsUnlockScreen = $state(false);

	pendingDraftKeypair = $state<{ kp: GeneratedKeypair; recoveryKey: string } | null>(null);
	pendingVouchToken = $state<string | null>(null);
	pendingVouchInviter = $state<string | null>(null);
	vouchedByHandle = $state<string | null>(null);
	demoTokenBalance = $state(0);
	firstQuestionCreditUsed = $state(false);

	relayStatus = $state<RelayStatusInfo | null>(null);
	isConnectingRelay = $state(false);
	isAuthenticating = $state(false);

	constructor() {
		if (browser) {
			void this.initialize();
		} else {
			this.isInitialized = true;
		}
	}

	private async initialize(): Promise<void> {
		try {
			purgeLegacyPlaintextStorage();
			this.hasVault = hasStoredVault();
			this.restoreUiState();
			this.captureUrlInviteParams();

			const status = await this.refreshRelayStatus();
			if (status.connected) {
				const skBytes = await loadQuickUnlockSecretBytes();
				if (skBytes) {
					try {
						const identity = await araliyaService.unlockWithSecretKeyBytes(skBytes, status);
						await this.finishAuthenticatedUnlock(identity);
					} catch {
						await clearQuickUnlockSession();
					} finally {
						skBytes.fill(0);
					}
				}
			}

			if (!this.isLoggedIn) {
				this.onboardingStep = this.hasVault
					? 'unlock'
					: PRE_AUTH_STEPS.has(this.onboardingStep)
						? this.onboardingStep
						: 'welcome';
				this.persistUiState();
			}
		} finally {
			this.isInitialized = true;
		}
	}

	private restoreUiState(): void {
		if (!browser) return;
		try {
			const raw =
				localStorage.getItem(UI_STATE_KEY) ?? localStorage.getItem(LEGACY_UI_STATE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as Partial<PersistedUiState> & {
				onboardingStep?: unknown;
			};

			const mappedStep = normalizeOnboardingStep(parsed.onboardingStep);
			if (mappedStep) {
				this.onboardingStep = mappedStep;
			}
			if (parsed.activeTab === 'feed' || parsed.activeTab === 'dashboard') {
				this.activeTab = parsed.activeTab;
			}
			if (
				parsed.custodyMode === 'browser-encrypted' ||
				parsed.custodyMode === 'password-vault-wiped' ||
				parsed.custodyMode === 'manual-no-store'
			) {
				this.custodyMode = parsed.custodyMode;
			}
			if (typeof parsed.pendingVouchToken === 'string' && parsed.pendingVouchToken.trim()) {
				this.pendingVouchToken = parsed.pendingVouchToken.trim();
			}
			if (typeof parsed.pendingVouchInviter === 'string' && parsed.pendingVouchInviter.trim()) {
				this.pendingVouchInviter = parsed.pendingVouchInviter.trim();
			}
			if (typeof parsed.vouchedByHandle === 'string' && parsed.vouchedByHandle.trim()) {
				this.vouchedByHandle = parsed.vouchedByHandle.trim();
			}
			if (typeof parsed.demoTokenBalance === 'number' && Number.isFinite(parsed.demoTokenBalance)) {
				this.demoTokenBalance = Math.max(0, parsed.demoTokenBalance);
			}
			if (typeof parsed.firstQuestionCreditUsed === 'boolean') {
				this.firstQuestionCreditUsed = parsed.firstQuestionCreditUsed;
			}

			if (!localStorage.getItem(UI_STATE_KEY)) {
				this.persistUiState();
				localStorage.removeItem(LEGACY_UI_STATE_KEY);
			}
		} catch {
			// Ignore malformed UI state
		}
	}

	private captureUrlInviteParams(): void {
		if (!browser) return;
		try {
			const url = new URL(window.location.href);
			let vouch = url.searchParams.get('vouch')?.trim() ?? '';
			let inviter =
				url.searchParams.get('inviter')?.trim() ??
				url.searchParams.get('by')?.trim() ??
				'';
			let touched = false;

			if (vouch) {
				url.searchParams.delete('vouch');
				touched = true;
			}
			if (url.searchParams.has('inviter') || url.searchParams.has('by')) {
				url.searchParams.delete('inviter');
				url.searchParams.delete('by');
				touched = true;
			}

			if (!vouch && url.hash) {
				const rawHash = url.hash.replace(/^#/, '');
				if (rawHash.startsWith('araliya-vouch-card:v1:')) {
					vouch = rawHash;
					url.hash = '';
					touched = true;
				} else if (rawHash.includes('vouch=')) {
					const hashQuery = rawHash.startsWith('?') ? rawHash.slice(1) : rawHash;
					const hashParams = new URLSearchParams(hashQuery);
					const hashVouch = hashParams.get('vouch')?.trim() ?? '';
					if (hashVouch) {
						vouch = hashVouch;
						inviter =
							inviter ||
							hashParams.get('inviter')?.trim() ||
							hashParams.get('by')?.trim() ||
							'';
						hashParams.delete('vouch');
						hashParams.delete('inviter');
						hashParams.delete('by');
						const remaining = hashParams.toString();
						url.hash = remaining ? `#${remaining}` : '';
						touched = true;
					}
				}
			}

			if (vouch) {
				this.pendingVouchToken = vouch;
			}
			if (inviter) {
				this.pendingVouchInviter = inviter.replace(/^@+/, '');
			}
			if (touched) {
				this.persistUiState();
				const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
				window.history.replaceState({}, '', cleanUrl || '/');
			}
		} catch {
			// Ignore malformed URL invite parameters
		}
	}

	private persistUiState(): void {
		if (!browser) return;
		const payload: PersistedUiState = {
			onboardingStep: this.onboardingStep,
			activeTab: this.activeTab,
			custodyMode: this.custodyMode,
			pendingVouchToken: this.pendingVouchToken,
			pendingVouchInviter: this.pendingVouchInviter,
			vouchedByHandle: this.vouchedByHandle,
			demoTokenBalance: this.demoTokenBalance,
			firstQuestionCreditUsed: this.firstQuestionCreditUsed
		};
		localStorage.setItem(UI_STATE_KEY, JSON.stringify(payload));
	}

	private async ensureConnectedRelay(): Promise<RelayStatusInfo> {
		const status =
			this.relayStatus && this.relayStatus.connected
				? this.relayStatus
				: await this.refreshRelayStatus();
		if (!status.connected) {
			throw new Error(status.error ?? 'Relay is offline — cannot connect');
		}
		return status;
	}

	private async finishAuthenticatedUnlock(identity: UserIdentity): Promise<void> {
		this.identity = identity;
		const [onboardingResult, userResult] = await Promise.allSettled([
			araliyaService.getOnboardingState(),
			araliyaService.getUserByPubkey(identity.userPubkey)
		]);

		const onboardingState =
			onboardingResult.status === 'fulfilled' ? onboardingResult.value : null;
		const existingUser = userResult.status === 'fulfilled' ? userResult.value : null;
		const remoteCursor = normalizeOnboardingStep(onboardingState?.stepCursor);

		if (onboardingState?.completed) {
			this.onboardingStep = 'feed';
			this.pendingVouchToken = null;
		} else if (remoteCursor && remoteCursor !== 'unlock') {
			this.onboardingStep = remoteCursor;
		} else if (existingUser !== null) {
			this.onboardingStep = POST_REGISTRATION_STEPS.has(this.onboardingStep)
				? this.onboardingStep
				: 'feed';
			this.pendingVouchToken = null;
		} else {
			this.onboardingStep = PRE_REGISTRATION_STEPS.has(this.onboardingStep)
				? this.onboardingStep
				: 'vouch';
		}

		if (existingUser !== null) {
			this.pendingVouchToken = null;
		}

		this.isLoggedIn = true;
		this.wantsUnlockScreen = false;
		this.persistUiState();
		await ledgerStore.hydrateAfterUnlock(this.relayStatus?.rootPubkey ?? '');
	}

	async refreshRelayStatus(): Promise<RelayStatusInfo> {
		this.isConnectingRelay = true;
		try {
			const status = await araliyaService.resolveRelayStatus();
			this.relayStatus = status;
			return status;
		} catch (err) {
			const manual = loadManualRelayOverride();
			const envPeers = getConfiguredEndpointIds();
			const httpUrl = getDefaultRelayHttpUrl();
			const manualPeers = manual ? parsePeerList(manual.endpointId) : [];
			const fallbackPeer = manualPeers[0] ?? envPeers[0] ?? '';
			const fallbackSource =
				manualPeers.length > 0
					? 'iroh-manual'
					: envPeers.length > 0
						? 'iroh-env'
						: httpUrl
							? 'http'
							: 'none';
			const fallback: RelayStatusInfo = {
				connected: false,
				source: fallbackSource,
				httpAvailable: false,
				baseUrl: httpUrl,
				endpointId: fallbackPeer ? extractEndpointId(fallbackPeer) : '',
				dialPeerAddress: fallbackPeer,
				relayUrls: manual?.relayUrls.length ? manual.relayUrls : getConfiguredRelayUrls(),
				rootPubkey: manual?.rootPubkey || getConfiguredRootPubkey(),
				alpns: [],
				localOnly: false,
				devWriteEnabled: false,
				genesisMode: false,
				admissionPolicy: 'vouch',
				error: err instanceof Error ? err.message : 'Relay unreachable'
			};
			this.relayStatus = fallback;
			return fallback;
		} finally {
			this.isConnectingRelay = false;
		}
	}

	async setManualRelayOverride(
		endpointId: string,
		relayUrlsRaw = '',
		rootPubkey = ''
	): Promise<RelayStatusInfo> {
		const cleaned = endpointId.trim();
		if (!cleaned) {
			return await this.clearManualRelayOverride();
		}
		saveManualRelayOverride({
			endpointId: cleaned,
			relayUrls: parseUrlList(relayUrlsRaw),
			rootPubkey: rootPubkey.trim()
		});
		await araliyaService.resetConnection();
		return await this.refreshRelayStatus();
	}

	async clearManualRelayOverride(): Promise<RelayStatusInfo> {
		clearManualRelayOverride();
		await araliyaService.resetConnection();
		return await this.refreshRelayStatus();
	}

	openUnlockScreen(): void {
		this.wantsUnlockScreen = true;
		this.onboardingStep = 'unlock';
	}

	startFreshOnboarding(): void {
		this.wantsUnlockScreen = false;
		this.onboardingStep = 'welcome';
		this.persistUiState();
	}

	async ensureDraftKeypair(): Promise<{ kp: GeneratedKeypair; recoveryKey: string }> {
		if (this.pendingDraftKeypair) {
			return this.pendingDraftKeypair;
		}
		if (this.isLoggedIn && araliyaService.hasUnlockedWasmSession()) {
			const payload = await araliyaService.exportRecoveryPayload();
			const draft = {
				kp: {
					secretKey: payload.secretKey,
					publicKey: payload.publicKey,
					x25519Pubkey: this.identity?.x25519Pubkey ?? ''
				},
				recoveryKey: payload.recoveryKey
			};
			this.pendingDraftKeypair = draft;
			return draft;
		}
		const kp = await araliyaService.generateKeypair();
		const recoveryKey = await araliyaService.exportRecoveryKey(kp.secretKey);
		const draft = { kp, recoveryKey };
		this.pendingDraftKeypair = draft;
		return draft;
	}

	async regenerateDraftKeypair(): Promise<{ kp: GeneratedKeypair; recoveryKey: string }> {
		const kp = await araliyaService.generateKeypair();
		const recoveryKey = await araliyaService.exportRecoveryKey(kp.secretKey);
		const draft = { kp, recoveryKey };
		this.pendingDraftKeypair = draft;
		return draft;
	}

	private async installKeypairSession(
		kp: GeneratedKeypair,
		mode: KeyCustodyMode
	): Promise<void> {
		await saveQuickUnlockSecret(kp.secretKey, kp.publicKey);
		const status =
			this.relayStatus && this.relayStatus.connected
				? this.relayStatus
				: await this.refreshRelayStatus();

		if (status.connected) {
			const identity = await araliyaService.unlockWithSecretKey(kp.secretKey, status);
			this.identity = identity;
			await ledgerStore.hydrateAfterUnlock(status.rootPubkey ?? '');
		} else {
			this.identity = {
				userPubkey: kp.publicKey,
				x25519Pubkey: kp.x25519Pubkey,
				transportPeerId: ''
			};
		}

		this.custodyMode = mode;
		this.isLoggedIn = true;
		this.wantsUnlockScreen = false;
		this.onboardingStep = 'vouch';
		this.persistUiState();
	}

	async completeKeypairWithPassword(password: string): Promise<void> {
		if (password.length < 8) {
			throw new Error('Password must be at least 8 characters.');
		}
		this.isAuthenticating = true;
		try {
			const { kp } = await this.ensureDraftKeypair();
			const vaultJson = await araliyaService.createVaultJson(kp.secretKey, password);
			saveStoredVault(vaultJson);
			this.hasVault = true;
			await this.installKeypairSession(kp, 'browser-encrypted');
		} finally {
			this.isAuthenticating = false;
		}
	}

	async completeKeypairManually(): Promise<void> {
		this.isAuthenticating = true;
		try {
			const { kp } = await this.ensureDraftKeypair();
			deleteStoredVault();
			this.hasVault = false;
			await this.installKeypairSession(kp, 'manual-no-store');
		} finally {
			this.isAuthenticating = false;
		}
	}

	async ensureUnlockedOnRelay(): Promise<RelayStatusInfo> {
		const status = await this.ensureConnectedRelay();
		if (!araliyaService.hasUnlockedWasmSession()) {
			if (this.pendingDraftKeypair) {
				this.identity = await araliyaService.unlockWithSecretKey(
					this.pendingDraftKeypair.kp.secretKey,
					status
				);
			} else {
				const skBytes = await loadQuickUnlockSecretBytes();
				if (!skBytes) {
					throw new Error('Session secret unavailable — please unlock your key again.');
				}
				try {
					this.identity = await araliyaService.unlockWithSecretKeyBytes(skBytes, status);
				} finally {
					skBytes.fill(0);
				}
			}
		}
		return status;
	}

	async getExportableSecretAndRecovery(): Promise<{
		recoveryKey: string;
		publicKey: string;
		secretKey: string;
	}> {
		if (araliyaService.hasUnlockedWasmSession()) {
			return await araliyaService.exportRecoveryPayload();
		}
		if (this.pendingDraftKeypair) {
			return {
				recoveryKey: this.pendingDraftKeypair.recoveryKey,
				publicKey: this.pendingDraftKeypair.kp.publicKey,
				secretKey: this.pendingDraftKeypair.kp.secretKey
			};
		}
		const skBytes = await loadQuickUnlockSecretBytes();
		if (skBytes) {
			try {
				let binary = '';
				for (let i = 0; i < skBytes.length; i += 1) {
					binary += String.fromCharCode(skBytes[i]);
				}
				const secretKey = btoa(binary);
				const recoveryKey = await araliyaService.exportRecoveryKey(secretKey);
				const publicKey = await araliyaService.derivePublicKey(secretKey);
				return { recoveryKey, publicKey, secretKey };
			} finally {
				skBytes.fill(0);
			}
		}
		throw new Error('Unlock your session to export your private key.');
	}

	async applyCustodySelection(mode: KeyCustodyMode, newPassword?: string): Promise<void> {
		if (mode === 'browser-encrypted') {
			if (!this.hasVault) {
				const pwd = newPassword ?? '';
				if (pwd.length < 8) {
					throw new Error('Password must be at least 8 characters to encrypt in browser.');
				}
				const payload = await this.getExportableSecretAndRecovery();
				const vaultJson = await araliyaService.createVaultJson(payload.secretKey, pwd);
				saveStoredVault(vaultJson);
				this.hasVault = true;
			}
			this.custodyMode = 'browser-encrypted';
		} else {
			deleteStoredVault();
			this.hasVault = false;
			this.custodyMode = mode;
		}
		this.persistUiState();
	}

	async unlockWithPassword(password: string): Promise<void> {
		const vaultJson = loadStoredVault();
		if (!vaultJson) {
			throw new Error('No local encrypted vault found. Create an account or paste your key.');
		}
		if (!password) {
			throw new Error('Enter your vault password.');
		}
		this.isAuthenticating = true;
		try {
			const status = await this.ensureConnectedRelay();
			const identity = await araliyaService.unlockWithVault(vaultJson, password, status);
			const payload = await araliyaService.exportRecoveryPayload();
			await saveQuickUnlockSecret(payload.secretKey, identity.userPubkey);
			this.custodyMode = 'browser-encrypted';
			this.pendingDraftKeypair = null;
			await this.finishAuthenticatedUnlock(identity);
		} finally {
			this.isAuthenticating = false;
		}
	}

	async unlockWithKeyInput(
		rawKey: string,
		options: { saveVault: boolean; password?: string }
	): Promise<void> {
		const trimmed = rawKey.trim();
		if (!trimmed) {
			throw new Error('Paste your araliya-recovery:v1 key or base64 Ed25519 private key.');
		}
		if (options.saveVault && (options.password ?? '').length < 8) {
			throw new Error('Local vault password must be at least 8 characters.');
		}

		this.isAuthenticating = true;
		try {
			const status = await this.ensureConnectedRelay();
			let kp: GeneratedKeypair;
			if (trimmed.startsWith('araliya-recovery:')) {
				kp = await araliyaService.importRecoveryKey(trimmed);
			} else {
				const recovery = await araliyaService.exportRecoveryKey(trimmed);
				kp = await araliyaService.importRecoveryKey(recovery);
			}

			if (options.saveVault) {
				const vaultJson = await araliyaService.createVaultJson(
					kp.secretKey,
					options.password ?? ''
				);
				saveStoredVault(vaultJson);
				this.hasVault = true;
				this.custodyMode = 'browser-encrypted';
			} else {
				this.hasVault = hasStoredVault();
				this.custodyMode = 'manual-no-store';
			}

			const identity = await araliyaService.unlockWithSecretKey(kp.secretKey, status);
			await saveQuickUnlockSecret(kp.secretKey, identity.userPubkey);
			this.pendingDraftKeypair = null;
			await this.finishAuthenticatedUnlock(identity);
		} finally {
			this.isAuthenticating = false;
		}
	}

	async exportRecoveryKey(): Promise<string> {
		const payload = await this.getExportableSecretAndRecovery();
		return payload.recoveryKey;
	}

	setPendingVouchToken(token: string | null): void {
		this.pendingVouchToken = token?.trim() || null;
		this.persistUiState();
	}

	setVouchedByHandle(handle: string | null): void {
		this.vouchedByHandle = handle?.trim().replace(/^@+/, '') || null;
		this.persistUiState();
	}

	clearPendingVouch(): void {
		this.pendingVouchToken = null;
		this.pendingVouchInviter = null;
		this.persistUiState();
	}

	awardDemoTokens(amount: number): void {
		if (!Number.isFinite(amount) || amount <= 0) return;
		this.demoTokenBalance += amount;
		this.persistUiState();
	}

	markFirstQuestionCreditUsed(): void {
		this.firstQuestionCreditUsed = true;
		this.persistUiState();
	}

	setOnboardingStep(step: OnboardingStep): void {
		this.onboardingStep = step;
		this.persistUiState();
	}

	async advanceOnboardingStep(step: OnboardingStep): Promise<void> {
		await araliyaService.completeOnboardingStep(step, false).catch(() => {});
		this.setOnboardingStep(step);
	}

	async completeOnboarding(): Promise<void> {
		await araliyaService.completeOnboardingStep('feed', true).catch(() => {});
		this.onboardingStep = 'feed';
		this.activeTab = 'feed';
		this.pendingDraftKeypair = null;
		this.persistUiState();
		if (ledgerStore.questions.length === 0 && this.relayStatus?.connected) {
			await ledgerStore.hydrateAfterUnlock(this.relayStatus.rootPubkey ?? '');
		}
	}

	setActiveTab(tab: AppTab): void {
		this.activeTab = tab;
		this.persistUiState();
	}

	async lock(): Promise<void> {
		ledgerStore.clearInMemoryState();
		await araliyaService.lock().catch(() => {});
		await clearQuickUnlockSession();
		this.isLoggedIn = false;
		this.identity = null;
		this.pendingDraftKeypair = null;
		this.wantsUnlockScreen = true;
		this.onboardingStep = 'unlock';
		this.activeTab = 'feed';
		this.persistUiState();
	}

	async logout(): Promise<void> {
		await this.lock();
	}

	async resetAccount(): Promise<void> {
		await this.lock();
		deleteStoredVault();
		this.hasVault = false;
		this.wantsUnlockScreen = false;
		this.custodyMode = 'browser-encrypted';
		this.pendingVouchToken = null;
		this.pendingVouchInviter = null;
		this.vouchedByHandle = null;
		this.demoTokenBalance = 0;
		this.firstQuestionCreditUsed = false;
		this.onboardingStep = 'welcome';
		if (browser) {
			localStorage.removeItem(UI_STATE_KEY);
			localStorage.removeItem(LEGACY_UI_STATE_KEY);
		}
	}
}

export const sessionStore = new SessionStore();
