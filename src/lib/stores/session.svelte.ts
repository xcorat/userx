import { browser } from '$app/environment';
import {
	clearManualRelayOverride,
	extractEndpointId,
	getConfiguredEndpointIds,
	getConfiguredRelayUrls,
	getConfiguredRootPubkey,
	getDefaultRelayHttpUrl,
	getVouchRequestTtlMs,
	loadManualRelayOverride,
	parsePeerList,
	parseUrlList,
	saveManualRelayOverride
} from '$lib/config/genesis.config';
import { araliyaService, pubkeyToHex } from '$lib/services/araliya.service';
import {
	clearQuickUnlockSession,
	deleteSealedDraft,
	deleteStoredVault,
	hasStoredVault,
	loadQuickUnlockSecretBytes,
	loadStoredVault,
	purgeLegacyPlaintextStorage,
	saveQuickUnlockSecret,
	saveStoredVault
} from '$lib/services/vault.storage';
import { ledgerStore } from '$lib/stores/ledger.svelte';
import { toast } from 'svelte-sonner';
import type {
	AdmissionStatus,
	AppTab,
	GeneratedKeypair,
	IssuedVouchCard,
	KeyCustodyMode,
	OnboardingStep,
	PendingVouchRequest,
	RelayStatusInfo,
	UserIdentity,
	VouchCertInfo,
	VouchRequestItem
} from '$lib/types';

const UI_STATE_KEY = 'userx_ui_state_v2';
const LEGACY_UI_STATE_KEY = 'userx_ui_state_v1';

const VALID_STEPS = new Set<OnboardingStep>([
	'unlock',
	'welcome',
	'keypair',
	'vouch',
	'vouch-expired',
	'handle',
	'custody',
	'details',
	'demo-public',
	'demo-sponsored',
	'ask-first',
	'feed'
]);

const PRE_AUTH_STEPS = new Set<OnboardingStep>(['welcome', 'keypair']);
const POST_REGISTRATION_STEPS = new Set<OnboardingStep>([
	'custody',
	'details',
	'demo-public',
	'demo-sponsored',
	'ask-first'
]);
const PRE_REGISTRATION_STEPS = new Set<OnboardingStep>(['vouch', 'vouch-expired', 'handle']);
const PENDING_ALLOWED_STEPS = new Set<OnboardingStep>([
	'vouch',
	'handle',
	'custody',
	'details',
	'demo-public',
	'demo-sponsored',
	'ask-first',
	'feed'
]);

interface PersistedUiState {
	onboardingStep: OnboardingStep;
	activeTab: AppTab;
	custodyMode: KeyCustodyMode;
	pendingVouchToken: string | null;
	pendingVouchInviter: string | null;
	pendingVoucherPubkey: string | null;
	pendingVouchRequest: PendingVouchRequest | null;
	vouchedByHandle: string | null;
	demoTokenBalance: number;
	firstQuestionCreditUsed: boolean;
}

function normalizeOnboardingStep(raw: unknown): OnboardingStep | null {
	if (typeof raw !== 'string') return null;
	const legacyMap: Record<string, OnboardingStep> = {
		login: 'unlock',
		manifesto: 'welcome',
		network: 'welcome',
		username: 'handle',
		identity: 'details',
		theme: 'details'
	};
	if (raw in legacyMap) return legacyMap[raw];
	return VALID_STEPS.has(raw as OnboardingStep) ? (raw as OnboardingStep) : null;
}

