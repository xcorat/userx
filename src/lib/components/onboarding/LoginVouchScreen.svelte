<script lang="ts">
	import { sessionStore } from '$lib/stores/session.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-sonner';
	import {
		AlertTriangle,
		ArrowRight,
		Copy,
		Eye,
		EyeOff,
		KeyRound,
		Lock,
		RefreshCw,
		RotateCcw,
		ShieldCheck,
		UserPlus
	} from 'lucide-svelte';

	type EntryMode = 'unlock' | 'create' | 'recover';

	let mode = $state<EntryMode>(sessionStore.hasVault ? 'unlock' : 'create');

	let unlockPassword = $state('');
	let showUnlockPassword = $state(false);

	let createPassword = $state('');
	let createConfirmPassword = $state('');
	let peerVouchInput = $state('');
	let showCreatePassword = $state(false);

	let recoveryKeyInput = $state('');
	let recoverPassword = $state('');
	let recoverConfirmPassword = $state('');
	let showRecoverPassword = $state(false);

	let relay = $derived(sessionStore.relayStatus);
	let createdIdentity = $derived(sessionStore.identity);
	let createdRecoveryKey = $derived(sessionStore.newlyCreatedRecoveryKey);

	function truncateKey(key: string): string {
		if (!key || key.length <= 20) return key || '—';
		return `${key.slice(0, 10)}…${key.slice(-8)}`;
	}

	async function handleUnlock(event: SubmitEvent) {
		event.preventDefault();
		try {
			await sessionStore.unlockWithPassword(unlockPassword);
			unlockPassword = '';
			toast.success('Vault unlocked');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to unlock vault');
		}
	}

	async function handleCreateAccount(event: SubmitEvent) {
		event.preventDefault();
		if (createPassword.length < 8) {
			toast.error('Password must be at least 8 characters');
			return;
		}
		if (createPassword !== createConfirmPassword) {
			toast.error('Passwords do not match');
			return;
		}
		try {
			await sessionStore.createAccount(createPassword, peerVouchInput);
			createPassword = '';
			createConfirmPassword = '';
			toast.success('Encrypted vault created — save your recovery key!');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to create account');
		}
	}

	async function handleContinueAfterCreation() {
		try {
			await sessionStore.continueAfterCreation();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to continue onboarding');
		}
	}

	async function handleRecover(event: SubmitEvent) {
		event.preventDefault();
		if (recoverPassword.length < 8) {
			toast.error('New password must be at least 8 characters');
			return;
		}
		if (recoverPassword !== recoverConfirmPassword) {
			toast.error('Passwords do not match');
			return;
		}
		try {
			await sessionStore.recoverFromRecoveryKey(recoveryKeyInput, recoverPassword);
			recoveryKeyInput = '';
			recoverPassword = '';
			recoverConfirmPassword = '';
			toast.success('Account restored into encrypted vault');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to recover account');
		}
	}

	async function copyText(label: string, value: string) {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(`Copied ${label}`);
		} catch {
			toast.error(`Could not copy ${label}`);
		}
	}
</script>

