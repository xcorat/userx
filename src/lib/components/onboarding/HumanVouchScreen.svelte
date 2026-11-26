<script lang="ts">
	import { onMount } from 'svelte';
	import { araliyaService, pubkeyToHex } from '$lib/services/araliya.service';
	import { sessionStore } from '$lib/stores/session.svelte';
	import type { VouchCertInfo } from '$lib/types';
	import RelayStatusPill from '$lib/components/onboarding/RelayStatusPill.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import {
		ArrowRight,
		CheckCircle2,
		Clock,
		Copy,
		RefreshCw,
		Send,
		ShieldCheck,
		Terminal,
		UserCheck
	} from 'lucide-svelte';

	let vouchPasteInput = $state('');
	let isRequestingGenesis = $state(false);
	let isSubmittingRequest = $state(false);
	let isCheckingRelay = $state(false);
	let showMaintainerRequest = $state(false);
	let showTokenPaste = $state(false);
	let resolvedVoucherHandle = $state<string | null>(null);
	let resolvedRelayVouch = $state<VouchCertInfo | null>(sessionStore.detectedRelayVouch);
	let mismatchWarning = $state<string | null>(null);
	let requestError = $state<string | null>(null);
	let requestSubmittedForKey = $state<string | null>(null);
	let nowMs = $state(Date.now());

	let relay = $derived(sessionStore.relayStatus);
	let pubkey = $derived(sessionStore.identity?.userPubkey ?? '');
	let stagedToken = $derived(sessionStore.pendingVouchToken);
	let targetVoucherPk = $derived(
		sessionStore.pendingVoucherPubkey ?? sessionStore.pendingVouchRequest?.voucherPubkey ?? null
	);
	let activeRequest = $derived(sessionStore.pendingVouchRequest);

	let hasVouchReady = $derived(Boolean(stagedToken || resolvedRelayVouch));

	let displayVoucherHandle = $derived(
		resolvedVoucherHandle ??
			sessionStore.vouchedByHandle ??
			sessionStore.pendingVouchInviter ??
			activeRequest?.voucherHandle ??
			null
	);

	function truncateToken(val: string): string {
		if (!val || val.length <= 28) return val;
		return `${val.slice(0, 22)}…${val.slice(-6)}`;
	}

	function truncatePk(val: string): string {
		if (!val || val.length <= 18) return val;
		return `${val.slice(0, 10)}…${val.slice(-6)}`;
	}

	function formatTimeRemaining(expiresAtMs: number): string {
		const diff = Math.max(0, expiresAtMs - nowMs);
		if (diff <= 0) return 'Expired';
		const totalMins = Math.floor(diff / 60_000);
		const hours = Math.floor(totalMins / 60);
		const mins = totalMins % 60;
		if (hours >= 24) {
			const days = Math.floor(hours / 24);
			const remHours = hours % 24;
			return `${days}d ${remHours}h ${mins}m`;
		}
		if (hours > 0) return `${hours}h ${mins}m`;
		const secs = Math.floor((diff % 60_000) / 1000);
		return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
	}

	function buildVouchRequestPayload(pk: string): string {
		return JSON.stringify(
			{
				type: 'araliya-vouch-request/v1',
				subject_pubkey: pk,
				subject_pubkey_hex: pubkeyToHex(pk),
				relay_endpoint: relay?.endpointId || undefined
			},
			null,
			2
		);
	}

	function buildGenesisCurl(pk: string): string {
		return `curl -s -X POST http://127.0.0.1:8080/genesis/vouch -H 'Content-Type: application/json' -d '{"subject_pubkey":"${pk}","ttl_secs":86400}'`;
	}

	async function resolveHandleForPk(voucherPk: string): Promise<string | null> {
		if (relay?.rootPubkey && pubkeyToHex(voucherPk) === pubkeyToHex(relay.rootPubkey)) {
			return 'araliya';
		}
		if (relay?.connected && araliyaService.hasUnlockedWasmSession()) {
			try {
				const user = await araliyaService.getUserByPubkey(voucherPk);
				if (user?.username) return user.username;
			} catch {
				// Keep fallback
			}
		}
		return null;
	}

	async function inspectAndResolveVoucher(token: string): Promise<boolean> {
		mismatchWarning = null;
		const info = await araliyaService.inspectVouchTokenAsync(token);
		if (
			!info.validFormat ||
			info.isValid === false ||
			info.isExpired ||
			!info.subjectPubkey ||
			!pubkey
		) {
			sessionStore.setPendingVouchToken(null);
			return false;
		}

		if (
			pubkeyToHex(info.subjectPubkey) !== pubkeyToHex(pubkey)
		) {
			mismatchWarning =
				'Warning: this vouch token targets a different public key than your active identity.';
			sessionStore.setPendingVouchToken(null);
			return false;
		}

		if (info.voucherPubkey) {
			const handle = await resolveHandleForPk(info.voucherPubkey);
			if (handle) {
				resolvedVoucherHandle = handle;
				sessionStore.setVouchedByHandle(handle);
			}
		}
		return true;
	}

	async function checkRelayForVouch(silent = true): Promise<boolean> {
		if (!relay?.connected || !pubkey) return false;
		isCheckingRelay = true;
		try {
			await sessionStore.ensureUnlockedOnRelay();
			const cert = await araliyaService.checkInitialVouch();
			if (cert) {
				resolvedRelayVouch = cert;
				sessionStore.detectedRelayVouch = cert;
				const handle = await resolveHandleForPk(cert.voucherPubkey);
				if (handle) {
					resolvedVoucherHandle = handle;
					sessionStore.setVouchedByHandle(handle);
				}
				if (!silent) {
					toast.success(
						handle
							? `Vouch from @${handle} found on relay!`
							: 'Valid vouch found on relay!'
					);
				}
				return true;
			}
			if (!silent) {
				toast.info('No vouch received yet — still waiting.');
			}
			return false;
		} catch {
			return false;
		} finally {
			isCheckingRelay = false;
		}
	}

	async function ensureTargetVoucherRequestSent(voucherPk: string) {
		if (
			!pubkey ||
			!relay?.connected ||
			isSubmittingRequest ||
			requestSubmittedForKey === `${pubkey}:${voucherPk}`
		) {
			return;
		}
		// Already have an active local request targeting this exact voucher?
		if (
			activeRequest &&
			activeRequest.voucherPubkey &&
			pubkeyToHex(activeRequest.voucherPubkey) === pubkeyToHex(voucherPk) &&
			activeRequest.expiresAtMs > Date.now() &&
			activeRequest.reason !== 'declined'
		) {
			requestSubmittedForKey = `${pubkey}:${voucherPk}`;
			if (!resolvedVoucherHandle && activeRequest.voucherHandle) {
				resolvedVoucherHandle = activeRequest.voucherHandle;
			}
			return;
		}

		isSubmittingRequest = true;
		requestError = null;
		try {
			await sessionStore.ensureUnlockedOnRelay();
			const handle = await resolveHandleForPk(voucherPk);
			if (handle) {
				resolvedVoucherHandle = handle;
			}
			await sessionStore.startPendingVouchWindow(voucherPk, handle);
			requestSubmittedForKey = `${pubkey}:${voucherPk}`;
		} catch (err) {
			requestError =
				err instanceof Error ? err.message : 'Could not send vouch request to relay';
		} finally {
			isSubmittingRequest = false;
		}
	}

	async function tryAutoGenesisVouch() {
		if (
			sessionStore.pendingVouchToken ||
			resolvedRelayVouch ||
			sessionStore.pendingVoucherPubkey ||
			!relay?.connected ||
			!relay.httpAvailable ||
			!relay.genesisMode ||
			!pubkey ||
			isRequestingGenesis
		) {
			return;
		}
		isRequestingGenesis = true;
		try {
			const token = await araliyaService.requestGenesisVouch(pubkey, relay.baseUrl);
			sessionStore.setPendingVouchToken(token);
			sessionStore.setVouchedByHandle('araliya');
			resolvedVoucherHandle = 'araliya';
		} catch {
			// Fall back to peer vouch / manual paste flow
		} finally {
			isRequestingGenesis = false;
		}
	}

	onMount(() => {
		const timer = setInterval(() => {
			nowMs = Date.now();
		}, 15_000);

		void (async () => {
			if (stagedToken) {
				if (await inspectAndResolveVoucher(stagedToken)) return;
			}
			const foundOnRelay = await checkRelayForVouch(true);
			if (foundOnRelay) return;

			if (targetVoucherPk) {
				await ensureTargetVoucherRequestSent(targetVoucherPk);
			} else {
				await tryAutoGenesisVouch();
			}
		})();

		return () => clearInterval(timer);
	});

	$effect(() => {
		if (
			!stagedToken &&
			!resolvedRelayVouch &&
			targetVoucherPk &&
			relay?.connected &&
			pubkey &&
			requestSubmittedForKey !== `${pubkey}:${targetVoucherPk}` &&
			!isSubmittingRequest
		) {
			void ensureTargetVoucherRequestSent(targetVoucherPk);
		} else if (
			!stagedToken &&
			!resolvedRelayVouch &&
			!sessionStore.pendingVoucherPubkey &&
			relay?.connected &&
			relay.httpAvailable &&
			relay.genesisMode &&
			pubkey
		) {
			void tryAutoGenesisVouch();
		}
	});

	async function handleApplyVouch(event: SubmitEvent) {
		event.preventDefault();
		const info = await araliyaService.inspectVouchTokenAsync(vouchPasteInput);
		if (!info.validFormat) {
			toast.error(info.error ?? 'Invalid vouch token');
			return;
		}
		if (info.isValid === false) {
			toast.error('This vouch token has an invalid signature.');
			return;
		}
		if (info.isExpired) {
			toast.error('This vouch token has expired');
			return;
		}
		if (!info.subjectPubkey) {
			toast.error('This vouch token is not bound to a public key.');
			return;
		}
		if (!pubkey) {
			toast.error('Unlock or create an identity before applying a vouch token.');
			return;
		}
		if (pubkey && pubkeyToHex(info.subjectPubkey) !== pubkeyToHex(pubkey)) {
			toast.error('This vouch token belongs to a different public key.');
			return;
		}
		sessionStore.setPendingVouchToken(info.tokenOrJson);
		vouchPasteInput = '';
		if (!(await inspectAndResolveVoucher(info.tokenOrJson))) return;
		toast.success('Vouch token staged for registration');
	}

	async function handleContinueWhileWaiting() {
		try {
			if (targetVoucherPk) {
				await ensureTargetVoucherRequestSent(targetVoucherPk);
			} else if (!sessionStore.isPendingVouch) {
				await sessionStore.startPendingVouchWindow(null, null);
			}
			sessionStore.setOnboardingStep('handle');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Could not start pending vouch window');
		}
	}

	async function handleSendVouchRequest() {
		showMaintainerRequest = true;
		if (!pubkey) return;
		try {
			await navigator.clipboard.writeText(buildVouchRequestPayload(pubkey));
			toast.success('Copied vouch request payload with your Public Key');
		} catch {
			toast.info('Share the vouch request payload below with an existing member');
		}
	}

	async function copyText(label: string, value: string) {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			toast.success(`Copied ${label}`);
		} catch {
			toast.error(`Could not copy ${label}`);
		}
	}