function normalizeSystemHandle(raw: string): string {
	const handle = raw.trim().replace(/^@+/, '');
	return handle.toLowerCase() === 'genesis' ? 'araliya' : handle;
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
	pendingVoucherPubkey = $state<string | null>(null);
	pendingVouchRequest = $state<PendingVouchRequest | null>(null);
	detectedRelayVouch = $state<VouchCertInfo | null>(null);
	admissionStatus = $state<AdmissionStatus>('unknown');
	incomingVouchRequests = $state<VouchRequestItem[]>([]);
	isCheckingVouch = $state(false);
	isLoadingIncomingVouches = $state(false);
	vouchedByHandle = $state<string | null>(null);
	demoTokenBalance = $state(0);
	firstQuestionCreditUsed = $state(false);

	relayStatus = $state<RelayStatusInfo | null>(null);
	isConnectingRelay = $state(false);
	isAuthenticating = $state(false);

	private expiryTimer: ReturnType<typeof setTimeout> | null = null;
	private visibilityListener: (() => void) | null = null;

	isAdmitted = $derived(this.admissionStatus === 'admitted' || this.admissionStatus === 'open');
	isPendingVouch = $derived(this.admissionStatus === 'pending-vouch');
	isVouchExpired = $derived(this.admissionStatus === 'expired');
	vouchExpiresAtMs = $derived(this.pendingVouchRequest?.expiresAtMs ?? null);

	isHeroOnboarding = $derived.by(() => {
		if (!this.isInitialized) return false;
		if (!this.isLoggedIn) {
			if (
				this.wantsUnlockScreen ||
				(this.hasVault && !PRE_AUTH_STEPS.has(this.onboardingStep))
			) {
				return false;
			}
			return true;
		}
		return this.onboardingStep === 'welcome' || this.onboardingStep === 'keypair';
	});

	constructor() {
		if (browser) {
			void this.initialize();
		} else {
			this.isInitialized = true;
		}
	}

	private async initialize(): Promise<void> {
		try {
			ledgerStore.setUserEventHandlers({
				onVouchIssued: () => {
					void this.checkAndAutoCompleteVouch();
				},
				onVouchRequested: () => {
					void this.refreshIncomingVouchRequests();
				},
				onVouchRequestDismissed: () => {
					void this.checkAndAutoCompleteVouch();
				}
			});
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
				this.pendingVouchInviter = normalizeSystemHandle(parsed.pendingVouchInviter);
			}
			if (
				typeof parsed.pendingVoucherPubkey === 'string' &&
				parsed.pendingVoucherPubkey.trim()
			) {
				this.pendingVoucherPubkey = parsed.pendingVoucherPubkey.trim();
			}
			if (parsed.pendingVouchRequest && typeof parsed.pendingVouchRequest === 'object') {
				const req = parsed.pendingVouchRequest;
				if (
					typeof req.subjectPubkey === 'string' &&
					typeof req.createdAtMs === 'number' &&
					typeof req.expiresAtMs === 'number'
				) {
					this.pendingVouchRequest = {
						subjectPubkey: req.subjectPubkey,
						voucherPubkey:
							typeof req.voucherPubkey === 'string' && req.voucherPubkey.trim()
								? req.voucherPubkey.trim()
								: null,
						voucherHandle:
							typeof req.voucherHandle === 'string' && req.voucherHandle.trim()
								? normalizeSystemHandle(req.voucherHandle)
								: null,
						createdAtMs: req.createdAtMs,
						expiresAtMs: req.expiresAtMs,
						reason:
							req.reason === 'expired' || req.reason === 'declined' ? req.reason : null
					};
				}
			}
			if (typeof parsed.vouchedByHandle === 'string' && parsed.vouchedByHandle.trim()) {
				this.vouchedByHandle = normalizeSystemHandle(parsed.vouchedByHandle);
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
			let voucher = url.searchParams.get('voucher')?.trim() ?? '';
			let inviter =
				url.searchParams.get('inviter')?.trim() ??
				url.searchParams.get('by')?.trim() ??
				'';
			let touched = false;

			if (vouch) {
				url.searchParams.delete('vouch');
				touched = true;
			}
			if (voucher) {
				url.searchParams.delete('voucher');
				touched = true;
			}
			if (url.searchParams.has('inviter') || url.searchParams.has('by')) {
				url.searchParams.delete('inviter');
				url.searchParams.delete('by');
				touched = true;
			}

			if ((!vouch || !voucher) && url.hash) {
				const rawHash = url.hash.replace(/^#/, '');
				if (!vouch && rawHash.startsWith('araliya-vouch-card:v1:')) {
					vouch = rawHash;
					url.hash = '';
					touched = true;
				} else if (rawHash.includes('vouch=') || rawHash.includes('voucher=')) {
					const hashQuery = rawHash.startsWith('?') ? rawHash.slice(1) : rawHash;
					const hashParams = new URLSearchParams(hashQuery);
					const hashVouch = hashParams.get('vouch')?.trim() ?? '';
					const hashVoucher = hashParams.get('voucher')?.trim() ?? '';
					if (hashVouch || hashVoucher) {
						if (!vouch && hashVouch) vouch = hashVouch;
						if (!voucher && hashVoucher) voucher = hashVoucher;
						inviter =
							inviter ||
							hashParams.get('inviter')?.trim() ||
							hashParams.get('by')?.trim() ||
							'';
						hashParams.delete('vouch');
						hashParams.delete('voucher');
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
			if (voucher) {
				this.pendingVoucherPubkey = voucher;
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
			pendingVoucherPubkey: this.pendingVoucherPubkey,
			pendingVouchRequest: this.pendingVouchRequest,
			vouchedByHandle: this.vouchedByHandle,
			demoTokenBalance: this.demoTokenBalance,
			firstQuestionCreditUsed: this.firstQuestionCreditUsed
		};
		localStorage.setItem(UI_STATE_KEY, JSON.stringify(payload));
	}

	private async resolveVoucherHandle(voucherPubkey?: string | null): Promise<string | null> {
		if (!voucherPubkey) return null;
		const rootPk = this.relayStatus?.rootPubkey;
		if (rootPk && pubkeyToHex(voucherPubkey) === pubkeyToHex(rootPk)) {
			return 'araliya';
		}
		try {
			const user = await araliyaService.getUserByPubkey(voucherPubkey);
			return user?.username ?? null;
		} catch {
			return null;
		}
	}

	private stopExpiryMonitor(): void {
		if (this.expiryTimer) {
			clearTimeout(this.expiryTimer);
			this.expiryTimer = null;
		}
		if (browser && this.visibilityListener) {
			document.removeEventListener('visibilitychange', this.visibilityListener);
			this.visibilityListener = null;
		}
	}

	private scheduleExpiryTimer(): void {
		if (!browser || !this.isPendingVouch || !this.pendingVouchRequest) return;
		if (this.expiryTimer) {
			clearTimeout(this.expiryTimer);
			this.expiryTimer = null;
		}
		const remaining = this.pendingVouchRequest.expiresAtMs - Date.now();
		if (remaining <= 0) {
			void this.handleExpiryTick();
			return;
		}
		// Clamp delay to 1 hour so long timers survive sleep/wake and avoid 32-bit overflow.
		const delay = Math.min(remaining, 3_600_000);
		this.expiryTimer = setTimeout(() => {
			void this.handleExpiryTick();
		}, delay);
	}

	private startExpiryMonitor(): void {
		if (!browser || !this.isPendingVouch || !this.pendingVouchRequest) return;
		this.scheduleExpiryTimer();
		if (!this.visibilityListener) {
			this.visibilityListener = () => {
				if (document.visibilityState === 'visible' && this.isLoggedIn && this.isPendingVouch) {
					void this.checkAndAutoCompleteVouch();
				}
			};
			document.addEventListener('visibilitychange', this.visibilityListener);
		}
	}

	private async handleExpiryTick(): Promise<void> {
		if (!this.isLoggedIn || !this.isPendingVouch || !this.pendingVouchRequest) return;
		const res = await this.checkAndAutoCompleteVouch();
		if (res.admitted || res.needsHandle || !this.isPendingVouch || !this.pendingVouchRequest) {
			return;
		}
		if (Date.now() >= this.pendingVouchRequest.expiresAtMs) {
			this.pendingVouchRequest = {
				...this.pendingVouchRequest,
				reason: 'expired'
			};
			this.admissionStatus = 'expired';
			this.onboardingStep = 'vouch-expired';
			this.stopExpiryMonitor();
			this.persistUiState();
		} else {
			this.scheduleExpiryTimer();
		}
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
		this.stopExpiryMonitor();
		this.detectedRelayVouch = null;

		const [onboardingResult, userResult] = await Promise.allSettled([
			araliyaService.getOnboardingState(),
			araliyaService.getUserByPubkey(identity.userPubkey)
		]);

		const onboardingState =
			onboardingResult.status === 'fulfilled' ? onboardingResult.value : null;
		const existingUser = userResult.status === 'fulfilled' ? userResult.value : null;
		const remoteCursor = normalizeOnboardingStep(onboardingState?.stepCursor);

		if (existingUser !== null) {
			this.admissionStatus = 'admitted';
			this.pendingVouchToken = null;
			this.pendingVoucherPubkey = null;
			this.pendingVouchRequest = null;
			deleteSealedDraft();

			if (onboardingState?.completed) {
				this.onboardingStep = 'feed';
			} else if (remoteCursor && remoteCursor !== 'unlock') {
				this.onboardingStep = remoteCursor;
			} else {
				this.onboardingStep = POST_REGISTRATION_STEPS.has(this.onboardingStep)
					? this.onboardingStep
					: 'feed';
			}
		} else if (this.relayStatus?.admissionPolicy === 'open') {
			this.admissionStatus = 'open';
			if (onboardingState?.completed) {
				this.onboardingStep = 'feed';
			} else if (remoteCursor && remoteCursor !== 'unlock') {
				this.onboardingStep = remoteCursor;
			} else {
				this.onboardingStep = PRE_REGISTRATION_STEPS.has(this.onboardingStep)
					? this.onboardingStep
					: 'vouch';
			}
		} else {
			await ledgerStore.restoreSealedDraftIfAny();
			if (
				this.pendingVouchRequest &&
				pubkeyToHex(this.pendingVouchRequest.subjectPubkey) !==
					pubkeyToHex(identity.userPubkey)
			) {
				this.pendingVouchRequest = null;
			}

			let validToken: string | null = null;
			let tokenVoucherPk: string | null = null;
			if (this.pendingVouchToken) {
				const info = await araliyaService.inspectVouchTokenAsync(this.pendingVouchToken);
				const matchesSubject =
					!info.subjectPubkey ||
					pubkeyToHex(info.subjectPubkey) === pubkeyToHex(identity.userPubkey);
				if (info.validFormat && info.isValid !== false && !info.isExpired && matchesSubject) {
					validToken = info.tokenOrJson;
					tokenVoucherPk = info.voucherPubkey ?? null;
				} else if (info.isExpired) {
					this.pendingVouchToken = null;
				}
			}

			const relayCert = validToken
				? null
				: await araliyaService.checkInitialVouch().catch(() => null);

			if (validToken || relayCert) {
				const voucherPk = tokenVoucherPk ?? relayCert?.voucherPubkey ?? null;
				const voucherHandle = await this.resolveVoucherHandle(voucherPk);
				if (voucherHandle) {
					this.vouchedByHandle = voucherHandle;
				}

				if (ledgerStore.profile.username.value.trim()) {
					try {
						await ledgerStore.flushStagedOnboardingToRelay(
							identity.userPubkey,
							validToken
						);
						this.admissionStatus = 'admitted';
						this.pendingVouchToken = null;
						this.pendingVoucherPubkey = null;
						this.pendingVouchRequest = null;
						this.detectedRelayVouch = null;
						if (
							this.onboardingStep === 'vouch' ||
							this.onboardingStep === 'vouch-expired' ||
							this.onboardingStep === 'unlock'
						) {
							this.onboardingStep = 'custody';
						}
						toast.success(
							voucherHandle
								? `Vouched by @${voucherHandle} — full network access unlocked!`
								: 'Vouch approved — full network access unlocked!'
						);
					} catch {
						this.detectedRelayVouch = relayCert;
						this.admissionStatus = 'unknown';
						this.onboardingStep = 'handle';
					}
				} else {
					this.detectedRelayVouch = relayCert;
					this.admissionStatus = 'unknown';
					this.onboardingStep = 'handle';
				}
			} else {
				const relayReqs = await araliyaService.listMyVouchRequests().catch(() => []);
				const matchedReq =
					(this.pendingVouchRequest?.voucherPubkey
						? relayReqs.find(
								(r) =>
									pubkeyToHex(r.voucherPubkey) ===
									pubkeyToHex(this.pendingVouchRequest?.voucherPubkey ?? '')
							)
						: undefined) ?? relayReqs[0];

				if (matchedReq) {
					if (matchedReq.status === 'declined') {
						const vHandle =
							this.pendingVouchRequest?.voucherHandle ??
							(await this.resolveVoucherHandle(matchedReq.voucherPubkey));
						this.pendingVouchRequest = {
							subjectPubkey: identity.userPubkey,
							voucherPubkey: matchedReq.voucherPubkey,
							voucherHandle: vHandle,
							createdAtMs: matchedReq.createdAtMs,
							expiresAtMs: matchedReq.expiresAtMs,
							reason: 'declined'
						};
					} else if (
						matchedReq.status === 'pending' &&
						(!this.pendingVouchRequest ||
							matchedReq.expiresAtMs > this.pendingVouchRequest.expiresAtMs)
					) {
						const vHandle =
							this.pendingVouchRequest?.voucherHandle ??
							(await this.resolveVoucherHandle(matchedReq.voucherPubkey));
						this.pendingVouchRequest = {
							subjectPubkey: identity.userPubkey,
							voucherPubkey: matchedReq.voucherPubkey,
							voucherHandle: vHandle,
							createdAtMs: matchedReq.createdAtMs,
							expiresAtMs: matchedReq.expiresAtMs,
							reason: null
						};
					}
				}

				if (this.pendingVouchRequest) {
					if (
						this.pendingVouchRequest.reason === 'declined' ||
						Date.now() >= this.pendingVouchRequest.expiresAtMs
					) {
						this.pendingVouchRequest = {
							...this.pendingVouchRequest,
							reason: this.pendingVouchRequest.reason ?? 'expired'
						};
						this.admissionStatus = 'expired';
						this.onboardingStep = 'vouch-expired';
					} else {
						this.admissionStatus = 'pending-vouch';
						if (!PENDING_ALLOWED_STEPS.has(this.onboardingStep)) {
							this.onboardingStep = 'handle';
						}
					}
				} else {
					this.admissionStatus = 'unknown';
					this.onboardingStep = 'vouch';
				}
			}
		}

		this.isLoggedIn = true;
		this.wantsUnlockScreen = false;
		this.persistUiState();
		await ledgerStore.hydrateAfterUnlock(this.relayStatus?.rootPubkey ?? '', {
			isAdmitted: this.isAdmitted,
			userPubkey: identity.userPubkey
		});
		if (this.isPendingVouch) {
			this.startExpiryMonitor();
		} else if (this.isAdmitted) {
			void this.refreshIncomingVouchRequests();
		}
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
		this.stopExpiryMonitor();
		this.detectedRelayVouch = null;
		this.pendingVouchRequest = null;
		deleteSealedDraft();

		await saveQuickUnlockSecret(kp.secretKey, kp.publicKey);
		const status =
			this.relayStatus && this.relayStatus.connected
				? this.relayStatus
				: await this.refreshRelayStatus();

		this.admissionStatus = status.admissionPolicy === 'open' ? 'open' : 'unknown';

		if (status.connected) {
			const identity = await araliyaService.unlockWithSecretKey(kp.secretKey, status);
			this.identity = identity;
			await ledgerStore.hydrateAfterUnlock(status.rootPubkey ?? '', {
				isAdmitted: this.isAdmitted,
				userPubkey: identity.userPubkey
			});
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
		this.vouchedByHandle = handle ? normalizeSystemHandle(handle) || null : null;
		this.persistUiState();
	}

	clearPendingVouch(): void {
		this.pendingVouchToken = null;
		this.pendingVouchInviter = null;
		this.persistUiState();
	}

	async startPendingVouchWindow(
		voucherPubkey?: string | null,
		voucherHandle?: string | null,
		requestedHandle?: string | null
	): Promise<PendingVouchRequest> {
		const subjectPubkey = this.identity?.userPubkey ?? '';
		if (!subjectPubkey) {
			throw new Error('Unlocked local identity required');
		}
		const now = Date.now();
		let expiresAtMs = now + getVouchRequestTtlMs();
		let createdAtMs = now;
		const cleanedVoucher = voucherPubkey?.trim() || null;
		let resolvedHandle = voucherHandle?.trim().replace(/^@+/, '') || null;

		if (cleanedVoucher && this.relayStatus?.connected && araliyaService.hasUnlockedWasmSession()) {
			const rec = await araliyaService.submitVouchRequest(
				cleanedVoucher,
				requestedHandle?.trim() || null,
				expiresAtMs
			);
			createdAtMs = rec.createdAtMs;
			expiresAtMs = rec.expiresAtMs;
			if (!resolvedHandle) {
				resolvedHandle = await this.resolveVoucherHandle(cleanedVoucher);
			}
		}

		const req: PendingVouchRequest = {
			subjectPubkey,
			voucherPubkey: cleanedVoucher,
			voucherHandle: resolvedHandle,
			createdAtMs,
			expiresAtMs,
			reason: null
		};
		this.pendingVouchRequest = req;
		this.admissionStatus = 'pending-vouch';
		this.persistUiState();
		this.startExpiryMonitor();
		if (this.relayStatus?.connected && !ledgerStore.isLiveSyncActive) {
			await ledgerStore.startLiveSync(this.relayStatus.rootPubkey ?? '', subjectPubkey);
		}
		return req;
	}

	async syncRequestedHandleToVoucher(handle: string | null): Promise<void> {
		const voucherPk = this.pendingVouchRequest?.voucherPubkey;
		if (!this.isPendingVouch || !voucherPk || !this.relayStatus?.connected) return;
		const expiresAtMs = Math.max(Date.now() + 60_000, this.pendingVouchRequest?.expiresAtMs ?? 0);
		await araliyaService
			.submitVouchRequest(voucherPk, handle?.trim() || null, expiresAtMs)
			.catch(() => {});
	}

	markAdmittedAfterRegistration(voucherHandle?: string | null): void {
		this.stopExpiryMonitor();
		this.admissionStatus = 'admitted';
		if (voucherHandle) {
			this.vouchedByHandle = voucherHandle.trim().replace(/^@+/, '') || null;
		}
		this.pendingVouchToken = null;
		this.pendingVoucherPubkey = null;
		this.pendingVouchRequest = null;
		this.detectedRelayVouch = null;
		deleteSealedDraft();
		this.persistUiState();
		void this.refreshIncomingVouchRequests();
	}

	async checkAndAutoCompleteVouch(
		explicitToken?: string | null
	): Promise<{ admitted: boolean; voucherHandle: string | null; needsHandle?: boolean }> {
		if (!this.identity || this.isCheckingVouch) {
			return { admitted: false, voucherHandle: null };
		}
		this.isCheckingVouch = true;
		try {
			await this.ensureUnlockedOnRelay();

			const existing = await araliyaService
				.getUserByPubkey(this.identity.userPubkey)
				.catch(() => null);
			if (existing) {
				this.markAdmittedAfterRegistration(this.vouchedByHandle);
				return { admitted: true, voucherHandle: this.vouchedByHandle };
			}

			let validToken: string | null = null;
			let tokenVoucherPk: string | null = null;
			const candidateToken = explicitToken?.trim() || this.pendingVouchToken;
			if (candidateToken) {
				const info = await araliyaService.inspectVouchTokenAsync(candidateToken);
				const matchesSubject =
					!info.subjectPubkey ||
					pubkeyToHex(info.subjectPubkey) === pubkeyToHex(this.identity.userPubkey);
				if (info.validFormat && info.isValid !== false && !info.isExpired && matchesSubject) {
					validToken = info.tokenOrJson;
					tokenVoucherPk = info.voucherPubkey ?? null;
				}
			}

			const relayCert = validToken
				? null
				: await araliyaService.checkInitialVouch().catch(() => null);

			if (!validToken && !relayCert) {
				if (this.pendingVouchRequest?.voucherPubkey) {
					const myReqs = await araliyaService.listMyVouchRequests().catch(() => []);
					const match = myReqs.find(
						(r) =>
							pubkeyToHex(r.voucherPubkey) ===
							pubkeyToHex(this.pendingVouchRequest?.voucherPubkey ?? '')
					);
					if (match?.status === 'declined') {
						this.pendingVouchRequest = {
							...this.pendingVouchRequest,
							reason: 'declined'
						};
						this.admissionStatus = 'expired';
						this.onboardingStep = 'vouch-expired';
						this.stopExpiryMonitor();
						this.persistUiState();
						return { admitted: false, voucherHandle: null };
					}
				}

				if (this.pendingVouchRequest && Date.now() >= this.pendingVouchRequest.expiresAtMs) {
					this.pendingVouchRequest = {
						...this.pendingVouchRequest,
						reason: 'expired'
					};
					this.admissionStatus = 'expired';
					this.onboardingStep = 'vouch-expired';
					this.stopExpiryMonitor();
					this.persistUiState();
				}
				return { admitted: false, voucherHandle: null };
			}

			const voucherPk = tokenVoucherPk ?? relayCert?.voucherPubkey ?? null;
			const voucherHandle =
				(await this.resolveVoucherHandle(voucherPk)) ??
				this.pendingVouchRequest?.voucherHandle ??
				null;

			if (!ledgerStore.profile.username.value.trim()) {
				if (validToken) {
					this.pendingVouchToken = validToken;
				}
				if (relayCert) {
					this.detectedRelayVouch = relayCert;
				}
				if (voucherHandle) {
					this.vouchedByHandle = voucherHandle;
				}
				this.persistUiState();
				return { admitted: false, voucherHandle, needsHandle: true };
			}

			try {
				await ledgerStore.flushStagedOnboardingToRelay(
					this.identity.userPubkey,
					validToken
				);
			} catch (err) {
				const msg = err instanceof Error ? err.message.toLowerCase() : '';
				if (msg.includes('conflict') || msg.includes('already') || msg.includes('taken')) {
					if (validToken) {
						this.pendingVouchToken = validToken;
					}
					if (relayCert) {
						this.detectedRelayVouch = relayCert;
					}
					if (voucherHandle) {
						this.vouchedByHandle = voucherHandle;
					}
					this.onboardingStep = 'handle';
					this.persistUiState();
					toast.error('Your staged @handle was taken while waiting — pick a new one to finish.');
					return { admitted: false, voucherHandle, needsHandle: true };
				}
				throw err;
			}

			this.markAdmittedAfterRegistration(voucherHandle);
			if (this.onboardingStep === 'vouch' || this.onboardingStep === 'vouch-expired') {
				this.onboardingStep = 'feed';
				this.activeTab = 'feed';
				this.persistUiState();
			}
			await araliyaService
				.completeOnboardingStep(this.onboardingStep, this.onboardingStep === 'feed')
				.catch(() => {});
			toast.success(
				voucherHandle
					? `Vouched by @${voucherHandle} — full network access unlocked!`
					: 'Vouch approved — full network access unlocked!'
			);
			return { admitted: true, voucherHandle };
		} catch {
			return { admitted: false, voucherHandle: null };
		} finally {
			this.isCheckingVouch = false;
		}
	}

	restartVouchFlowFromExpired(): void {
		this.stopExpiryMonitor();
		this.pendingVouchRequest = null;
		this.pendingVouchToken = null;
		this.detectedRelayVouch = null;
		this.admissionStatus = 'unknown';
		this.onboardingStep = 'vouch';
		this.persistUiState();
	}

	async refreshIncomingVouchRequests(): Promise<VouchRequestItem[]> {
		if (!this.isAdmitted || !this.relayStatus?.connected || !araliyaService.hasUnlockedWasmSession()) {
			return this.incomingVouchRequests;
		}
		this.isLoadingIncomingVouches = true;
		try {
			const reqs = await araliyaService.listIncomingVouchRequests();
			this.incomingVouchRequests = reqs;
			return reqs;
		} catch {
			return this.incomingVouchRequests;
		} finally {
			this.isLoadingIncomingVouches = false;
		}
	}

	async approveIncomingVouch(
		subjectPubkey: string,
		ttlHours: number | null = 72
	): Promise<IssuedVouchCard> {
		await this.ensureUnlockedOnRelay();
		const expiresAtMs = ttlHours && ttlHours > 0 ? Date.now() + ttlHours * 3_600_000 : null;
		const card = await araliyaService.submitVouchCard(
			subjectPubkey,
			'initial_approval',
			this.relayStatus?.rootPubkey ?? null,
			this.relayStatus?.endpointId ?? null,
			this.relayStatus?.dialPeerAddress ?? null,
			expiresAtMs
		);
		this.incomingVouchRequests = this.incomingVouchRequests.filter(
			(r) => pubkeyToHex(r.subjectPubkey) !== pubkeyToHex(subjectPubkey)
		);
		return card;
	}

	async declineIncomingVouch(subjectPubkey: string): Promise<void> {
		await this.ensureUnlockedOnRelay();
		await araliyaService.dismissVouchRequest(subjectPubkey);
		this.incomingVouchRequests = this.incomingVouchRequests.filter(
			(r) => pubkeyToHex(r.subjectPubkey) !== pubkeyToHex(subjectPubkey)
		);
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
		if (this.isAdmitted) {
			await araliyaService.completeOnboardingStep(step, false).catch(() => {});
		}
		this.setOnboardingStep(step);
	}

	async completeOnboarding(): Promise<void> {
		if (this.isAdmitted) {
			await araliyaService.completeOnboardingStep('feed', true).catch(() => {});
		}
		this.onboardingStep = 'feed';
		this.activeTab = 'feed';
		this.pendingDraftKeypair = null;
		this.persistUiState();
		if (ledgerStore.questions.length === 0 && this.relayStatus?.connected) {
			await ledgerStore.hydrateAfterUnlock(this.relayStatus.rootPubkey ?? '', {
				isAdmitted: this.isAdmitted,
				userPubkey: this.identity?.userPubkey
			});
		}
	}

	setActiveTab(tab: AppTab): void {
		this.activeTab = tab;
		this.persistUiState();
	}

	async lock(): Promise<void> {
		this.stopExpiryMonitor();
		ledgerStore.clearInMemoryState();
		await araliyaService.lock().catch(() => {});
		await clearQuickUnlockSession();
		this.isLoggedIn = false;
		this.identity = null;
		this.admissionStatus = 'unknown';
		this.detectedRelayVouch = null;
		this.incomingVouchRequests = [];
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
		deleteSealedDraft();
		this.hasVault = false;
		this.wantsUnlockScreen = false;
		this.custodyMode = 'browser-encrypted';
		this.pendingVouchToken = null;
		this.pendingVouchInviter = null;
		this.pendingVoucherPubkey = null;
		this.pendingVouchRequest = null;
		this.detectedRelayVouch = null;
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
