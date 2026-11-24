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
	OnboardingStep,
	RelayStatusInfo,
	UserIdentity
} from '$lib/types';

const UI_STATE_KEY = 'userx_ui_state_v1';

interface PersistedUiState {
	onboardingStep: OnboardingStep;
	activeTab: AppTab;
	pendingVouchToken: string | null;
}

/**
 * Manages password-encrypted local key custody, WebCrypto session quick-unlock,
 * relay connectivity, and onboarding/navigation state.
 */
class SessionStore {
	isInitialized = $state(false);
	isLoggedIn = $state(false);
	hasVault = $state(false);
	identity = $state<UserIdentity | null>(null);
	onboardingStep = $state<OnboardingStep>('login');
	activeTab = $state<AppTab>('feed');
	pendingVouchToken = $state<string | null>(null);
	newlyCreatedRecoveryKey = $state<string | null>(null);

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

			const status = await this.refreshRelayStatus();
			if (this.hasVault && status.connected) {
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
		} finally {
			this.isInitialized = true;
		}
	}

	private restoreUiState(): void {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(UI_STATE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as Partial<PersistedUiState>;
			if (parsed.onboardingStep) {
				this.onboardingStep = parsed.onboardingStep;
			}
			if (parsed.activeTab) {
				this.activeTab = parsed.activeTab;
			}
			if (typeof parsed.pendingVouchToken === 'string' && parsed.pendingVouchToken.trim()) {
				this.pendingVouchToken = parsed.pendingVouchToken;
			}
		} catch {
			// Ignore malformed UI state
		}
	}

	private persistUiState(): void {
		if (!browser) return;
		const payload: PersistedUiState = {
			onboardingStep: this.onboardingStep,
			activeTab: this.activeTab,
			pendingVouchToken: this.pendingVouchToken
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

		if (
			onboardingState?.completed ||
			(existingUser !== null && this.onboardingStep === 'login')
		) {
			this.onboardingStep = 'feed';
			this.pendingVouchToken = null;
		} else if (this.onboardingStep === 'login') {
			this.onboardingStep = 'manifesto';
		}
		if (existingUser !== null) {
			this.pendingVouchToken = null;
		}

		this.isLoggedIn = true;
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

	async createAccount(
		password: string,
		peerVouchToken?: string
	): Promise<{ identity: UserIdentity; recoveryKey: string }> {
		if (password.length < 8) {
			throw new Error('Password must be at least 8 characters.');
		}
		this.isAuthenticating = true;
		try {
			const status = await this.ensureConnectedRelay();
			const kp = await araliyaService.generateKeypair();

			let vouchToken: string | null = peerVouchToken?.trim() || null;
			if (!vouchToken && status.httpAvailable && status.genesisMode) {
				vouchToken = await araliyaService.requestGenesisVouch(
					kp.publicKey,
					status.baseUrl
				);
			}

			const vaultJson = await araliyaService.createVaultJson(kp.secretKey, password);
			saveStoredVault(vaultJson);
			const recoveryKey = await araliyaService.exportRecoveryKey(kp.secretKey);
			const identity = await araliyaService.unlockWithSecretKey(kp.secretKey, status);
			await saveQuickUnlockSecret(kp.secretKey, identity.userPubkey);

			this.hasVault = true;
			this.identity = identity;
			this.pendingVouchToken = vouchToken;
			this.newlyCreatedRecoveryKey = recoveryKey;
			this.onboardingStep = 'manifesto';
			this.isLoggedIn = false;
			this.persistUiState();

			return { identity, recoveryKey };
		} finally {
			this.isAuthenticating = false;
		}
	}

	setPendingVouchToken(token: string | null): void {
		const cleaned = token?.trim() || null;
		this.pendingVouchToken = cleaned;
		this.persistUiState();
	}

	async continueAfterCreation(vouchToken?: string): Promise<void> {
		if (!this.identity) return;
		if (vouchToken !== undefined && vouchToken.trim()) {
			this.setPendingVouchToken(vouchToken);
		}
		this.newlyCreatedRecoveryKey = null;
		this.isLoggedIn = true;
		this.onboardingStep = 'manifesto';
		this.persistUiState();
		await ledgerStore.hydrateAfterUnlock(this.relayStatus?.rootPubkey ?? '');
	}

	async unlockWithPassword(password: string): Promise<void> {
		const vaultJson = loadStoredVault();
		if (!vaultJson) {
			throw new Error('No local encrypted vault found. Create an account or recover.');
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
			await this.finishAuthenticatedUnlock(identity);
		} finally {
			this.isAuthenticating = false;
		}
	}

	async recoverFromRecoveryKey(recoveryKey: string, newPassword: string): Promise<void> {
		const trimmedKey = recoveryKey.trim();
		if (!trimmedKey) {
			throw new Error('Paste your araliya-recovery:v1 key.');
		}
		if (newPassword.length < 8) {
			throw new Error('New password must be at least 8 characters.');
		}
		this.isAuthenticating = true;
		try {
			const status = await this.ensureConnectedRelay();
			const kp = await araliyaService.importRecoveryKey(trimmedKey);
			const vaultJson = await araliyaService.createVaultJson(kp.secretKey, newPassword);
			saveStoredVault(vaultJson);
			this.hasVault = true;

			const identity = await araliyaService.unlockWithSecretKey(kp.secretKey, status);
			await saveQuickUnlockSecret(kp.secretKey, identity.userPubkey);
			await this.finishAuthenticatedUnlock(identity);
		} finally {
			this.isAuthenticating = false;
		}
	}

	async exportRecoveryKey(): Promise<string> {
		const payload = await araliyaService.exportRecoveryPayload();
		return payload.recoveryKey;
	}

	clearPendingVouch(): void {
		this.pendingVouchToken = null;
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
		this.persistUiState();
		if (ledgerStore.questions.length === 0) {
			await ledgerStore.hydrateAfterUnlock(this.relayStatus?.rootPubkey ?? '');
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
		this.newlyCreatedRecoveryKey = null;
		this.onboardingStep = 'login';
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
		this.pendingVouchToken = null;
		if (browser) {
			localStorage.removeItem(UI_STATE_KEY);
		}
	}
}

export const sessionStore = new SessionStore();
