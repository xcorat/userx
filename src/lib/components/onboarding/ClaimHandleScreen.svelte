<script lang="ts">
	import { araliyaService } from '$lib/services/araliya.service';
	import { buildPseudonymousHandle, ledgerStore } from '$lib/stores/ledger.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import RelayStatusPill from '$lib/components/onboarding/RelayStatusPill.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { ArrowRight, Globe, Info, Lock } from 'lucide-svelte';

	let username = $state(ledgerStore.profile.username.value);
	let keepPublic = $state(
		ledgerStore.profile.username.value
			? ledgerStore.profile.username.visibility === 'public'
			: true
	);
	let errorMessage = $state('');
	let isSaving = $state(false);

	let pseudonymousPreview = $derived(
		buildPseudonymousHandle(sessionStore.identity?.userPubkey ?? '', 8)
	);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const cleaned = username.trim().replace(/^@+/, '');
		if (cleaned.length < 2) {
			errorMessage = 'Pick a handle with at least 2 characters.';
			return;
		}
		if (cleaned.length > 64) {
			errorMessage = 'Handle must be 64 characters or fewer.';
			return;
		}

		errorMessage = '';
		isSaving = true;
		try {
			await sessionStore.ensureUnlockedOnRelay();

			const hasReadyVouch = Boolean(
				sessionStore.pendingVouchToken ||
					sessionStore.detectedRelayVouch ||
					sessionStore.relayStatus?.admissionPolicy === 'open'
			);

			if (!sessionStore.isAdmitted && !hasReadyVouch) {
				if (keepPublic) {
					const existing = await araliyaService
						.getUserByUsername(cleaned)
						.catch(() => null);
					if (existing) {
						errorMessage = `@${cleaned} is already taken on this relay.`;
						return;
					}
				}
				if (!sessionStore.isPendingVouch) {
					await sessionStore.startPendingVouchWindow(
						sessionStore.pendingVoucherPubkey,
						null,
						keepPublic ? cleaned : null
					);
				} else {
					await sessionStore.syncRequestedHandleToVoucher(keepPublic ? cleaned : null);
				}
				await ledgerStore.stageUsernameDraft(cleaned, keepPublic);
				toast.success(
					keepPublic
						? `@${cleaned} staged locally — will register once vouched`
						: 'Private handle staged locally — waiting for vouch'
				);
				await sessionStore.advanceOnboardingStep('custody');
				return;
			}

			const useSubmittedVouch =
				!sessionStore.pendingVouchToken && Boolean(sessionStore.detectedRelayVouch);
			const { usedVouch, directoryHandle } = await ledgerStore.saveUsername(
				cleaned,
				keepPublic,
				sessionStore.pendingVouchToken,
				sessionStore.identity?.userPubkey,
				useSubmittedVouch
			);
			if (usedVouch) {
				sessionStore.markAdmittedAfterRegistration(sessionStore.vouchedByHandle);
			}
			toast.success(
				keepPublic
					? `Claimed @${cleaned} in your public namespace`
					: `Encrypted @${cleaned} privately (relay alias @${directoryHandle})`
			);
			await sessionStore.advanceOnboardingStep('custody');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to claim handle on relay');
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
		stepLabel="Step 3 / 8"
		onBack={() => sessionStore.setOnboardingStep('vouch')}
	/>

	<div class="my-auto space-y-5 py-2">
		<div class="space-y-1.5">
			<p class="font-mono text-[11px] uppercase tracking-widest text-primary">
				Stage 3 · Public Identity
			</p>
			<h1 class="font-heading text-2xl font-bold tracking-tight">
				Claim Your Handle
			</h1>
			<p class="text-xs leading-relaxed text-muted-foreground">
				Public handle is searchable, private handle keeps the account hidden.
			</p>
		</div>

		<div class="space-y-3 rounded-2xl border border-border/80 bg-card/85 p-4">
			<div class="space-y-1.5">
				<Label for="handle-input" class="text-xs">Username</Label>
				<div class="relative">
					<span class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-mono text-base text-muted-foreground">
						@
					</span>
					<Input
						id="handle-input"
						bind:value={username}
						placeholder="alice"
						autocomplete="username"
						autocapitalize="none"
						class="h-12 bg-background/70 pl-8 text-base font-medium"
					/>
				</div>
				{#if errorMessage}
					<p class="text-xs text-destructive">{errorMessage}</p>
				{/if}
			</div>

			<div class="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
				<div class="flex items-center gap-2 text-xs">
					<span class="text-muted-foreground">Visibility:</span>
					{#if keepPublic}
						<span class="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 font-semibold text-primary">
							<Globe class="h-3 w-3" />
							Public
						</span>
					{:else}
						<span class="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 font-semibold text-foreground">
							<Lock class="h-3 w-3 text-accent" />
							Private
						</span>
					{/if}
				</div>

				<Button
					type="button"
					size="sm"
					variant="outline"
					onclick={() => (keepPublic = !keepPublic)}
					class="h-7 cursor-pointer text-[11px]"
				>
					{keepPublic ? 'Make Private' : 'Make Public'}
				</Button>
			</div>
		</div>

		<div class="flex items-start gap-2.5 rounded-xl border border-border/70 bg-card/70 p-3.5 text-xs leading-relaxed text-muted-foreground">
			<Info class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
			{#if keepPublic}
				<p>
					<span class="font-semibold text-foreground">Public handle is searchable</span> — your
					<span class="font-semibold text-foreground">@handle</span> appears in the public Users directory so peers can find you and verify your public answers.
				</p>
			{:else}
				<p>
					<span class="font-semibold text-foreground">Private handle keeps the account hidden</span> — your chosen handle stays encrypted inside <span class="font-mono text-foreground">/private</span> and is excluded from the public Users directory (relay alias
					<span class="font-mono text-primary">@{pseudonymousPreview}</span>).
				</p>
			{/if}
		</div>
	</div>

	<div class="pb-2">
		<Button
			type="submit"
			disabled={isSaving}
			size="lg"
			class="h-12 w-full cursor-pointer font-semibold"
		>
			{isSaving ? 'Registering on Relay...' : 'Next'}
			<ArrowRight class="ml-2 h-4 w-4" />
		</Button>
	</div>
</form>
