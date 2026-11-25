<script lang="ts">
	import { sessionStore } from '$lib/stores/session.svelte';
	import type { KeyCustodyMode } from '$lib/types';
	import RelayStatusPill from '$lib/components/onboarding/RelayStatusPill.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { ArrowRight, Copy, Eye, EyeOff, HardDrive, LockKeyhole, Server } from 'lucide-svelte';

	let selectedMode = $state<KeyCustodyMode>(sessionStore.custodyMode);
	let backupConfirmed = $state(sessionStore.custodyMode === 'manual-no-store');

	let newVaultPassword = $state('');
	let confirmVaultPassword = $state('');
	let showPassword = $state(false);
	let isSaving = $state(false);

	let relay = $derived(sessionStore.relayStatus);
	let needsNewVaultPassword = $derived(
		selectedMode === 'browser-encrypted' && !sessionStore.hasVault
	);
	let requiresExternalBackupCheck = $derived(selectedMode !== 'browser-encrypted');

	function formatRelayLabel(): string {
		if (!relay?.connected) return 'local / offline';
		if (relay.endpointId) {
			return relay.endpointId.length > 18
				? `${relay.endpointId.slice(0, 10)}…${relay.endpointId.slice(-6)}`
				: relay.endpointId;
		}
		return relay.baseUrl || 'relay-01.araliya';
	}

	async function copyRecoveryKey() {
		try {
			const payload = await sessionStore.getExportableSecretAndRecovery();
			await navigator.clipboard.writeText(payload.recoveryKey);
			toast.success('Copied Private Recovery Key');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Could not copy private key');
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (requiresExternalBackupCheck && !backupConfirmed) {
			toast.error('Confirm that you saved your Private Key before wiping browser storage');
			return;
		}
		if (needsNewVaultPassword) {
			if (newVaultPassword.length < 8) {
				toast.error('Password must be at least 8 characters');
				return;
			}
			if (newVaultPassword !== confirmVaultPassword) {
				toast.error('Passwords do not match');
				return;
			}
		}

		isSaving = true;
		try {
			await sessionStore.applyCustodySelection(
				selectedMode,
				needsNewVaultPassword ? newVaultPassword : undefined
			);
			newVaultPassword = '';
			confirmVaultPassword = '';
			await sessionStore.advanceOnboardingStep('details');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to update key custody');
		} finally {
			isSaving = false;
		}
	}
</script>

<form
	onsubmit={handleSubmit}
	class="flex h-full flex-col justify-between gap-4 overflow-y-auto px-5 py-6"
>
	<RelayStatusPill
		stepLabel="06 / 10"
		onBack={() => sessionStore.setOnboardingStep('handle')}
	/>

	<div class="my-auto space-y-4 py-2">
		<div class="space-y-1.5">
			<p class="font-mono text-[11px] uppercase tracking-widest text-primary">
				Stage 3 · Storage &amp; Key Custody
			</p>
			<h1 class="font-heading text-2xl font-bold tracking-tight">
				Where Your Data Lives
			</h1>
		</div>

		<!-- Relay Storage Explainer -->
		<div class="space-y-2 rounded-2xl border border-border/80 bg-card/85 p-3.5 text-xs">
			<div class="flex items-center justify-between gap-2">
				<span class="flex items-center gap-1.5 font-semibold text-foreground">
					<Server class="h-3.5 w-3.5 text-primary" />
					Connected araliya-net Relay
				</span>
				<span class="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">
					{formatRelayLabel()}
				</span>
			</div>
			<p class="text-[11px] leading-relaxed text-muted-foreground">
				You can run your own relay anytime—soon with granular controls over exactly which data you host.
			</p>
			<div class="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/10 p-2.5 text-[11px] leading-relaxed text-foreground">
				<LockKeyhole class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
				<span>
					Your private data is locked on your device (<span class="font-mono">XChaCha20-Poly1305</span>) with keys derived from your Private Key before hitting the relay. Even relay operators cannot read it.
				</span>
			</div>
		</div>

		<!-- 3-Way Key Custody Selector -->
		<div class="space-y-2">
			<p class="flex items-center gap-1.5 text-xs font-semibold text-foreground">
				<HardDrive class="h-3.5 w-3.5 text-primary" />
				How do you want to store your Private Key?
			</p>

			<button
				type="button"
				onclick={() => (selectedMode = 'browser-encrypted')}
				class={`flex w-full cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
					selectedMode === 'browser-encrypted'
						? 'border-primary bg-primary/10 ring-1 ring-primary'
						: 'border-border bg-card/70 hover:bg-card'
				}`}
			>
				<span
					class={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
						selectedMode === 'browser-encrypted'
							? 'border-primary bg-primary'
							: 'border-muted-foreground/60'
					}`}
				></span>
				<div class="space-y-0.5">
					<p class="text-xs font-semibold text-foreground">
						1. Keep encrypted in this browser
						<span class="font-normal text-primary">(Default)</span>
					</p>
					<p class="text-[11px] text-muted-foreground">
						Fast unlock with your local password.
					</p>
				</div>
			</button>

			<button
				type="button"
				onclick={() => (selectedMode = 'password-vault-wiped')}
				class={`flex w-full cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
					selectedMode === 'password-vault-wiped'
						? 'border-primary bg-primary/10 ring-1 ring-primary'
						: 'border-border bg-card/70 hover:bg-card'
				}`}
			>
				<span
					class={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
						selectedMode === 'password-vault-wiped'
							? 'border-primary bg-primary'
							: 'border-muted-foreground/60'
					}`}
				></span>
				<div class="space-y-0.5">
					<p class="text-xs font-semibold text-foreground">
						2. Save in a Password Vault &amp; wipe from browser
					</p>
					<p class="text-[11px] text-muted-foreground">
						Removes the local encrypted vault after you copy your key.
					</p>
				</div>
			</button>

			<button
				type="button"
				onclick={() => (selectedMode = 'manual-no-store')}
				class={`flex w-full cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
					selectedMode === 'manual-no-store'
						? 'border-primary bg-primary/10 ring-1 ring-primary'
						: 'border-border bg-card/70 hover:bg-card'
				}`}
			>
				<span
					class={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
						selectedMode === 'manual-no-store'
							? 'border-primary bg-primary'
							: 'border-muted-foreground/60'
					}`}
				></span>
				<div class="space-y-0.5">
					<p class="text-xs font-semibold text-foreground">
						3. Do not store — I will copy and paste it every session
					</p>
					<p class="text-[11px] text-muted-foreground">
						{sessionStore.custodyMode === 'manual-no-store'
							? 'Active from Step 3 — no vault stored in this browser.'
							: 'Keeps key only in active tab memory until closed.'}
					</p>
				</div>
			</button>

			{#if needsNewVaultPassword}
				<div class="space-y-2 rounded-xl border border-primary/30 bg-card/85 p-3">
					<p class="text-[11px] font-semibold text-foreground">
						Set a Local Password to Encrypt in This Browser
					</p>
					<div class="relative">
						<Label for="custody-new-password" class="sr-only">Local Password</Label>
						<Input
							id="custody-new-password"
							type={showPassword ? 'text' : 'password'}
							bind:value={newVaultPassword}
							placeholder="Local password (min 8 chars)"
							autocomplete="new-password"
							minlength={8}
							required
							class="h-9 bg-background/70 pr-9 text-xs"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							class="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
						>
							{#if showPassword}
								<EyeOff class="h-3.5 w-3.5" />
							{:else}
								<Eye class="h-3.5 w-3.5" />
							{/if}
						</button>
					</div>
					<Input
						id="custody-confirm-password"
						type={showPassword ? 'text' : 'password'}
						bind:value={confirmVaultPassword}
						placeholder="Confirm password"
						autocomplete="new-password"
						minlength={8}
						required
						class="h-9 bg-background/70 text-xs"
					/>
				</div>
			{/if}

			{#if requiresExternalBackupCheck}
				<div class="space-y-2 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-xs">
					<div class="flex items-center justify-between gap-2">
						<span class="text-[11px] font-semibold text-amber-200">
							Back up your key before wiping browser vault
						</span>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onclick={copyRecoveryKey}
							class="h-7 cursor-pointer text-[10px]"
						>
							<Copy class="mr-1 h-3 w-3" />
							Copy Private Key
						</Button>
					</div>
					<label class="flex cursor-pointer items-start gap-2 text-[11px] text-foreground">
						<input
							type="checkbox"
							bind:checked={backupConfirmed}
							class="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
						/>
						<span>I have saved my Private Key outside this browser.</span>
					</label>
				</div>
			{/if}

			<p class="text-[10px] leading-relaxed text-muted-foreground">
				Coming soon: optional encrypted key backup on storage relays protected by your password.
			</p>
		</div>
	</div>

	<div class="pb-2">
		<Button
			type="submit"
			disabled={isSaving}
			size="lg"
			class="h-12 w-full cursor-pointer font-semibold"
		>
			{isSaving ? 'Applying Custody...' : 'Next'}
			<ArrowRight class="ml-2 h-4 w-4" />
		</Button>
	</div>
</form>
