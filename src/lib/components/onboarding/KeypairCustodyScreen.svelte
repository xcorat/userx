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
	<div class="rounded-3xl border border-border bg-card/95 p-5 text-card-foreground shadow-xl shadow-black/10 backdrop-blur-md sm:p-8">
		<!-- Top Badge & Replay / Relay Controls -->
		<div class="mb-4 flex items-center justify-between gap-2">
			<span class="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-mono text-xs text-primary">
				<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
				Step 1 / 8 · Local Identity
			</span>

			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={() => (showRelayConfig = !showRelayConfig)}
					title={relay?.connected ? 'Relay Connected — Configure' : 'Relay Offline — Configure'}
					aria-label="Configure Relay Endpoint"
					class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background/80 px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
				>
					<span
						class={`h-1.5 w-1.5 rounded-full ${
							relay?.connected ? 'bg-primary' : 'bg-destructive'
						}`}
					></span>
					<Settings class="h-3 w-3" />
				</button>

				{#if onBackToTools}
					<button
						type="button"
						onclick={onBackToTools}
						class="cursor-pointer text-xs text-primary transition hover:underline"
					>
						← Tools
					</button>
				{/if}

				{#if onReplayIntro}
					<button
						type="button"
						onclick={onReplayIntro}
						class="cursor-pointer text-xs text-muted-foreground transition hover:text-foreground"
					>
						↑ Replay intro
					</button>
				{/if}
			</div>
		</div>

		{#if showRelayConfig}
			<div class="mb-4 space-y-2.5 rounded-2xl border border-primary/25 bg-background/85 p-3.5 text-xs">
				<div class="flex items-center justify-between">
					<span class="font-medium text-primary">Direct Iroh Relay Override</span>
					<span class="font-mono text-xs text-muted-foreground">
						mode: {relay?.source ?? 'none'}
					</span>
				</div>
				<input
					type="text"
					bind:value={relayEndpointInput}
					placeholder="EndpointId or iroh1: address"
					autocapitalize="none"
					autocomplete="off"
					class="w-full rounded-lg border border-input bg-card px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
				/>
				<div class="grid grid-cols-2 gap-2">
					<input
						type="text"
						bind:value={relayUrlsInput}
						placeholder="Relay URLs (optional)"
						autocapitalize="none"
						autocomplete="off"
						class="w-full rounded-lg border border-input bg-card px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
					/>
					<input
						type="text"
						bind:value={rootPubkeyInput}
						placeholder="Root Pubkey (optional)"
						autocapitalize="none"
						autocomplete="off"
						class="w-full rounded-lg border border-input bg-card px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
					/>
				</div>
				<div class="flex gap-2">
					<button
						type="button"
						onclick={handleSaveRelayOverride}
						disabled={sessionStore.isConnectingRelay}
						class="flex-1 cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
					>
						{sessionStore.isConnectingRelay ? 'Probing Iroh…' : 'Save & Connect'}
					</button>
					<button
						type="button"
						onclick={handleResetRelayOverride}
						disabled={sessionStore.isConnectingRelay}
						class="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs text-foreground/80 transition hover:bg-secondary/70"
					>
						Reset
					</button>
				</div>
			</div>
		{/if}

		<h2 class="font-serif-hero text-2xl font-semibold text-foreground sm:text-3xl">
			Your Lock &amp; Key
		</h2>
		<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
			Your account is a cryptographic keypair stored in this browser. Your
			<span class="font-medium text-primary">public key</span> is your identity; your
			<span class="font-medium text-accent">private key</span> unlocks and signs your data.
		</p>

		{#if initError}
			<div class="mt-4 flex items-center justify-between gap-2 rounded-xl border border-destructive/35 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
				<span class="truncate">{initError}</span>
				<button
					type="button"
					onclick={() => loadDraftKeypair(true)}
					class="shrink-0 cursor-pointer font-semibold text-primary hover:underline"
				>
					Retry
				</button>
			</div>
		{/if}

		<!-- Generated Keypair Preview -->
		<div class="mt-5 space-y-3">
			<div class="rounded-2xl border border-border bg-background/85 p-3.5">
				<div class="mb-1 flex items-center justify-between text-xs text-muted-foreground">
					<span>Public Key (Identity)</span>
					<div class="flex items-center gap-3">
						{#if !sessionStore.isLoggedIn}
							<button
								type="button"
								onclick={handleRegenerate}
								disabled={isLoadingKeypair}
								aria-label="Generate new keypair"
								title="Generate new keypair"
								class="inline-flex cursor-pointer items-center gap-1 text-muted-foreground hover:text-foreground"
							>
								<RefreshCw class={`h-3 w-3 ${isLoadingKeypair ? 'animate-spin' : ''}`} />
							</button>
						{/if}
						<button
							type="button"
							onclick={() => copyText('Public key', publicKey)}
							disabled={!publicKey}
							class="cursor-pointer font-medium text-primary hover:underline disabled:opacity-40"
						>
							Copy
						</button>
					</div>
				</div>
				<code class="block truncate font-mono text-xs text-primary" title={publicKey}>
					{displayPublicKey}
				</code>
			</div>

			<div class="rounded-2xl border border-accent/35 bg-background/85 p-3.5">
				<div class="mb-1 flex items-center justify-between text-xs text-muted-foreground">
					<span>Private Key (Save this safely)</span>
					<div class="flex items-center gap-3">
						<button
							type="button"
							onclick={() => (revealPrivate = !revealPrivate)}
							class="cursor-pointer font-medium text-muted-foreground hover:text-foreground"
						>
							{revealPrivate ? 'Hide' : 'Reveal'}
						</button>
						<button
							type="button"
							onclick={() => copyText('Private key', recoveryKey)}
							disabled={!recoveryKey}
							class="cursor-pointer font-medium text-accent hover:underline disabled:opacity-40"
						>
							Copy
						</button>
					</div>
				</div>
				<code class="block truncate font-mono text-xs text-accent" title={revealPrivate ? recoveryKey : ''}>
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
			<div class="mt-4 flex items-center justify-between gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-primary">
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
					<label for="local-pass" class="block text-xs font-medium text-foreground">
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
							class="w-full rounded-xl border border-input bg-background py-3 pr-10 pl-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition focus:border-primary focus:outline-none"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							class="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
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
							class="cursor-pointer text-xs font-medium text-primary hover:underline"
						>
							Store secret manually →
						</button>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoadingKeypair || sessionStore.isAuthenticating}
					class="w-full cursor-pointer rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-black/10 transition hover:bg-primary/90 disabled:opacity-50"
				>
					{sessionStore.isAuthenticating
						? 'Encrypting Locally…'
						: 'Save Key & Continue to Vouch →'}
				</button>
			{:else}
				<div class="space-y-3 rounded-2xl border border-accent/35 bg-accent/10 p-3.5 text-xs">
					<p class="leading-relaxed text-foreground/90">
						Your private key stays in active tab memory only and is never saved to browser storage. Paste it whenever you open a new session.
					</p>

					<div class="flex flex-wrap items-center justify-between gap-2">
						<button
							type="button"
							onclick={() => {
								revealPrivate = true;
								void copyText('Private key', recoveryKey);
							}}
							class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-accent/40 bg-background/85 px-3 py-1.5 text-xs font-medium text-accent hover:bg-background"
						>
							<Copy class="h-3.5 w-3.5" />
							Copy Private Key
						</button>

						<button
							type="button"
							onclick={() => switchCustodyMode('browser-encrypted')}
							class="cursor-pointer text-xs font-medium text-primary hover:underline"
						>
							← Encrypt with password instead
						</button>
					</div>

					<label class="flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-background/80 p-2.5 text-xs">
						<input
							type="checkbox"
							bind:checked={manualConfirmed}
							class="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
						/>
						<span class="text-foreground">
							I saved my Private Key somewhere safe (I will paste it each session)
						</span>
					</label>
				</div>

				<button
					type="submit"
					disabled={isLoadingKeypair || sessionStore.isAuthenticating}
					class="w-full cursor-pointer rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-black/10 transition hover:bg-primary/90 disabled:opacity-50"
				>
					{sessionStore.isAuthenticating ? 'Preparing Session…' : 'Continue to Vouch →'}
				</button>
			{/if}
		</form>

		<p class="mt-4 text-center text-xs text-muted-foreground">
			So far your account exists only in this browser window.
		</p>
	</div>
</div>