<div class="flex h-full flex-col justify-between gap-4 overflow-y-auto px-5 py-6">
	<!-- Top Brand & Live Relay Status -->
	<header class="space-y-2 pt-2">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
					ux
				</span>
				<span class="font-heading text-lg font-bold tracking-tight">userx</span>
			</div>

			<button
				type="button"
				onclick={() => sessionStore.refreshRelayStatus()}
				class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card/80 px-2.5 py-1 font-mono text-[10px]"
			>
				<span
					class={`h-2 w-2 rounded-full ${
						relay?.connected ? 'bg-emerald-400' : 'bg-destructive'
					}`}
				></span>
				{relay?.connected ? 'Relay Connected' : 'Relay Offline'}
				<RefreshCw
					class={`h-3 w-3 text-muted-foreground ${
						sessionStore.isConnectingRelay ? 'animate-spin' : ''
					}`}
				/>
			</button>
		</div>

		{#if relay?.connected}
			<p class="truncate font-mono text-[10px] text-muted-foreground">
				endpoint: {truncateKey(relay.endpointId)} · root: {truncateKey(relay.rootPubkey)}
			</p>
			{#if relay.localOnly}
				<div class="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 text-[11px] text-amber-200">
					<AlertTriangle class="mt-0.5 h-3.5 w-3.5 shrink-0" />
					<span>
						Relay is running with <span class="font-mono">--local-only</span>; browser WASM needs Iroh relay connectivity.
					</span>
				</div>
			{/if}
		{:else if relay?.error}
			<p class="text-[11px] text-destructive">
				{relay.error} — ensure araliya-net-relay is running
			</p>
		{/if}
	</header>

	<!-- Mode Switcher -->
	<div class="my-auto space-y-4">
		<div class="grid grid-cols-3 gap-1 rounded-xl border border-border bg-secondary/50 p-1">
			<button
				type="button"
				onclick={() => (mode = 'unlock')}
				class={`flex cursor-pointer items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
					mode === 'unlock'
						? 'bg-card text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'
				}`}
			>
				<Lock class="h-3.5 w-3.5" />
				Unlock
			</button>
			<button
				type="button"
				onclick={() => (mode = 'create')}
				class={`flex cursor-pointer items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
					mode === 'create'
						? 'bg-card text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'
				}`}
			>
				<UserPlus class="h-3.5 w-3.5" />
				Create
			</button>
			<button
				type="button"
				onclick={() => (mode = 'recover')}
				class={`flex cursor-pointer items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
					mode === 'recover'
						? 'bg-card text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'
				}`}
			>
				<RotateCcw class="h-3.5 w-3.5" />
				Recover
			</button>
		</div>

		{#if mode === 'unlock'}
			<Card.Root class="border-border/80 bg-card/90 backdrop-blur-md">
				<Card.Header class="pb-3">
					<Card.Title class="flex items-center gap-2 text-base">
						<KeyRound class="h-4 w-4 text-primary" />
						Unlock Local Vault
					</Card.Title>
					<Card.Description class="text-xs">
						Decrypt your local <span class="font-mono">araliya_vault_v1</span> key in WASM memory. Your password never leaves this device.
					</Card.Description>
				</Card.Header>

				<form onsubmit={handleUnlock}>
					<Card.Content class="space-y-3">
						{#if !sessionStore.hasVault}
							<div class="rounded-lg border border-border bg-background/60 p-3 text-xs text-muted-foreground">
								No local vault found in this browser. Switch to <span class="font-semibold text-foreground">Create</span> or <span class="font-semibold text-foreground">Recover</span>.
							</div>
						{/if}

						<div class="space-y-1.5">
							<Label for="unlock-password" class="text-xs">Vault Password</Label>
							<div class="relative">
								<Input
									id="unlock-password"
									type={showUnlockPassword ? 'text' : 'password'}
									bind:value={unlockPassword}
									placeholder="Enter your local vault password"
									autocomplete="current-password"
									disabled={!sessionStore.hasVault || sessionStore.isAuthenticating}
									class="h-10 bg-background/70 pr-10 text-sm"
								/>
								<button
									type="button"
									onclick={() => (showUnlockPassword = !showUnlockPassword)}
									aria-label={showUnlockPassword ? 'Hide password' : 'Show password'}
									class="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
								>
									{#if showUnlockPassword}
										<EyeOff class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</button>
							</div>
						</div>
					</Card.Content>

					<Card.Footer class="pt-2">
						<Button
							type="submit"
							size="lg"
							disabled={!sessionStore.hasVault || sessionStore.isAuthenticating}
							class="w-full cursor-pointer font-semibold"
						>
							<ShieldCheck class="mr-2 h-4 w-4" />
							{sessionStore.isAuthenticating ? 'Unlocking...' : 'Unlock Vault'}
						</Button>
					</Card.Footer>
				</form>
			</Card.Root>
		{:else if mode === 'create'}
			<Card.Root class="border-border/80 bg-card/90 backdrop-blur-md">
				<Card.Header class="pb-3">
					<div class="flex items-center justify-between">
						<Card.Title class="flex items-center gap-2 text-base">
							<UserPlus class="h-4 w-4 text-primary" />
							Create Local Vault
						</Card.Title>
						{#if relay?.genesisMode}
							<Badge variant="outline" class="text-[10px]">Genesis Vouch</Badge>
						{/if}
					</div>
					<Card.Description class="text-xs">
						Generates a fresh Ed25519 identity locally, encrypts it with your password, and prepares relay admission.
					</Card.Description>
				</Card.Header>

				<Card.Content class="space-y-3">
					{#if !createdRecoveryKey || !createdIdentity}
						<form onsubmit={handleCreateAccount} class="space-y-3">
							<div class="space-y-1.5">
								<Label for="create-password" class="text-xs">
									Local Vault Password <span class="font-normal text-muted-foreground">(min 8 chars)</span>
								</Label>
								<div class="relative">
									<Input
										id="create-password"
										type={showCreatePassword ? 'text' : 'password'}
										bind:value={createPassword}
										placeholder="Choose a strong local password"
										autocomplete="new-password"
										minlength={8}
										required
										class="h-10 bg-background/70 pr-10 text-sm"
									/>
									<button
										type="button"
										onclick={() => (showCreatePassword = !showCreatePassword)}
										aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
										class="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
									>
										{#if showCreatePassword}
											<EyeOff class="h-4 w-4" />
										{:else}
											<Eye class="h-4 w-4" />
										{/if}
									</button>
								</div>
							</div>

							<div class="space-y-1.5">
								<Label for="create-password-confirm" class="text-xs">Confirm Password</Label>
								<Input
									id="create-password-confirm"
									type={showCreatePassword ? 'text' : 'password'}
									bind:value={createConfirmPassword}
									placeholder="Repeat password"
									autocomplete="new-password"
									minlength={8}
									required
									class="h-10 bg-background/70 text-sm"
								/>
							</div>

							<div class="space-y-1.5">
								<Label for="vouch-token-input" class="text-xs">
									Invite Vouch Token
									<span class="font-normal text-muted-foreground">
										{relay?.genesisMode ? '(optional — auto genesis vouch)' : '(paste araliya-vouch-card:v1:...)'}
									</span>
								</Label>
								<Input
									id="vouch-token-input"
									bind:value={peerVouchInput}
									placeholder="araliya-vouch-card:v1:..."
									autocapitalize="none"
									autocomplete="off"
									class="h-10 bg-background/70 font-mono text-xs"
								/>
							</div>

							<Button
								type="submit"
								disabled={sessionStore.isAuthenticating}
								size="lg"
								class="w-full cursor-pointer font-semibold"
							>
								{sessionStore.isAuthenticating
									? 'Generating Vault & Connecting...'
									: 'Create Vault & Identity'}
							</Button>
						</form>
					{:else}
						<div class="space-y-2.5 rounded-lg border border-primary/30 bg-background/70 p-3 font-mono text-[10px]">
							<p class="font-sans text-xs font-semibold text-primary">
								Save your recovery key before continuing:
							</p>
							<p class="font-sans text-[11px] leading-relaxed text-muted-foreground">
								Your private key never leaves this device. Back up this recovery token to restore your profile and private ledger on another browser.
							</p>

							<div class="flex items-center justify-between gap-2 pt-1">
								<span class="truncate text-foreground">pk: {createdIdentity.userPubkey}</span>
								<button
									type="button"
									onclick={() => copyText('public key', createdIdentity.userPubkey)}
									class="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
									aria-label="Copy public key"
								>
									<Copy class="h-3.5 w-3.5" />
								</button>
							</div>

							<div class="flex items-center justify-between gap-2 border-t border-border/60 pt-1.5">
								<span class="break-all text-primary">{createdRecoveryKey}</span>
								<button
									type="button"
									onclick={() => copyText('recovery key', createdRecoveryKey)}
									class="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
									aria-label="Copy recovery key"
								>
									<Copy class="h-3.5 w-3.5" />
								</button>
							</div>

							{#if sessionStore.pendingVouchToken}
								<div class="flex items-center justify-between gap-2 border-t border-border/60 pt-1.5">
									<span class="truncate text-emerald-400">
										vouch: {truncateKey(sessionStore.pendingVouchToken)}
									</span>
									<button
										type="button"
										onclick={() => copyText('vouch token', sessionStore.pendingVouchToken ?? '')}
										class="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
										aria-label="Copy vouch token"
									>
										<Copy class="h-3.5 w-3.5" />
									</button>
								</div>
							{/if}
						</div>

						<Button
							onclick={handleContinueAfterCreation}
							variant="secondary"
							size="lg"
							class="w-full cursor-pointer font-semibold"
						>
							Continue to Onboarding
							<ArrowRight class="ml-2 h-4 w-4" />
						</Button>
					{/if}
				</Card.Content>
			</Card.Root>
		{:else}
			<Card.Root class="border-border/80 bg-card/90 backdrop-blur-md">
				<Card.Header class="pb-3">
					<Card.Title class="flex items-center gap-2 text-base">
						<RotateCcw class="h-4 w-4 text-primary" />
						Recover From Key
					</Card.Title>
					<Card.Description class="text-xs">
						Import your <span class="font-mono">araliya-recovery:v1:...</span> token and protect it with a new local vault password.
					</Card.Description>
				</Card.Header>

				<form onsubmit={handleRecover}>
					<Card.Content class="space-y-3">
						<div class="space-y-1.5">
							<Label for="recovery-key-input" class="text-xs">Recovery Key</Label>
							<Input
								id="recovery-key-input"
								bind:value={recoveryKeyInput}
								placeholder="araliya-recovery:v1:..."
								autocapitalize="none"
								autocomplete="off"
								required
								class="h-10 bg-background/70 font-mono text-xs"
							/>
						</div>

						<div class="space-y-1.5">
							<Label for="recover-password" class="text-xs">
								New Vault Password <span class="font-normal text-muted-foreground">(min 8 chars)</span>
							</Label>
							<div class="relative">
								<Input
									id="recover-password"
									type={showRecoverPassword ? 'text' : 'password'}
									bind:value={recoverPassword}
									placeholder="Choose a new local password"
									autocomplete="new-password"
									minlength={8}
									required
									class="h-10 bg-background/70 pr-10 text-sm"
								/>
								<button
									type="button"
									onclick={() => (showRecoverPassword = !showRecoverPassword)}
									aria-label={showRecoverPassword ? 'Hide password' : 'Show password'}
									class="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
								>
									{#if showRecoverPassword}
										<EyeOff class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</button>
							</div>
						</div>

						<div class="space-y-1.5">
							<Label for="recover-password-confirm" class="text-xs">Confirm Password</Label>
							<Input
								id="recover-password-confirm"
								type={showRecoverPassword ? 'text' : 'password'}
								bind:value={recoverConfirmPassword}
								placeholder="Repeat password"
								autocomplete="new-password"
								minlength={8}
								required
								class="h-10 bg-background/70 text-sm"
							/>
						</div>
					</Card.Content>

					<Card.Footer class="pt-2">
						<Button
							type="submit"
							size="lg"
							disabled={sessionStore.isAuthenticating}
							class="w-full cursor-pointer font-semibold"
						>
							<ShieldCheck class="mr-2 h-4 w-4" />
							{sessionStore.isAuthenticating ? 'Restoring Vault...' : 'Restore & Unlock'}
						</Button>
					</Card.Footer>
				</form>
			</Card.Root>
		{/if}
	</div>
</div>
