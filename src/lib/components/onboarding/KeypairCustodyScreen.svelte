<script lang="ts">
	import { onMount } from 'svelte';
	import { pubkeyToHex } from '$lib/services/araliya.service';
	import { sessionStore } from '$lib/stores/session.svelte';
	import RelayStatusPill from '$lib/components/onboarding/RelayStatusPill.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import {
		ArrowRight,
		Copy,
		Eye,
		EyeOff,
		KeyRound,
		Lock,
		RefreshCw
	} from 'lucide-svelte';

	let publicKey = $state('');
	let recoveryKey = $state('');
	let isLoadingKeypair = $state(true);

	let revealPrivate = $state(false);
	let manualMode = $state(sessionStore.custodyMode === 'manual-no-store');
	let manualConfirmed = $state(false);

	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);

	let displayPublicKey = $derived.by(() => {
		if (!publicKey) return 'ed25519:••••••••';
		const hex = pubkeyToHex(publicKey);
		if (hex.length >= 12) {
			return `ed25519:${hex.slice(0, 4)}…${hex.slice(-4)}`;
		}
		return `ed25519:${publicKey.slice(0, 6)}…${publicKey.slice(-4)}`;
	});

	onMount(async () => {
		try {
			const draft = await sessionStore.ensureDraftKeypair();
			publicKey = draft.kp.publicKey;
			recoveryKey = draft.recoveryKey;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to generate Ed25519 keypair');
		} finally {
			isLoadingKeypair = false;
		}
	});

	async function handleRegenerate() {
		if (sessionStore.isLoggedIn) return;
		isLoadingKeypair = true;
		try {
			const draft = await sessionStore.regenerateDraftKeypair();
			publicKey = draft.kp.publicKey;
			recoveryKey = draft.recoveryKey;
			toast.success('Generated fresh Ed25519 keypair');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to regenerate keypair');
		} finally {
			isLoadingKeypair = false;
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

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (isLoadingKeypair) return;

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
			toast.error('Local password must be at least 8 characters');
			return;
		}
		if (password !== confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}
		try {
			await sessionStore.completeKeypairWithPassword(password);
			password = '';
			confirmPassword = '';
			toast.success('Encrypted keypair created');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to create encrypted vault');
		}
	}
</script>

<form
	onsubmit={handleSubmit}
	class="flex h-full flex-col justify-between gap-4 overflow-y-auto px-5 py-6"
