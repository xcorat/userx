<script lang="ts">
	import { pubkeyToHex } from '$lib/services/araliya.service';
	import { buildPseudonymousHandle, ledgerStore } from '$lib/stores/ledger.svelte';
	import { onboardingManifestStore } from '$lib/stores/onboarding-manifest.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import type { ThemeId } from '$lib/types';
	import RelayStatusPill from '$lib/components/onboarding/RelayStatusPill.svelte';
	import PublicLedgerCheckbox from '$lib/components/ui/PublicLedgerCheckbox.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { ArrowRight, Check, Palette } from 'lucide-svelte';

	let realName = $state(ledgerStore.profile.realName.value);
	let realNamePublic = $state(ledgerStore.profile.realName.visibility === 'public');

	let dob = $state(ledgerStore.profile.dateOfBirth.value);
	let dobPublic = $state(ledgerStore.profile.dateOfBirth.visibility === 'public');

	let pronouns = $state(ledgerStore.profile.pronouns.value);
	let pronounsPublic = $state(ledgerStore.profile.pronouns.visibility === 'public');
	let nameField = $derived(onboardingManifestStore.profileField('realName'));
	let dateOfBirthField = $derived(onboardingManifestStore.profileField('dateOfBirth'));
	let pronounsField = $derived(onboardingManifestStore.profileField('pronouns'));

	let showThemePicker = $state(false);
	let isSaving = $state(false);

	const PRONOUN_PRESETS = ['they/them', 'she/her', 'he/him', 'any/all'];

	let pk8 = $derived.by(() => {
		const hex = pubkeyToHex(sessionStore.identity?.userPubkey ?? '');
		return hex ? hex.slice(0, 8) : '8f9a3c1e';
	});

	let publicProjectionJson = $derived.by(() => {
		const usernameField = ledgerStore.profile.username;
		const publicHandle =
			usernameField.visibility === 'public' && usernameField.value.trim()
				? usernameField.value.trim()
				: buildPseudonymousHandle(sessionStore.identity?.userPubkey ?? '', 8);

		const vouchedByLabel = sessionStore.isPendingVouch
			? sessionStore.pendingVouchRequest?.voucherHandle
				? `pending (@${sessionStore.pendingVouchRequest.voucherHandle})`
				: 'pending'
			: sessionStore.vouchedByHandle ?? sessionStore.pendingVouchInviter ?? 'araliya';

		const obj: Record<string, string> = {
			username: publicHandle,
			vouched_by: vouchedByLabel
		};
		if (realNamePublic && realName.trim()) obj.name = realName.trim();
		if (dobPublic && dob.trim()) obj.dob = dob.trim();
		if (pronounsPublic && pronouns.trim()) obj.pronouns = pronouns.trim();
		return JSON.stringify(obj);
	});

	let privateCipherPreview = $derived.by(() => {
		const priv: Record<string, string> = {};
		if (
			ledgerStore.profile.username.visibility === 'private' &&
			ledgerStore.profile.username.value.trim()
		) {
			priv.username = ledgerStore.profile.username.value.trim();
		}
		if (!realNamePublic && realName.trim()) priv.name = realName.trim();
		if (!dobPublic && dob.trim()) priv.dob = dob.trim();
		if (!pronounsPublic && pronouns.trim()) priv.pronouns = pronouns.trim();

		const src = JSON.stringify(priv);
		let h1 = 0x811c9dc5;
		let h2 = 0x9e3779b9;
		for (let i = 0; i < src.length; i += 1) {
			const c = src.charCodeAt(i);
			h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
			h2 = Math.imul(h2 ^ (c + i), 0x85ebca6b) >>> 0;
		}
		const p1 = h1.toString(16).padStart(8, '0');
		const p2 = h2.toString(16).padStart(8, '0');
		return `0x${p1}${p2.slice(0, 4)}…${p2.slice(4)}`;
	});

	function selectTheme(id: ThemeId) {
		themeStore.setTheme(id);
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		isSaving = true;
		try {
			const details = {
				realName,
				realNamePublic,
				dob,
				dobPublic,
				pronouns,
				pronounsPublic
			};
			if (!sessionStore.isAdmitted) {
				await ledgerStore.stageIdentityDetailsDraft(details);
				await sessionStore.advanceOnboardingStep('demo-public');
				return;
			}
			await sessionStore.ensureUnlockedOnRelay();
			await ledgerStore.saveIdentityDetails(details, sessionStore.identity?.userPubkey);
			await sessionStore.advanceOnboardingStep('demo-public');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save optional details');
		} finally {
			isSaving = false;
		}
	}
</script>

<form
	onsubmit={handleSubmit}
	class="flex h-full flex-col justify-between gap-3 overflow-y-auto px-5 py-6"
