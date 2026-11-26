<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { loadManualRelayOverride } from '$lib/config/genesis.config';
	import { pubkeyToHex } from '$lib/services/araliya.service';
	import { sessionStore } from '$lib/stores/session.svelte';
	import { toast } from 'svelte-sonner';
	import { Copy, Eye, EyeOff, RefreshCw, Settings } from 'lucide-svelte';

	interface Props {
		onReplayIntro?: () => void;
		onBackToTools?: () => void;
		isActive?: boolean;
		preferredCustodyMode?: 'browser-encrypted' | 'manual-no-store';
		custodyChosenInIntro?: boolean;
		onChangeCustodyMode?: (mode: 'browser-encrypted' | 'manual-no-store') => void;
	}

	let {
		onReplayIntro,
		onBackToTools,
		isActive = true,
		preferredCustodyMode,
		custodyChosenInIntro = false,
		onChangeCustodyMode
	}: Props = $props();

	let publicKey = $state('');
	let recoveryKey = $state('');
	let isLoadingKeypair = $state(true);
	let initError = $state<string | null>(null);

	let revealPrivate = $state(false);
	let manualMode = $state(
		untrack(() => (preferredCustodyMode ?? sessionStore.custodyMode) === 'manual-no-store')
	);
	let manualConfirmed = $state(false);

	$effect(() => {
		if (preferredCustodyMode) {
			manualMode = preferredCustodyMode === 'manual-no-store';
		}
	});

	function switchCustodyMode(mode: 'browser-encrypted' | 'manual-no-store') {
		manualMode = mode === 'manual-no-store';
		if (onChangeCustodyMode) {
			onChangeCustodyMode(mode);
		} else {
			sessionStore.setPreferredCustodyMode(mode);
		}
	}

	let password = $state('');
	let showPassword = $state(false);

	const initialOverride = loadManualRelayOverride();
	let showRelayConfig = $state(false);
	let relayEndpointInput = $state(initialOverride?.endpointId ?? '');
	let relayUrlsInput = $state(initialOverride?.relayUrls.join(', ') ?? '');
	let rootPubkeyInput = $state(initialOverride?.rootPubkey ?? '');

	let relay = $derived(sessionStore.relayStatus);

	let displayPublicKey = $derived.by(() => {
		if (!publicKey) return 'ed25519:generating…';
		const hex = pubkeyToHex(publicKey);
		if (hex.length >= 32) {
			return `ed25519:${hex.slice(0, 32)}`;
		}
		return `ed25519:${publicKey}`;
	});

	async function loadDraftKeypair(showToastOnErr = false) {
		isLoadingKeypair = true;
		initError = null;
		try {
			const draft = await sessionStore.ensureDraftKeypair();
			publicKey = draft.kp.publicKey;
			recoveryKey = draft.recoveryKey;
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to generate Ed25519 keypair';
			initError = msg;
			if (showToastOnErr) {
				toast.error(msg);
			}
		} finally {
			isLoadingKeypair = false;
		}
	}

	onMount(() => {
		void loadDraftKeypair(isActive);
	});

	async function handleRegenerate() {
		if (sessionStore.isLoggedIn) return;
		isLoadingKeypair = true;
		initError = null;
		try {
			const draft = await sessionStore.regenerateDraftKeypair();
			publicKey = draft.kp.publicKey;
			recoveryKey = draft.recoveryKey;
			toast.success('Generated fresh Ed25519 keypair');
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to regenerate keypair';
			initError = msg;
			toast.error(msg);
		} finally {
			isLoadingKeypair = false;
		}
	}

	async function copyText(label: string, value: string) {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			toast.success(`${label} copied to clipboard`);
		} catch {
			toast.error(`Unable to copy ${label}`);
		}
	}

	async function handleSaveRelayOverride() {
		const status = await sessionStore.setManualRelayOverride(
			relayEndpointInput,
			relayUrlsInput,
			rootPubkeyInput
		);
		if (status.connected) {
			showRelayConfig = false;
			toast.success(`Connected via Iroh (${status.endpointId.slice(0, 10)}…)`);
		} else {
			toast.error(status.error ?? 'Failed to reach relay endpoint');
		}
	}

	async function handleResetRelayOverride() {
		relayEndpointInput = '';
		relayUrlsInput = '';
		rootPubkeyInput = '';
		const status = await sessionStore.clearManualRelayOverride();
		if (status.connected) {
			showRelayConfig = false;
			toast.success(
				status.httpAvailable
					? 'Connected via HTTP bootstrap'
					: 'Connected via default Iroh endpoint'
			);
		} else {
			toast.info(status.error ?? 'Cleared manual relay override');
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (isLoadingKeypair) return;
		if (initError || !publicKey) {
			await loadDraftKeypair(true);
			return;
		}

		if (manualMode) {
			if (!manualConfirmed) {
				toast.error('Confirm that you saved your Private Key before continuing');
				return;
			}
			try {
				await sessionStore.completeKeypairManually();
				toast.success('Identity unlocked in browser memory (no local vault saved)');
			} catch (err) {
				toast.error(err instanceof Error ? err.message : 'Failed to initialize session');
			}
			return;
		}

		if (password.length < 8) {
			toast.error('Please enter a password with at least 8 characters.');
			return;
		}
		try {
			await sessionStore.completeKeypairWithPassword(password);
			password = '';
			toast.success('Identity encrypted locally! Ready for Human Vouch.');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to create encrypted vault');
		}
	}
</script>

<div class="mx-auto w-full max-w-lg">
	<div class="rounded-3xl border border-[#6ee7b7]/20 bg-[#101c17]/90 p-5 text-[#f4f1ea] shadow-2xl shadow-black/60 backdrop-blur-md sm:p-8">
		<!-- Top Badge & Replay / Relay Controls -->
		<div class="mb-4 flex items-center justify-between gap-2">
			<span class="inline-flex items-center gap-1.5 rounded-full border border-[#6ee7b7]/20 bg-[#182b23] px-2.5 py-1 font-mono text-xs text-[#a7f3d0]">
				<span class="h-1.5 w-1.5 rounded-full bg-[#6ee7b7]"></span>
				Step 1 / 8 · Local Identity
			</span>

			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={() => (showRelayConfig = !showRelayConfig)}
					title={relay?.connected ? 'Relay Connected — Configure' : 'Relay Offline — Configure'}
					aria-label="Configure Relay Endpoint"
					class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-[#0b120f]/75 px-2.5 py-1 text-[11px] text-[#f4f1ea]/70 transition hover:border-[#6ee7b7]/40 hover:text-[#f4f1ea]"
				>
					<span
						class={`h-1.5 w-1.5 rounded-full ${
							relay?.connected ? 'bg-[#34d399]' : 'bg-rose-400'
						}`}
					></span>
					<Settings class="h-3 w-3" />
				</button>

				{#if onBackToTools}
					<button
						type="button"
						onclick={onBackToTools}
						class="cursor-pointer text-xs text-[#a7f3d0]/80 transition hover:text-[#a7f3d0]"
					>
						← Tools
					</button>
				{/if}

				{#if onReplayIntro}
					<button
						type="button"
						onclick={onReplayIntro}
						class="cursor-pointer text-xs text-[#f4f1ea]/60 transition hover:text-[#f4f1ea]"
					>
						↑ Replay intro
					</button>
				{/if}
			</div>
		</div>

		{#if showRelayConfig}
			<div class="mb-4 space-y-2.5 rounded-2xl border border-[#6ee7b7]/20 bg-[#0b120f]/85 p-3.5 text-xs">
				<div class="flex items-center justify-between">
					<span class="font-medium text-[#a7f3d0]">Direct Iroh Relay Override</span>
					<span class="font-mono text-[10px] text-[#f4f1ea]/50">
						mode: {relay?.source ?? 'none'}
					</span>
				</div>
				<input
					type="text"
					bind:value={relayEndpointInput}
					placeholder="EndpointId or iroh1: address"
					autocapitalize="none"
					autocomplete="off"
					class="w-full rounded-lg border border-white/15 bg-[#101c17] px-3 py-2 font-mono text-[11px] text-[#f4f1ea] placeholder-[#f4f1ea]/35 focus:border-[#6ee7b7] focus:outline-none"
				/>
				<div class="grid grid-cols-2 gap-2">
					<input
						type="text"
						bind:value={relayUrlsInput}
						placeholder="Relay URLs (optional)"
						autocapitalize="none"
						autocomplete="off"
						class="w-full rounded-lg border border-white/15 bg-[#101c17] px-3 py-2 font-mono text-[11px] text-[#f4f1ea] placeholder-[#f4f1ea]/35 focus:border-[#6ee7b7] focus:outline-none"
					/>
					<input
						type="text"
						bind:value={rootPubkeyInput}
						placeholder="Root Pubkey (optional)"
						autocapitalize="none"
						autocomplete="off"
						class="w-full rounded-lg border border-white/15 bg-[#101c17] px-3 py-2 font-mono text-[11px] text-[#f4f1ea] placeholder-[#f4f1ea]/35 focus:border-[#6ee7b7] focus:outline-none"
					/>
				</div>
				<div class="flex gap-2">
					<button
						type="button"
						onclick={handleSaveRelayOverride}
						disabled={sessionStore.isConnectingRelay}
						class="flex-1 cursor-pointer rounded-lg bg-[#6ee7b7] px-3 py-1.5 text-[11px] font-semibold text-[#0b120f] transition hover:bg-[#a7f3d0] disabled:opacity-50"
					>
						{sessionStore.isConnectingRelay ? 'Probing Iroh…' : 'Save & Connect'}
					</button>
					<button
						type="button"
						onclick={handleResetRelayOverride}
						disabled={sessionStore.isConnectingRelay}
						class="cursor-pointer rounded-lg border border-white/15 px-3 py-1.5 text-[11px] text-[#f4f1ea]/80 transition hover:bg-white/5"
					>
						Reset
					</button>
				</div>
			</div>
		{/if}

		<h2 class="font-serif-hero text-2xl font-semibold text-[#f4f1ea] sm:text-3xl">
			Your Lock &amp; Key
		</h2>
		<p class="mt-2 text-sm leading-relaxed text-[#f4f1ea]/70">
			Your account is a cryptographic keypair stored in this browser. Your
			<span class="font-medium text-[#a7f3d0]">public key</span> is your identity; your
			<span class="font-medium text-[#f5b841]">private key</span> unlocks and signs your data.
		</p>

		{#if initError}
			<div class="mt-4 flex items-center justify-between gap-2 rounded-xl border border-rose-400/35 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200">
				<span class="truncate">{initError}</span>
				<button
					type="button"
					onclick={() => loadDraftKeypair(true)}
					class="shrink-0 cursor-pointer font-semibold text-[#a7f3d0] hover:underline"
				>
					Retry
				</button>
			</div>
		{/if}

		<!-- Generated Keypair Preview -->
		<div class="mt-5 space-y-3">
			<div class="rounded-2xl border border-white/10 bg-[#0b120f]/80 p-3.5">
				<div class="mb-1 flex items-center justify-between text-xs text-[#f4f1ea]/60">
					<span>Public Key (Identity)</span>
					<div class="flex items-center gap-3">
						{#if !sessionStore.isLoggedIn}
							<button
								type="button"
								onclick={handleRegenerate}
								disabled={isLoadingKeypair}
								aria-label="Generate new keypair"
								title="Generate new keypair"
								class="inline-flex cursor-pointer items-center gap-1 text-[#f4f1ea]/60 hover:text-[#f4f1ea]"
							>
								<RefreshCw class={`h-3 w-3 ${isLoadingKeypair ? 'animate-spin' : ''}`} />
							</button>
						{/if}
						<button
							type="button"
							onclick={() => copyText('Public key', publicKey)}
							disabled={!publicKey}
							class="cursor-pointer font-medium text-[#a7f3d0] hover:text-[#6ee7b7] disabled:opacity-40"
						>
							Copy
						</button>
					</div>
				</div>
				<code class="block truncate font-mono text-xs text-[#a7f3d0]" title={publicKey}>
					{displayPublicKey}
				</code>
			</div>

			<div class="rounded-2xl border border-[#f5b841]/25 bg-[#0b120f]/80 p-3.5">
				<div class="mb-1 flex items-center justify-between text-xs text-[#f4f1ea]/60">
					<span>Private Key (Save this safely)</span>
					<div class="flex items-center gap-3">
						<button
							type="button"
							onclick={() => (revealPrivate = !revealPrivate)}
							class="cursor-pointer font-medium text-[#f4f1ea]/70 hover:text-[#f4f1ea]"
						>
							{revealPrivate ? 'Hide' : 'Reveal'}
						</button>
						<button
							type="button"
							onclick={() => copyText('Private key', recoveryKey)}
							disabled={!recoveryKey}
							class="cursor-pointer font-medium text-[#f5b841] hover:text-amber-300 disabled:opacity-40"
						>
							Copy
						</button>
					</div>
				</div>
				<code class="block truncate font-mono text-xs text-[#f5b841]" title={revealPrivate ? recoveryKey : ''}>
					{#if isLoadingKeypair}
						Generating…
					{:else if revealPrivate}
						{recoveryKey}
					{:else}
						••••••••••••••••••••••••••••••••••••••••
					{/if}
				</code>
			</div>
		</div>

		{#if custodyChosenInIntro}
			<div class="mt-4 flex items-center justify-between gap-2 rounded-xl border border-[#6ee7b7]/20 bg-[#182b23]/70 px-3 py-2 text-[11px] text-[#a7f3d0]">
				<span>
					From PKI setup: {manualMode
						? 'Store secret manually'
						: 'Encrypt in browser with local password'}
				</span>
			</div>
		{/if}

		<!-- Local Password or Manual Custody Form -->
		<form onsubmit={handleSubmit} class="mt-5 space-y-4">
			{#if !manualMode}
				<div class="space-y-2">
					<label for="local-pass" class="block text-xs font-medium text-[#f4f1ea]/80">
						Encrypt Private Key with a Local Password
					</label>
					<div class="relative">
						<input
							id="local-pass"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							required
							minlength={8}
							autocomplete="new-password"
							placeholder="Create a local password (min 8 chars)"
							class="w-full rounded-xl border border-white/15 bg-[#0b120f] py-3 pr-10 pl-4 text-sm text-[#f4f1ea] placeholder-[#f4f1ea]/35 transition focus:border-[#6ee7b7] focus:outline-none"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							class="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[#f4f1ea]/55 hover:text-[#f4f1ea]"
						>
							{#if showPassword}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</button>
					</div>

					<div class="flex justify-end">
						<button
							type="button"
							onclick={() => switchCustodyMode('manual-no-store')}
							class="cursor-pointer text-[11px] font-medium text-[#a7f3d0]/85 hover:text-[#6ee7b7] hover:underline"
						>
							Store secret manually →
						</button>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoadingKeypair || sessionStore.isAuthenticating}
					class="w-full cursor-pointer rounded-xl bg-[#6ee7b7] py-3.5 text-sm font-semibold text-[#0b120f] shadow-lg shadow-emerald-950/40 transition hover:bg-[#a7f3d0] disabled:opacity-50"
				>
					{sessionStore.isAuthenticating
						? 'Encrypting Locally…'
						: 'Save Key & Continue to Vouch →'}
				</button>
			{:else}
				<div class="space-y-3 rounded-2xl border border-[#f5b841]/30 bg-[#f5b841]/10 p-3.5 text-xs">
					<p class="leading-relaxed text-[#f4f1ea]/85">
						Your private key stays in active tab memory only and is never saved to browser storage. Paste it whenever you open a new session.
					</p>

					<div class="flex flex-wrap items-center justify-between gap-2">
						<button
							type="button"
							onclick={() => {
								revealPrivate = true;
								void copyText('Private key', recoveryKey);
							}}
							class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#f5b841]/40 bg-[#0b120f]/75 px-3 py-1.5 text-[11px] font-medium text-[#f5b841] hover:bg-[#0b120f]"
						>
							<Copy class="h-3.5 w-3.5" />
							Copy Private Key
						</button>

						<button
							type="button"
							onclick={() => switchCustodyMode('browser-encrypted')}
							class="cursor-pointer text-[11px] font-medium text-[#a7f3d0] hover:underline"
						>
							← Encrypt with password instead
						</button>
					</div>

					<label class="flex cursor-pointer items-start gap-2 rounded-xl border border-white/10 bg-[#0b120f]/70 p-2.5 text-[11px]">
						<input
							type="checkbox"
							bind:checked={manualConfirmed}
							class="mt-0.5 h-4 w-4 shrink-0 accent-[#6ee7b7]"
						/>
						<span class="text-[#f4f1ea]/90">
							I saved my Private Key somewhere safe (I will paste it each session)
						</span>
					</label>
				</div>

				<button
					type="submit"
					disabled={isLoadingKeypair || sessionStore.isAuthenticating}
					class="w-full cursor-pointer rounded-xl bg-[#6ee7b7] py-3.5 text-sm font-semibold text-[#0b120f] shadow-lg shadow-emerald-950/40 transition hover:bg-[#a7f3d0] disabled:opacity-50"
				>
					{sessionStore.isAuthenticating ? 'Preparing Session…' : 'Continue to Vouch →'}
				</button>
			{/if}
		</form>

		<p class="mt-4 text-center text-[11px] text-[#f4f1ea]/45">
			So far your account exists only in this browser window.
		</p>
	</div>
</div>