>
	<RelayStatusPill
		stepLabel="03 / 10"
		onBack={() => sessionStore.setOnboardingStep('network')}
	/>

	<div class="my-auto space-y-4 py-2">
		<div class="space-y-1.5">
			<p class="font-mono text-[11px] uppercase tracking-widest text-primary">
				Stage 2 · Your Lock &amp; Key
			</p>
			<h1 class="font-heading text-2xl font-bold tracking-tight">
				Cryptographic Identity
			</h1>
			<p class="text-xs leading-relaxed text-muted-foreground">
				The future web runs on real cryptography, not company-owned logins. Your account is an <span class="font-semibold text-foreground">ed25519 keypair</span>:
			</p>
		</div>

		<!-- Lock & Key Card -->
		<div class="space-y-3 rounded-2xl border border-border/80 bg-card/85 p-3.5 text-xs">
			<ul class="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
				<li>
					<span class="font-semibold text-foreground">Public Key (Lock):</span> Your permanent network identity. Others use it to find you and verify that your answers truly came from you.
				</li>
				<li>
					<span class="font-semibold text-foreground">Private Key (Key):</span> Unlocks your private data and signs everything you publish.
				</li>
			</ul>

			<div class="space-y-2 border-t border-border/60 pt-2.5 font-mono text-[11px]">
				<div class="flex items-center justify-between gap-2">
					<div class="min-w-0">
						<span class="inline-flex items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
							<Lock class="h-3 w-3 text-primary" />
							Public Key
						</span>
						<p class="truncate text-foreground" title={publicKey}>
							{isLoadingKeypair ? 'Generating…' : displayPublicKey}
						</p>
					</div>
					<div class="flex shrink-0 items-center gap-1.5">
						{#if !sessionStore.isLoggedIn}
							<button
								type="button"
								onclick={handleRegenerate}
								title="Generate new keypair"
								aria-label="Regenerate keypair"
								class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-background/70 px-2 py-1 font-sans text-[10px] text-muted-foreground hover:text-foreground"
							>
								<RefreshCw class={`h-3 w-3 ${isLoadingKeypair ? 'animate-spin' : ''}`} />
							</button>
						{/if}
						<button
							type="button"
							onclick={() => copyText('public key', publicKey)}
							disabled={!publicKey}
							class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-background/70 px-2 py-1 font-sans text-[10px] text-foreground hover:border-primary/60"
						>
							<Copy class="h-3 w-3" />
							Copy
						</button>
					</div>
				</div>

				<div class="space-y-1.5 border-t border-border/50 pt-2">
					<div class="flex items-center justify-between gap-2">
						<span class="inline-flex items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
							<KeyRound class="h-3 w-3 text-accent" />
							Private Key
						</span>
						<span class="font-sans text-[10px] text-amber-300">Save this somewhere safe</span>
					</div>

					<div class="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/75 px-2.5 py-2">
						<span class="min-w-0 flex-1 break-all text-[10px] text-primary">
							{#if isLoadingKeypair}
								Generating…
							{:else if revealPrivate}
								{recoveryKey}
							{:else}
								••••••••••••••••••••••••••••
							{/if}
						</span>
						<div class="flex shrink-0 items-center gap-1">
							<button
								type="button"
								onclick={() => (revealPrivate = !revealPrivate)}
								class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-2 py-1 font-sans text-[10px] text-muted-foreground hover:text-foreground"
							>
								{#if revealPrivate}
									<EyeOff class="h-3 w-3" />
									Hide
								{:else}
									<Eye class="h-3 w-3" />
									Reveal
								{/if}
							</button>
							<button
								type="button"
								onclick={() => copyText('private recovery key', recoveryKey)}
								disabled={!recoveryKey}
								class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-card px-2 py-1 font-sans text-[10px] text-foreground hover:border-primary/60"
							>
								<Copy class="h-3 w-3" />
								Copy
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Password Custody vs. Manual Secret Toggle -->
		{#if !manualMode}
			<div class="space-y-3 rounded-2xl border border-border/80 bg-card/75 p-3.5">
				<div class="space-y-0.5">
					<p class="text-xs font-semibold text-foreground">
						Create a Local Password <span class="font-normal text-muted-foreground">(min 8 chars)</span>
					</p>
					<p class="text-[11px] text-muted-foreground">
						Encrypts your private key on this device.
					</p>
				</div>

				<div class="space-y-2">
					<div class="space-y-1">
						<Label for="keypair-password" class="text-[11px]">Password</Label>
						<div class="relative">
							<Input
								id="keypair-password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								placeholder="Choose a strong local password"
								autocomplete="new-password"
								minlength={8}
								required
								class="h-10 bg-background/70 pr-10 text-sm"
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
					</div>

					<div class="space-y-1">
						<Label for="keypair-password-confirm" class="text-[11px]">Confirm Password</Label>
						<Input
							id="keypair-password-confirm"
							type={showPassword ? 'text' : 'password'}
							bind:value={confirmPassword}
							placeholder="Repeat password"
							autocomplete="new-password"
							minlength={8}
							required
							class="h-10 bg-background/70 text-sm"
						/>
					</div>
				</div>

				<div class="flex items-center justify-between gap-2 pt-0.5">
					<span class="text-[10px] text-muted-foreground">
						Exists only in this browser window right now.
					</span>
					<button
						type="button"
						onclick={() => (manualMode = true)}
						class="shrink-0 cursor-pointer text-[11px] font-medium text-primary hover:underline"
					>
						Store secret manually →
					</button>
				</div>
			</div>
		{:else}
			<div class="space-y-3 rounded-2xl border border-accent/40 bg-accent/10 p-3.5 text-xs">
				<div class="space-y-1">
					<p class="font-semibold text-foreground">Manual Secret Custody (No Browser Storage)</p>
					<p class="text-[11px] leading-relaxed text-muted-foreground">
						Your private key will stay in memory for this tab only and will never be saved in browser storage. You will paste it when starting a new browser session.
					</p>
				</div>

				<div class="flex items-center gap-2">
					<Button
						type="button"
						size="sm"
						variant="outline"
						onclick={() => {
							revealPrivate = true;
							void copyText('private recovery key', recoveryKey);
						}}
						class="h-8 cursor-pointer text-xs"
					>
						<Copy class="mr-1.5 h-3.5 w-3.5" />
						Copy Private Key
					</Button>
					<button
						type="button"
						onclick={() => (manualMode = false)}
						class="cursor-pointer text-[11px] font-medium text-primary hover:underline"
					>
						← Encrypt with password instead
					</button>
				</div>

				<label class="flex cursor-pointer items-start gap-2 rounded-lg border border-border/70 bg-background/60 p-2.5 text-[11px]">
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
		{/if}
	</div>

	<div class="pb-2">
		<Button
			type="submit"
			size="lg"
			disabled={isLoadingKeypair || sessionStore.isAuthenticating}
			class="h-12 w-full cursor-pointer font-semibold"
		>
			{sessionStore.isAuthenticating ? 'Preparing Identity...' : 'Continue'}
			<ArrowRight class="ml-2 h-4 w-4" />
		</Button>
	</div>
</form>
