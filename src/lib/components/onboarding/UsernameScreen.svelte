<script lang="ts">
	import { ledgerStore } from '$lib/stores/ledger.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import PublicLedgerCheckbox from '$lib/components/ui/PublicLedgerCheckbox.svelte';
	import { toast } from 'svelte-sonner';
	import { ArrowLeft, ArrowRight, Copy, Info, Terminal } from 'lucide-svelte';

	let username = $state(ledgerStore.profile.username.value);
	let keepPublic = $state(ledgerStore.profile.username.visibility === 'public');
	let vouchTokenInput = $state(sessionStore.pendingVouchToken ?? '');
	let errorMessage = $state('');
	let isSaving = $state(false);

	let needsManualVouchUi = $derived(
		!sessionStore.relayStatus?.httpAvailable || Boolean(sessionStore.pendingVouchToken)
	);

	function buildVouchCurlCommand(pubkey: string): string {
		return `curl -s -X POST http://127.0.0.1:8080/genesis/vouch -H 'Content-Type: application/json' -d '{"subject_pubkey":"${pubkey}","ttl_secs":86400}'`;
	}

	async function copyText(label: string, value: string) {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(`Copied ${label}`);
		} catch {
			toast.error(`Could not copy ${label}`);
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const cleaned = username.trim().replace(/^@+/, '');
		if (cleaned.length < 2) {
			errorMessage = 'Please pick a username (at least 2 characters).';
			return;
		}
		errorMessage = '';
		isSaving = true;
		try {
			if (!sessionStore.identity) throw new Error('Vault is locked');
			const cleanedVouch = vouchTokenInput.trim() || null;
			sessionStore.setPendingVouchToken(cleanedVouch);
			const { usedVouch } = await ledgerStore.saveUsername(
				cleaned,
				keepPublic,
				cleanedVouch
			);
			if (usedVouch) {
				sessionStore.clearPendingVouch();
			}
			toast.success(
				keepPublic
					? `Registered @${cleaned} on relay`
					: `Admitted @${cleaned} (profile field encrypted)`
			);
			await sessionStore.advanceOnboardingStep('identity');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save username on relay');
		} finally {
			isSaving = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex h-full flex-col justify-between px-6 py-6">
	<!-- Top Step Bar -->
	<div class="flex items-center justify-between pt-1">
		<button
			type="button"
			onclick={() => sessionStore.setOnboardingStep('manifesto')}
			class="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="h-3.5 w-3.5" />
			Back
		</button>
		<span class="font-mono text-[11px] text-muted-foreground">02 / 04</span>
	</div>

	<!-- Prompt & Input -->
	<div class="my-auto space-y-6">
		<div class="space-y-2">
			<p class="font-mono text-xs uppercase tracking-widest text-primary">
				Genesis Profile · Step 1
			</p>
			<h1 class="font-heading text-2xl font-bold tracking-tight">
				Let's pick a username
			</h1>
		</div>

		<div class="space-y-3">
			<Label for="username-input" class="text-xs text-muted-foreground">
				Handle
			</Label>
			<div class="relative">
				<span class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-mono text-base text-muted-foreground">
					@
				</span>
				<Input
					id="username-input"
					bind:value={username}
					placeholder="satoshi"
					autocomplete="username"
					autocapitalize="none"
					class="h-12 pl-8 text-base font-medium"
				/>
			</div>

			{#if errorMessage}
				<p class="text-xs text-destructive">{errorMessage}</p>
			{/if}

			<div class="pt-1">
				<PublicLedgerCheckbox bind:checked={keepPublic} label="keep public" />
			</div>

			{#if needsManualVouchUi && sessionStore.identity}
				<div class="space-y-2 rounded-xl border border-border/70 bg-card/70 p-3 text-xs">
					<div class="flex items-center justify-between gap-2">
						<span class="flex items-center gap-1.5 font-semibold text-foreground">
							<Terminal class="h-3.5 w-3.5 text-primary" />
							Vouch Card Token
						</span>
						<div class="flex items-center gap-2">
							<button
								type="button"
								onclick={() => copyText('public key', sessionStore.identity?.userPubkey ?? '')}
								class="inline-flex cursor-pointer items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
							>
								<Copy class="h-3 w-3" />
								pk
							</button>
							<button
								type="button"
								onclick={() =>
									copyText(
										'curl command',
										buildVouchCurlCommand(sessionStore.identity?.userPubkey ?? '')
									)}
								class="inline-flex cursor-pointer items-center gap-1 text-[10px] text-primary hover:underline"
							>
								<Copy class="h-3 w-3" />
								curl
							</button>
						</div>
					</div>
					<Input
						id="username-vouch-input"
						bind:value={vouchTokenInput}
						placeholder="araliya-vouch-card:v1:... (optional if open admission)"
						autocapitalize="none"
						autocomplete="off"
						class="h-9 bg-background/80 font-mono text-[11px]"
					/>
				</div>
			{/if}
		</div>

		<div class="flex items-start gap-2.5 rounded-xl border border-border/70 bg-card/70 p-3.5 text-xs leading-relaxed text-muted-foreground">
			<Info class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
			<p>
				We recommend keeping username public, which means it will be saved on the public part of your data ledger.
			</p>
		</div>
	</div>

	<!-- Continue Action -->
	<div class="pb-4">
		<Button type="submit" disabled={isSaving} size="lg" class="h-12 w-full cursor-pointer font-semibold">
			{isSaving ? 'Saving to Relay...' : 'Continue'}
			<ArrowRight class="ml-2 h-4 w-4" />
		</Button>
	</div>
</form>
