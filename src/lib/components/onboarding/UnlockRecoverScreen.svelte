<script lang="ts">
	import { sessionStore } from '$lib/stores/session.svelte';
	import RelayStatusPill from '$lib/components/onboarding/RelayStatusPill.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import {
		ArrowRight,
		Eye,
		EyeOff,
		KeyRound,
		Lock,
		RotateCcw,
		ShieldCheck,
		Sprout
	} from 'lucide-svelte';

	type GateMode = 'unlock' | 'paste';

	let mode = $state<GateMode>(sessionStore.hasVault ? 'unlock' : 'paste');
	let unlockPassword = $state('');
	let showUnlockPassword = $state(false);

	let keyInput = $state('');
	let saveVaultLocally = $state(false);
	let newPassword = $state('');
	let confirmPassword = $state('');
	let showNewPassword = $state(false);

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

	async function handlePasteUnlock(event: SubmitEvent) {
		event.preventDefault();
		if (saveVaultLocally) {
			if (newPassword.length < 8) {
				toast.error('Password must be at least 8 characters');
				return;
			}
			if (newPassword !== confirmPassword) {
				toast.error('Passwords do not match');
				return;
			}
		}
		try {
			await sessionStore.unlockWithKeyInput(keyInput, {
				saveVault: saveVaultLocally,
				password: newPassword
			});
			keyInput = '';
			newPassword = '';
			confirmPassword = '';
			toast.success(
				saveVaultLocally
					? 'Identity restored & encrypted in this browser'
					: 'Unlocked for this browser session'
			);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to unlock with key');
		}
	}
</script>

<div class="flex h-full flex-col justify-between gap-4 overflow-y-auto px-5 py-6">
	<RelayStatusPill showBrand />

	<div class="my-auto space-y-4">
		<div class="grid grid-cols-2 gap-1 rounded-xl border border-border bg-secondary/50 p-1">
			<button
				type="button"
				onclick={() => (mode = 'unlock')}
				class={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
					mode === 'unlock'
						? 'bg-card text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'
				}`}
			>
				<Lock class="h-3.5 w-3.5" />
				Unlock Vault
			</button>
			<button
				type="button"
				onclick={() => (mode = 'paste')}
				class={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
					mode === 'paste'
						? 'bg-card text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'
				}`}
			>
				<RotateCcw class="h-3.5 w-3.5" />
				Paste Key / Recover
			</button>
		</div>

		{#if mode === 'unlock'}
			<Card.Root class="border-border/80 bg-card/90 backdrop-blur-md">
				<Card.Header class="pb-3">
					<Card.Title class="flex items-center gap-2 text-base">
						<KeyRound class="h-4 w-4 text-primary" />
						Welcome Back
					</Card.Title>
					<Card.Description class="text-xs">
						Decrypt your local <span class="font-mono">araliya_vault_v1</span> key in WASM memory. Your password never leaves this device.
					</Card.Description>
				</Card.Header>

				<form onsubmit={handleUnlock}>
					<Card.Content class="space-y-3">
						{#if !sessionStore.hasVault}
							<div class="rounded-lg border border-border bg-background/60 p-3 text-xs text-muted-foreground">
								No encrypted vault is saved in this browser. Switch to <span class="font-semibold text-foreground">Paste Key / Recover</span> or start a new identity below.
							</div>
						{/if}

						<div class="space-y-1.5">
							<Label for="unlock-password" class="text-xs">Vault Password</Label>
							<div class="relative">
								<Input
									id="unlock-password"
									type={showUnlockPassword ? 'text' : 'password'}
									bind:value={unlockPassword}
									placeholder="Enter your local password"
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
		{:else}
			<Card.Root class="border-border/80 bg-card/90 backdrop-blur-md">
				<Card.Header class="pb-3">
					<Card.Title class="flex items-center gap-2 text-base">
						<RotateCcw class="h-4 w-4 text-primary" />
						Unlock With Private / Recovery Key
					</Card.Title>
					<Card.Description class="text-xs">
						Paste your <span class="font-mono">araliya-recovery:v1:...</span> token or base64 Ed25519 key to sign in for this session.
					</Card.Description>
				</Card.Header>

				<form onsubmit={handlePasteUnlock}>
					<Card.Content class="space-y-3">
						<div class="space-y-1.5">
							<Label for="recovery-key-input" class="text-xs">Private or Recovery Key</Label>
							<Input
								id="recovery-key-input"
								type="password"
								bind:value={keyInput}
								placeholder="araliya-recovery:v1:... or base64 key"
								autocapitalize="none"
								autocomplete="off"
								required
								class="h-10 bg-background/70 font-mono text-xs"
							/>
						</div>

						<label class="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/70 bg-background/50 p-2.5 text-xs">
							<input
								type="checkbox"
								bind:checked={saveVaultLocally}
								class="h-4 w-4 accent-[var(--primary)]"
							/>
							<span class="text-foreground">
								Keep encrypted in this browser with a local password
							</span>
						</label>

						{#if saveVaultLocally}
							<div class="space-y-2.5 pt-1">
								<div class="space-y-1.5">
									<Label for="recover-password" class="text-xs">
										Local Vault Password <span class="font-normal text-muted-foreground">(min 8 chars)</span>
									</Label>
									<div class="relative">
										<Input
											id="recover-password"
											type={showNewPassword ? 'text' : 'password'}
											bind:value={newPassword}
											placeholder="Choose a strong local password"
											autocomplete="new-password"
											minlength={8}
											required
											class="h-10 bg-background/70 pr-10 text-sm"
										/>
										<button
											type="button"
											onclick={() => (showNewPassword = !showNewPassword)}
											aria-label={showNewPassword ? 'Hide password' : 'Show password'}
											class="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
										>
											{#if showNewPassword}
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
										type={showNewPassword ? 'text' : 'password'}
										bind:value={confirmPassword}
										placeholder="Repeat password"
										autocomplete="new-password"
										minlength={8}
										required
										class="h-10 bg-background/70 text-sm"
									/>
								</div>
							</div>
						{/if}
					</Card.Content>

					<Card.Footer class="pt-2">
						<Button
							type="submit"
							size="lg"
							disabled={sessionStore.isAuthenticating}
							class="w-full cursor-pointer font-semibold"
						>
							<ShieldCheck class="mr-2 h-4 w-4" />
							{sessionStore.isAuthenticating
								? 'Connecting...'
								: saveVaultLocally
									? 'Restore & Save Vault'
									: 'Unlock for This Session'}
						</Button>
					</Card.Footer>
				</form>
			</Card.Root>
		{/if}
	</div>

	<div class="pb-2 text-center">
		<button
			type="button"
			onclick={() => sessionStore.startFreshOnboarding()}
			class="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-primary hover:underline"
		>
			<Sprout class="h-3.5 w-3.5" />
			New Digital Gardener? Plant Your Roots
			<ArrowRight class="h-3.5 w-3.5" />
		</button>
	</div>
</div>
