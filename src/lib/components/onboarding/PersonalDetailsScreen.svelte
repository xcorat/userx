<script lang="ts">
	import { ledgerStore } from '$lib/stores/ledger.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import PublicLedgerCheckbox from '$lib/components/ui/PublicLedgerCheckbox.svelte';
	import { toast } from 'svelte-sonner';
	import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-svelte';

	let realName = $state(ledgerStore.profile.realName.value);
	let realNamePublic = $state(ledgerStore.profile.realName.visibility === 'public');

	let dob = $state(ledgerStore.profile.dateOfBirth.value);
	let dobPublic = $state(ledgerStore.profile.dateOfBirth.visibility === 'public');

	let pronouns = $state(ledgerStore.profile.pronouns.value);
	let pronounsPublic = $state(ledgerStore.profile.pronouns.visibility === 'public');

	let errorMessage = $state('');
	let isSaving = $state(false);

	const PRONOUN_PRESETS = ['they/them', 'she/her', 'he/him', 'any/all'];

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!realName.trim()) {
			errorMessage = 'Real name is mandatory.';
			return;
		}
		errorMessage = '';
		isSaving = true;
		try {
			if (!sessionStore.identity) throw new Error('Vault is locked');
			await ledgerStore.saveIdentityDetails({
				realName,
				realNamePublic,
				dob,
				dobPublic,
				pronouns,
				pronounsPublic
			});
			await sessionStore.advanceOnboardingStep('theme');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to sync profile fields');
		} finally {
			isSaving = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex h-full flex-col justify-between overflow-y-auto px-6 py-6">
	<!-- Top Step Bar -->
	<div class="flex items-center justify-between pt-1">
		<button
			type="button"
			onclick={() => sessionStore.setOnboardingStep('username')}
			class="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="h-3.5 w-3.5" />
			Back
		</button>
		<span class="font-mono text-[11px] text-muted-foreground">03 / 04</span>
	</div>

	<div class="my-auto space-y-5 py-4">
		<div class="space-y-1.5">
			<p class="font-mono text-xs uppercase tracking-widest text-primary">
				Genesis Profile · Step 2
			</p>
			<h1 class="font-heading text-2xl font-bold tracking-tight">
				Who are you?
			</h1>
		</div>

		<!-- Real Name (Mandatory) -->
		<div class="space-y-2 rounded-xl border border-border/70 bg-card/60 p-3.5">
			<div class="flex items-center justify-between gap-2">
				<Label for="realname-input" class="text-xs font-semibold">
					Real Name <span class="text-destructive">*</span>
				</Label>
				<PublicLedgerCheckbox bind:checked={realNamePublic} compact />
			</div>
			<Input
				id="realname-input"
				bind:value={realName}
				placeholder="Your full or legal name"
				required
				class="h-10 bg-background/70"
			/>
			{#if errorMessage}
				<p class="text-xs text-destructive">{errorMessage}</p>
			{/if}
		</div>

		<!-- DoB (Optional) -->
		<div class="space-y-2 rounded-xl border border-border/70 bg-card/60 p-3.5">
			<div class="flex items-center justify-between gap-2">
				<Label for="dob-input" class="text-xs font-semibold">
					Date of Birth <span class="font-normal text-muted-foreground">(optional)</span>
				</Label>
				<PublicLedgerCheckbox bind:checked={dobPublic} compact />
			</div>
			<Input
				id="dob-input"
				type="date"
				bind:value={dob}
				class="h-10 bg-background/70"
			/>
		</div>

		<!-- Pronouns (Optional) -->
		<div class="space-y-2 rounded-xl border border-border/70 bg-card/60 p-3.5">
			<div class="flex items-center justify-between gap-2">
				<Label for="pronouns-input" class="text-xs font-semibold">
					Pronouns <span class="font-normal text-muted-foreground">(optional)</span>
				</Label>
				<PublicLedgerCheckbox bind:checked={pronounsPublic} compact />
			</div>
			<Input
				id="pronouns-input"
				bind:value={pronouns}
				placeholder="e.g. they/them"
				class="h-10 bg-background/70"
			/>
			<div class="flex flex-wrap gap-1.5 pt-0.5">
				{#each PRONOUN_PRESETS as preset}
					<button
						type="button"
						onclick={() => (pronouns = preset)}
						class={`cursor-pointer rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
							pronouns === preset
								? 'border-primary bg-primary/15 text-foreground'
								: 'border-border bg-background/60 text-muted-foreground hover:text-foreground'
						}`}
					>
						{preset}
					</button>
				{/each}
			</div>
		</div>

		<!-- Zero-Knowledge Privacy Callout -->
		<div class="flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary/10 p-3.5 text-xs leading-relaxed text-foreground/90">
			<LockKeyhole class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
			<p>
				These can stay private, so no one (even app owners) can see your answers — only those who you grant access to can see.
			</p>
		</div>
	</div>

	<!-- Continue Action -->
	<div class="pt-2 pb-4">
		<Button type="submit" disabled={isSaving} size="lg" class="h-12 w-full cursor-pointer font-semibold">
			{isSaving ? 'Syncing...' : 'Continue'}
			<ArrowRight class="ml-2 h-4 w-4" />
		</Button>
	</div>
</form>