>
	<RelayStatusPill
		stepLabel="Step 5 / 8"
		onBack={() => sessionStore.setOnboardingStep('custody')}
	/>

	<div class="my-auto space-y-3.5 py-1">
		<div class="space-y-1">
			<p class="font-mono text-[11px] uppercase tracking-widest text-primary">
				Stage 3 · Profile &amp; Relay Preview
			</p>
			<h1 class="font-heading text-xl font-bold tracking-tight">
				Optional Details &amp; Look
			</h1>
			<p class="text-[11px] text-muted-foreground">
				Encrypted in your <span class="font-mono text-foreground">/private</span> namespace by default.
			</p>
		</div>

		<!-- Optional Profile Inputs -->
		<div class="space-y-2.5 rounded-2xl border border-border/80 bg-card/80 p-3.5">
			<div class="space-y-1">
				<div class="flex items-center justify-between gap-2">
					<Label for="detail-name" class="text-[11px] font-semibold">
						{nameField?.label ?? 'Name'}
						{#if nameField && !nameField.required}
							<span class="font-normal text-muted-foreground">(optional)</span>
						{/if}
					</Label>
					<PublicLedgerCheckbox bind:checked={realNamePublic} compact />
				</div>
				<Input
					id="detail-name"
					bind:value={realName}
					placeholder="Alice"
					class="h-9 bg-background/70 text-xs"
				/>
			</div>

			<div class="space-y-2.5">
				<div class="space-y-1">
					<div class="flex items-center justify-between gap-2">
						<Label for="detail-dob" class="text-[11px] font-semibold">
							{dateOfBirthField?.label ?? 'Date of Birth'}
						</Label>
						<PublicLedgerCheckbox bind:checked={dobPublic} compact />
					</div>
					<Input
						id="detail-dob"
						type="date"
						bind:value={dob}
						class="h-9 bg-background/70 text-xs"
					/>
				</div>

				<div class="space-y-1">
					<div class="flex items-center justify-between gap-2">
						<Label for="detail-pronouns" class="text-[11px] font-semibold">
							{pronounsField?.label ?? 'Pronouns'}
						</Label>
						<PublicLedgerCheckbox bind:checked={pronounsPublic} compact />
					</div>
					<Input
						id="detail-pronouns"
						bind:value={pronouns}
						placeholder="they/them"
						class="h-9 bg-background/70 text-xs"
					/>
				</div>
			</div>

			<div class="flex flex-wrap gap-1.5">
				{#each PRONOUN_PRESETS as preset}
					<button
						type="button"
						onclick={() => (pronouns = preset)}
						class={`cursor-pointer rounded-full border px-2.5 py-0.5 text-[10px] transition-colors ${
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

		<!-- Live Relay Storage Preview -->
		<div class="space-y-1.5 rounded-2xl border border-border/80 bg-card/85 p-3">
			<p class="text-[11px] font-semibold text-foreground">
				How Your Data Looks on the Relay (Encrypted at Rest)
			</p>
			<pre class="overflow-x-auto rounded-lg bg-background/80 p-2.5 font-mono text-[10px] leading-relaxed text-muted-foreground">Namespace: araliya.{pk8}
├── /public  → {publicProjectionJson}
└── /private → 🔒 [{privateCipherPreview}]</pre>
		</div>

		<!-- Theme Selection Row -->
		<div class="space-y-2 rounded-2xl border border-border/80 bg-card/80 p-3">
			<div class="flex items-center justify-between gap-2">
				<div class="flex items-center gap-2 text-xs">
					<Palette class="h-3.5 w-3.5 text-primary" />
					<span class="text-muted-foreground">Selected Theme:</span>
					<span class="font-semibold text-foreground">{themeStore.currentTheme.name}</span>
				</div>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onclick={() => (showThemePicker = !showThemePicker)}
					class="h-7 cursor-pointer text-[11px]"
				>
					{showThemePicker ? 'Done' : 'Change Theme'}
				</Button>
			</div>

			{#if showThemePicker}
				<div class="grid grid-cols-1 gap-1.5 border-t border-border/60 pt-2">
					{#each themeStore.availableThemes as theme (theme.id)}
						{@const isSelected = themeStore.themeId === theme.id}
						<button
							type="button"
							onclick={() => selectTheme(theme.id)}
							class={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-2.5 py-2 text-left text-xs transition-colors ${
								isSelected
									? 'border-primary bg-primary/15 text-foreground'
									: 'border-border bg-background/60 text-muted-foreground hover:text-foreground'
							}`}
						>
							<span class="font-medium">{theme.name}</span>
							<span class="flex items-center gap-1.5">
								<span
									class="h-3 w-3 rounded-full border border-white/15"
									style={`background-color: ${theme.swatches.bg};`}
								></span>
								<span
									class="h-3 w-3 rounded-full"
									style={`background-color: ${theme.swatches.primary};`}
								></span>
								<span
									class="h-3 w-3 rounded-full"
									style={`background-color: ${theme.swatches.accent};`}
								></span>
								{#if isSelected}
									<Check class="ml-1 h-3.5 w-3.5 text-primary" />
								{/if}
							</span>
						</button>
					{/each}
					<p class="text-[10px] text-muted-foreground">
						Saved strictly locally on this device — never published to the relay.
					</p>
				</div>
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
			{isSaving ? 'Syncing Encrypted Profile...' : 'Explore Questions'}
			<ArrowRight class="ml-2 h-4 w-4" />
		</Button>
	</div>
</form>