</script>

<div class="flex h-full flex-col justify-between gap-4 overflow-y-auto px-5 py-6">
	<RelayStatusPill
		stepLabel="Step 2 / 8"
		onBack={() => sessionStore.setOnboardingStep('keypair')}
	/>

	<div class="my-auto space-y-5 py-2">
		<div class="space-y-1.5">
			<p class="font-mono text-[11px] uppercase tracking-widest text-primary">
				Stage 2 · Join araliya-net
			</p>
			<h1 class="font-heading text-2xl font-bold tracking-tight">
				Human Vouch Admission
			</h1>
			<p class="text-xs leading-relaxed text-muted-foreground">
				To keep the commons human without invasive ID checks, an existing member must vouch for you.
			</p>
		</div>

		{#if isRequestingGenesis || isSubmittingRequest}
			<div class="rounded-2xl border border-primary/30 bg-card/85 p-4 text-center text-xs text-muted-foreground">
				{#if isSubmittingRequest}
					Sending 72-hour vouch request to {resolvedVoucherHandle ? `@${resolvedVoucherHandle}` : 'your inviter'}…
				{:else}
					Requesting Genesis relay vouch for your public key…
				{/if}
			</div>
		{:else if hasVouchReady}
			<!-- State A — Vouch Token or Relay-Submitted Vouch Ready -->
			<div class="space-y-3 rounded-2xl border border-primary/40 bg-primary/10 p-4">
				<div class="flex items-start justify-between gap-2">
					<div class="flex items-center gap-2">
						<CheckCircle2 class="h-5 w-5 shrink-0 text-primary" />
						<span class="text-xs font-semibold text-foreground">Vouch Ready</span>
					</div>
					{#if stagedToken}
						<button
							type="button"
							onclick={() => {
								sessionStore.clearPendingVouch();
								resolvedVoucherHandle = null;
								mismatchWarning = null;
							}}
							class="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground"
						>
							Use different token
						</button>
					{/if}
				</div>

				{#if stagedToken}
					<div class="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/70 px-3 py-2 font-mono text-[11px]">
						<span class="truncate text-foreground">{truncateToken(stagedToken)}</span>
						<button
							type="button"
							onclick={() => copyText('vouch token', stagedToken)}
							aria-label="Copy vouch token"
							class="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
						>
							<Copy class="h-3.5 w-3.5" />
						</button>
					</div>
				{:else if resolvedRelayVouch}
					<div class="rounded-lg border border-border/70 bg-background/70 px-3 py-2 font-mono text-[11px] text-foreground">
						Recorded directly on relay by {truncatePk(resolvedRelayVouch.voucherPubkey)}
					</div>
				{/if}

				<p class="text-xs leading-relaxed text-foreground">
					<UserCheck class="mr-1 inline h-3.5 w-3.5 text-primary" />
					A valid vouch is ready{#if displayVoucherHandle} from
						<span class="font-semibold text-primary">@{displayVoucherHandle}</span>{/if}.
					Choose your handle to finish registration.
				</p>

				{#if mismatchWarning}
					<p class="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-200">
						{mismatchWarning}
					</p>
				{/if}
			</div>
		{:else if targetVoucherPk}
			<!-- State B1 — Invited via ?voucher=<alice_pubkey> Onboarding Link -->
			<div class="space-y-3.5 rounded-2xl border border-primary/35 bg-card/90 p-4">
				<div class="flex items-center justify-between gap-2">
					<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
						<Clock class="h-4 w-4 text-primary" />
						{activeRequest ? 'Vouch Request Sent' : 'Vouch Request Not Confirmed'}
					</span>
					{#if activeRequest}
						<span class="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
							{formatTimeRemaining(activeRequest.expiresAtMs)} left
						</span>
					{/if}
				</div>

				<p class="text-xs leading-relaxed text-muted-foreground">
					Your request was automatically sent to
					<span class="font-semibold text-foreground">
						{resolvedVoucherHandle || activeRequest?.voucherHandle
							? `@${resolvedVoucherHandle ?? activeRequest?.voucherHandle}`
							: truncatePk(targetVoucherPk)}
					</span>. You can finish setting up your profile and explore the commons while waiting — full access unlocks automatically once they approve (72h window).
				</p>

				{#if requestError}
					<p class="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive">
						{requestError}
					</p>
				{/if}

				<div class="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={isCheckingRelay}
						onclick={() => checkRelayForVouch(false)}
						class="h-8 flex-1 cursor-pointer text-xs"
					>
						<RefreshCw class={`mr-1.5 h-3.5 w-3.5 ${isCheckingRelay ? 'animate-spin' : ''}`} />
						{isCheckingRelay ? 'Checking…' : 'Check Approval Status'}
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onclick={() => (showTokenPaste = !showTokenPaste)}
						class="h-8 cursor-pointer text-[11px] text-muted-foreground"
					>
						{showTokenPaste ? 'Hide Token' : 'Paste Token'}
					</Button>
				</div>

				{#if showTokenPaste}
					<form onsubmit={handleApplyVouch} class="space-y-2 border-t border-border/60 pt-3">
						<Label for="vouch-paste-invited" class="text-[11px]">Vouch Token or JSON</Label>
						<Input
							id="vouch-paste-invited"
							bind:value={vouchPasteInput}
							placeholder="araliya-vouch-card:v1:..."
							autocapitalize="none"
							autocomplete="off"
							class="h-9 bg-background/70 font-mono text-xs"
						/>
						<Button type="submit" variant="secondary" size="sm" class="h-8 w-full cursor-pointer text-xs">
							<ShieldCheck class="mr-1.5 h-3.5 w-3.5" />
							Apply Vouch Token
						</Button>
					</form>
				{/if}
			</div>
		{:else}
			<!-- State B2 — No Invite Link Yet -->
			<div class="space-y-3 rounded-2xl border border-border/80 bg-card/85 p-4">
				<p class="text-xs leading-relaxed text-muted-foreground">
					Paste a vouch token if you have one, or share your public key with an existing member:
				</p>
				<p class="text-[11px] leading-relaxed text-muted-foreground">
					Without a specific inviter, sharing this payload does not create a relay-side request;
					an existing member or maintainer must act on it.
				</p>

				<form onsubmit={handleApplyVouch} class="space-y-2.5">
					<div class="space-y-1">
						<Label for="vouch-paste-input" class="text-[11px]">Vouch Token or JSON</Label>
						<Input
							id="vouch-paste-input"
							bind:value={vouchPasteInput}
							placeholder="araliya-vouch-card:v1:..."
							autocapitalize="none"
							autocomplete="off"
							class="h-10 bg-background/70 font-mono text-xs"
						/>
					</div>
					<Button type="submit" variant="secondary" class="h-9 w-full cursor-pointer text-xs font-semibold">
						<ShieldCheck class="mr-1.5 h-3.5 w-3.5" />
						Apply Vouch Token
					</Button>
				</form>

				<div class="flex gap-2 border-t border-border/60 pt-2.5">
					<Button
						type="button"
						variant="outline"
						onclick={handleSendVouchRequest}
						class="h-9 flex-1 cursor-pointer text-xs"
					>
						<Send class="mr-1.5 h-3.5 w-3.5 text-primary" />
						Share Request Payload
					</Button>
					<Button
						type="button"
						variant="outline"
						disabled={isCheckingRelay}
						onclick={() => checkRelayForVouch(false)}
						class="h-9 cursor-pointer px-3 text-xs"
					>
						<RefreshCw class={`h-3.5 w-3.5 ${isCheckingRelay ? 'animate-spin' : ''}`} />
					</Button>
				</div>

				{#if showMaintainerRequest && pubkey}
					<div class="space-y-2 rounded-xl border border-border/70 bg-background/75 p-3 text-[11px]">
						<div class="flex items-center justify-between gap-2">
							<span class="flex items-center gap-1.5 font-semibold text-foreground">
								<Terminal class="h-3.5 w-3.5 text-primary" />
								Your Vouch Request Details
							</span>
							<button
								type="button"
								onclick={() => copyText('genesis curl command', buildGenesisCurl(pubkey))}
								class="inline-flex cursor-pointer items-center gap-1 text-[10px] text-primary hover:underline"
							>
								<Copy class="h-3 w-3" />
								Copy curl
							</button>
						</div>
						<p class="text-[10px] text-muted-foreground">
							Share your Public Key with an existing member (or relay maintainer) to vouch for you on the relay or mint an <span class="font-mono">araliya-vouch-card:v1</span>:
						</p>
						<div class="flex items-center justify-between gap-2 rounded-md bg-card px-2 py-1.5 font-mono text-[10px]">
							<span class="truncate text-foreground">{pubkey}</span>
							<button
								type="button"
								onclick={() => copyText('public key', pubkey)}
								class="shrink-0 cursor-pointer text-primary hover:underline"
							>
								Copy
							</button>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<div class="space-y-2 pb-2">
		{#if hasVouchReady}
			<Button
				onclick={() => sessionStore.setOnboardingStep('handle')}
				size="lg"
				class="h-12 w-full cursor-pointer font-semibold"
			>
				Enter the Network
				<ArrowRight class="ml-2 h-4 w-4" />
			</Button>
		{:else if relay?.admissionPolicy === 'open'}
			<Button
				onclick={() => sessionStore.setOnboardingStep('handle')}
				size="lg"
				class="h-12 w-full cursor-pointer font-semibold"
			>
				Open Relay · Enter the Network
				<ArrowRight class="ml-2 h-4 w-4" />
			</Button>
		{:else}
			<Button
				onclick={handleContinueWhileWaiting}
				variant={targetVoucherPk ? 'default' : 'outline'}
				size="lg"
				disabled={isSubmittingRequest}
				class="h-12 w-full cursor-pointer text-xs font-semibold"
			>
				Continue Onboarding While Waiting (72h)
				<ArrowRight class="ml-2 h-4 w-4" />
			</Button>
		{/if}
	</div>
</div>
