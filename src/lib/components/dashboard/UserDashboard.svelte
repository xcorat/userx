<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ledgerStore } from '$lib/stores/ledger.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import type { ProfileFieldKey, ThemeId } from '$lib/types';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import { toast } from 'svelte-sonner';
	import {
		Activity,
		Check,
		Copy,
		Database,
		Globe,
		HardDrive,
		KeyRound,
		Lock,
		LogOut,
		Palette,
		Plus,
		RotateCcw,
		Shield,
		User
	} from 'lucide-svelte';

	type DashboardSection = 'activity' | 'profile' | 'settings';

	let activeSection = $state<DashboardSection>('activity');
	let exportedRecoveryKey = $state<string | null>(null);
	let isExportingRecovery = $state(false);

	let profileFields = $derived(Object.values(ledgerStore.profile));
	let publicProjection = $derived(ledgerStore.publicLedgerProjection);
	let privateStore = $derived(ledgerStore.privateEncryptedStore);

	let custodyLabel = $derived(
		sessionStore.custodyMode === 'browser-encrypted'
			? 'Browser Encrypted Vault'
			: sessionStore.custodyMode === 'password-vault-wiped'
				? 'External Vault (Wiped)'
				: 'Manual Session Key'
	);

	function switchSection(section: DashboardSection) {
		activeSection = section;
		if (section !== 'settings') {
			exportedRecoveryKey = null;
		}
	}

	async function handleUpdateFieldValue(key: ProfileFieldKey, value: string) {
		try {
			if (!sessionStore.identity) throw new Error('Vault is locked');
			await ledgerStore.updateProfileFieldValue(
				key,
				value,
				sessionStore.identity.userPubkey
			);
			toast.success(`Saved ${ledgerStore.profile[key].label}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save profile field');
		}
	}

	async function handleToggleFieldVisibility(key: ProfileFieldKey) {
		try {
			if (!sessionStore.identity) throw new Error('Vault is locked');
			await ledgerStore.toggleProfileFieldVisibility(key, sessionStore.identity.userPubkey);
			const updated = ledgerStore.profile[key];
			toast.success(
				`${updated.label} moved to ${
					updated.visibility === 'public' ? 'Public Ledger (Relay)' : 'Private Store'
				}`
			);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to update visibility on relay');
		}
	}

	async function handleToggleAnswerVisibility(questionCid: string) {
		try {
			if (!sessionStore.identity) throw new Error('Vault is locked');
			await ledgerStore.toggleAnswerVisibility(questionCid);
			toast.success('Updated answer visibility on relay');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to update answer on relay');
		}
	}

	function handleSelectTheme(id: ThemeId) {
		themeStore.setTheme(id);
		toast.success('Theme updated locally (not saved to ledger)');
	}

	function handleRevisitOnboarding() {
		exportedRecoveryKey = null;
		sessionStore.setOnboardingStep('welcome');
		if (page.url.pathname !== '/') {
			goto('/');
		}
	}

	function handleOpenAskQuestion() {
		exportedRecoveryKey = null;
		sessionStore.setOnboardingStep('ask-first');
		if (page.url.pathname !== '/') {
			goto('/');
		}
	}

	async function handleExportRecoveryKey() {
		isExportingRecovery = true;
		try {
			exportedRecoveryKey = await sessionStore.exportRecoveryKey();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to export recovery key');
		} finally {
			isExportingRecovery = false;
		}
	}

	async function copyRecoveryKey() {
		if (!exportedRecoveryKey) return;
		try {
			await navigator.clipboard.writeText(exportedRecoveryKey);
			toast.success('Copied recovery key');
		} catch {
			toast.error('Could not copy recovery key');
		}
	}

	async function copyPublicKey() {
		const pk = sessionStore.identity?.userPubkey;
		if (!pk) return;
		try {
			await navigator.clipboard.writeText(pk);
			toast.success('Copied public key');
		} catch {
			toast.error('Could not copy public key');
		}
	}

	async function handleLockVault() {
		exportedRecoveryKey = null;
		await sessionStore.lock();
		if (page.url.pathname !== '/') {
			goto('/');
		}
	}

	async function handleResetVault() {
		exportedRecoveryKey = null;
		await sessionStore.resetAccount();
		toast.success('Cleared local encrypted vault & session');
		if (page.url.pathname !== '/') {
			goto('/');
		}
	}
</script>

<div class="flex h-full flex-col overflow-hidden px-4 pt-3 pb-2">
	<!-- Header -->
	<header class="flex items-center justify-between gap-2 pb-3">
		<div>
			<h1 class="font-heading text-lg font-bold tracking-tight">
				{ledgerStore.profile.username.value
					? `@${ledgerStore.profile.username.value}`
					: 'User Dashboard'}
			</h1>
			<p class="font-mono text-[11px] text-muted-foreground">
				pk: {sessionStore.identity?.userPubkey.slice(0, 18) ?? '—'}…
			</p>
		</div>
		<Badge variant="outline" class="gap-1 font-mono text-[10px]">
			<Shield class="h-3 w-3 text-primary" />
			{sessionStore.relayStatus?.connected ? 'Iroh Connected' : 'Offline'}
		</Badge>
	</header>

	<!-- Segmented Section Switcher -->
	<div class="grid grid-cols-3 gap-1 rounded-xl border border-border bg-secondary/50 p-1">
		<button
			type="button"
			onclick={() => switchSection('activity')}
			class={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
				activeSection === 'activity'
					? 'bg-card text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'
			}`}
		>
			<Activity class="h-3.5 w-3.5" />
			Activity
		</button>
		<button
			type="button"
			onclick={() => switchSection('profile')}
			class={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
				activeSection === 'profile'
					? 'bg-card text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'
			}`}
		>
			<User class="h-3.5 w-3.5" />
			Profile
		</button>
		<button
			type="button"
			onclick={() => switchSection('settings')}
			class={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
				activeSection === 'settings'
					? 'bg-card text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'
			}`}
		>
			<Palette class="h-3.5 w-3.5" />
			Settings
		</button>
	</div>

	<!-- Scrollable Tab Body -->
	<div class="mt-3 flex-1 space-y-3 overflow-y-auto pb-4">
		{#if activeSection === 'activity'}
			<div class="grid grid-cols-3 gap-2">
				<div class="rounded-xl border border-border/70 bg-card/80 p-3 text-center">
					<p class="font-heading text-lg font-bold">{ledgerStore.answers.length}</p>
					<p class="text-[11px] text-muted-foreground">Answered</p>
				</div>
				<div class="rounded-xl border border-border/70 bg-card/80 p-3 text-center">
					<p class="font-heading text-lg font-bold text-primary">
						{publicProjection.answers.length}
					</p>
					<p class="text-[11px] text-muted-foreground">Public</p>
				</div>
				<div class="rounded-xl border border-border/70 bg-card/80 p-3 text-center">
					<p class="font-heading text-lg font-bold">
						{ledgerStore.answers.length - publicProjection.answers.length}
					</p>
					<p class="text-[11px] text-muted-foreground">Private</p>
				</div>
			</div>

			<Button
				type="button"
				variant="outline"
				size="sm"
				onclick={handleOpenAskQuestion}
				class="h-9 w-full cursor-pointer text-xs font-semibold"
			>
				<Plus class="mr-1.5 h-3.5 w-3.5 text-primary" />
				Ask a Question
			</Button>

			{#if ledgerStore.answers.length === 0}
				<div class="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
					No answers recorded yet. Head to the Feed tab and select an answer to write to the relay.
				</div>
			{:else}
				<div class="space-y-2.5">
					{#each ledgerStore.answers as answer (answer.questionCid)}
						<div class="space-y-2 rounded-xl border border-border/75 bg-card/85 p-3.5">
							<div class="flex items-center justify-between gap-2">
								<Badge variant="outline" class="text-[10px] capitalize">
									{answer.ownerType === 'genesis' ? 'Genesis Root' : 'Community'}
								</Badge>
								<button
									type="button"
									onclick={() => handleToggleAnswerVisibility(answer.questionCid)}
									class={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
										answer.visibility === 'public'
											? 'border-primary/40 bg-primary/15 text-primary'
											: 'border-border bg-secondary text-muted-foreground'
									}`}
								>
									{#if answer.visibility === 'public'}
										<Globe class="h-2.5 w-2.5" />
										Public
									{:else}
										<Lock class="h-2.5 w-2.5" />
										Private
									{/if}
								</button>
							</div>
							<p class="text-xs font-medium leading-snug text-foreground">
								{answer.questionText}
							</p>
							<p class="rounded-lg bg-background/60 px-2.5 py-1.5 text-xs font-semibold text-primary">
								→ {answer.selectedOptionText}
							</p>
						</div>
					{/each}
				</div>
			{/if}
		{:else if activeSection === 'profile'}
			<div class="space-y-2.5">
				{#each profileFields as field (field.key)}
					<div class="space-y-2 rounded-xl border border-border/75 bg-card/85 p-3.5">
						<div class="flex items-center justify-between gap-2">
							<span class="text-xs font-semibold">
								{field.label}
								{#if field.required}
									<span class="text-destructive">*</span>
								{/if}
							</span>
							<button
								type="button"
								onclick={() => handleToggleFieldVisibility(field.key)}
								class={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
									field.visibility === 'public'
										? 'border-primary/40 bg-primary/15 text-primary'
										: 'border-border bg-secondary text-muted-foreground'
								}`}
							>
								{#if field.visibility === 'public'}
									<Globe class="h-2.5 w-2.5" />
									Public Ledger
								{:else}
									<Lock class="h-2.5 w-2.5" />
									Private Only
								{/if}
							</button>
						</div>
						<Input
							value={field.value}
							type={field.key === 'dateOfBirth' ? 'date' : 'text'}
							placeholder={`Enter ${field.label.toLowerCase()}`}
							onchange={(e) =>
								handleUpdateFieldValue(
									field.key,
									(e.currentTarget as HTMLInputElement).value
								)}
							class="h-9 bg-background/60 text-xs"
						/>
					</div>
				{/each}
			</div>

			<div class="space-y-2.5 rounded-xl border border-border/75 bg-card/75 p-3.5">
				<div class="flex items-center gap-2 text-xs font-semibold">
					<Database class="h-4 w-4 text-primary" />
					Ledger Storage Snapshot
				</div>
				<Separator />
				<div class="grid grid-cols-2 gap-2 text-[11px]">
					<div class="rounded-lg border border-border/60 bg-background/60 p-2.5">
						<p class="mb-1 flex items-center gap-1 font-semibold text-primary">
							<Globe class="h-3 w-3" />
							Public (Relay)
						</p>
						<p class="text-muted-foreground">
							{publicProjection.profileFields.length} profile fields · {publicProjection.answers.length} answers
						</p>
					</div>
					<div class="rounded-lg border border-border/60 bg-background/60 p-2.5">
						<p class="mb-1 flex items-center gap-1 font-semibold text-foreground">
							<Lock class="h-3 w-3" />
							Private ({privateStore.cipher})
						</p>
						<p class="text-muted-foreground">
							{privateStore.profileFields.length} profile fields · {privateStore.answers.length} answers
						</p>
					</div>
				</div>
			</div>
		{:else}
			<div class="space-y-2.5 rounded-xl border border-border/75 bg-card/85 p-3.5">
				<div class="flex items-center justify-between">
					<span class="text-xs font-semibold">Theme &amp; Look-and-Feel</span>
					<span class="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
						<HardDrive class="h-3 w-3" />
						Local only
					</span>
				</div>
				<div class="grid grid-cols-2 gap-2">
					{#each themeStore.availableThemes as theme (theme.id)}
						{@const active = themeStore.themeId === theme.id}
						<button
							type="button"
							onclick={() => handleSelectTheme(theme.id)}
							class={`flex cursor-pointer items-center justify-between rounded-lg border px-2.5 py-2 text-left text-xs transition-colors ${
								active
									? 'border-primary bg-primary/15 font-semibold text-foreground'
									: 'border-border bg-background/60 text-muted-foreground hover:text-foreground'
							}`}
						>
							<span class="truncate">{theme.name.split(' ')[0]}</span>
							<span class="flex items-center gap-1">
								<span
									class="h-3 w-3 rounded-full border border-white/20"
									style={`background-color: ${theme.swatches.primary};`}
								></span>
								{#if active}
									<Check class="h-3 w-3 text-primary" />
								{/if}
							</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="space-y-2.5 rounded-xl border border-border/75 bg-card/85 p-3.5">
				<div class="flex items-center gap-2 text-xs font-semibold">
					<KeyRound class="h-3.5 w-3.5 text-primary" />
					Live Relay &amp; Identity
				</div>
				<div class="space-y-1 rounded-lg bg-background/60 p-2.5 font-mono text-[10px] text-muted-foreground">
					<div class="flex items-center justify-between gap-2">
						<p class="truncate">pk: {sessionStore.identity?.userPubkey ?? '—'}</p>
						{#if sessionStore.identity?.userPubkey}
							<button
								type="button"
								onclick={copyPublicKey}
								aria-label="Copy public key"
								class="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
							>
								<Copy class="h-3 w-3" />
							</button>
						{/if}
					</div>
					<p class="truncate">x25519: {sessionStore.identity?.x25519Pubkey ?? '—'}</p>
					<p class="truncate">endpoint: {sessionStore.relayStatus?.endpointId || 'disconnected'}</p>
					<p>mode: {sessionStore.relayStatus?.source ?? 'none'}</p>
					<p class="truncate">root_pk: {sessionStore.relayStatus?.rootPubkey || '—'}</p>
					<p>custody: {custodyLabel}</p>
					<p>demo_tokens: {sessionStore.demoTokenBalance}</p>
					<p>live_sync: {ledgerStore.isLiveSyncActive ? 'active' : 'paused'}</p>
				</div>

				{#if exportedRecoveryKey}
					<div class="space-y-2 rounded-lg border border-primary/30 bg-background/70 p-2.5 font-mono text-[10px]">
						<div class="flex items-center justify-between gap-2">
							<span class="font-sans text-[11px] font-semibold text-primary">
								Recovery Key (keep secret)
							</span>
							<button
								type="button"
								onclick={() => (exportedRecoveryKey = null)}
								class="cursor-pointer font-sans text-[10px] text-muted-foreground hover:text-foreground"
							>
								Hide
							</button>
						</div>
						<div class="flex items-center justify-between gap-2">
							<span class="break-all text-foreground">{exportedRecoveryKey}</span>
							<button
								type="button"
								onclick={copyRecoveryKey}
								class="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
								aria-label="Copy recovery key"
							>
								<Copy class="h-3.5 w-3.5" />
							</button>
						</div>
					</div>
				{/if}

				<div class="flex flex-wrap gap-1.5 pt-1">
					<Button
						size="sm"
						variant="outline"
						onclick={handleExportRecoveryKey}
						disabled={isExportingRecovery}
						class="h-8 cursor-pointer text-xs"
					>
						<KeyRound class="mr-1.5 h-3 w-3" />
						{isExportingRecovery ? 'Exporting...' : 'Export Recovery Key'}
					</Button>
					<Button
						size="sm"
						variant="outline"
						onclick={handleRevisitOnboarding}
						class="h-8 cursor-pointer text-xs"
					>
						Revisit Onboarding
					</Button>
					<Button
						size="sm"
						variant="outline"
						onclick={handleLockVault}
						class="h-8 cursor-pointer text-xs"
					>
						<LogOut class="mr-1.5 h-3 w-3" />
						Lock Vault
					</Button>
					<Button
						size="sm"
						variant="destructive"
						onclick={handleResetVault}
						class="h-8 cursor-pointer text-xs"
					>
						<RotateCcw class="mr-1.5 h-3 w-3" />
						Reset Local Vault
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
