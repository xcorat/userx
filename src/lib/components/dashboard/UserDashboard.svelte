<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { araliyaService, pubkeyToHex } from '$lib/services/araliya.service';
	import { ledgerStore } from '$lib/stores/ledger.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import type { IssuedVouchCard, ProfileFieldKey, ThemeId } from '$lib/types';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import { toast } from 'svelte-sonner';
	import {
		Activity,
		Check,
		Clock,
		Copy,
		Database,
		Globe,
		HardDrive,
		KeyRound,
		Link2,
		Lock,
		LogOut,
		Palette,
		Plus,
		RefreshCw,
		RotateCcw,
		Shield,
		ShieldCheck,
		User,
		UserCheck,
		UserPlus,
		X
	} from 'lucide-svelte';

	type DashboardSection = 'activity' | 'profile' | 'settings';

	let activeSection = $state<DashboardSection>('activity');
	let exportedRecoveryKey = $state<string | null>(null);
	let isExportingRecovery = $state(false);
	let nowMs = $state(Date.now());

	let vouchTtlHours = $state<number | null>(72);
	let manualSubjectInput = $state('');
	let showManualVouch = $state(false);
	let isVouchingSubject = $state<string | null>(null);
	let lastIssuedCard = $state<IssuedVouchCard | null>(null);
	let pendingTokenPaste = $state('');
	let isApplyingPendingToken = $state(false);

	let profileFields = $derived(Object.values(ledgerStore.profile));
	let publicProjection = $derived(ledgerStore.publicLedgerProjection);
	let privateStore = $derived(ledgerStore.privateEncryptedStore);

	let myInviteLink = $derived.by(() => {
		const pk = sessionStore.identity?.userPubkey;
		if (!browser || !pk) return '';
		return `${window.location.origin}/?voucher=${encodeURIComponent(pk)}`;
	});

	let lastIssuedInviteLink = $derived.by(() => {
		if (!browser || !lastIssuedCard) return '';
		const by = ledgerStore.profile.username.value.trim();
		const byParam = by ? `&by=${encodeURIComponent(by)}` : '';
		return `${window.location.origin}/?vouch=${encodeURIComponent(lastIssuedCard.vouchCardToken)}${byParam}`;
	});

	onMount(() => {
		if (sessionStore.isAdmitted) {
			void sessionStore.refreshIncomingVouchRequests();
		}
		const timer = setInterval(() => {
			nowMs = Date.now();
		}, 15_000);
		return () => clearInterval(timer);
	});

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
		if (section === 'profile' && sessionStore.isAdmitted) {
			void sessionStore.refreshIncomingVouchRequests();
		}
	}

	function truncatePk(pk: string): string {
		if (!pk || pk.length <= 18) return pk;
		return `${pk.slice(0, 10)}…${pk.slice(-6)}`;
	}

	function formatTimeRemaining(expiresAtMs: number): string {
		const diff = Math.max(0, expiresAtMs - nowMs);
		if (diff <= 0) return 'Expired';
		const totalMins = Math.floor(diff / 60_000);
		const hours = Math.floor(totalMins / 60);
		const mins = totalMins % 60;
		if (hours >= 24) {
			const days = Math.floor(hours / 24);
			return `${days}d ${hours % 24}h`;
		}
		if (hours > 0) return `${hours}h ${mins}m`;
		const secs = Math.floor((diff % 60_000) / 1000);
		return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
	}

	function extractSubjectPubkey(rawInput: string): string {
		const trimmed = rawInput.trim();
		if (trimmed.startsWith('{')) {
			try {
				const parsed = JSON.parse(trimmed) as Record<string, unknown>;
				if (typeof parsed.subject_pubkey === 'string' && parsed.subject_pubkey.trim()) {
					return parsed.subject_pubkey.trim();
				}
				if (
					typeof parsed.subject_pubkey_hex === 'string' &&
					parsed.subject_pubkey_hex.trim()
				) {
					return parsed.subject_pubkey_hex.trim();
				}
			} catch {
				// Fall through to raw pubkey string
			}
		}
		return trimmed;
	}

	async function copyLabelledText(label: string, text: string) {
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			toast.success(`Copied ${label}`);
		} catch {
			toast.error(`Could not copy ${label}`);
		}
	}

	async function handleApproveRequest(subjectPubkey: string) {
		isVouchingSubject = subjectPubkey;
		try {
			const card = await sessionStore.approveIncomingVouch(subjectPubkey, vouchTtlHours);
			lastIssuedCard = card;
			toast.success('Vouch submitted to relay — their app can now auto-complete!');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to submit vouch');
		} finally {
			isVouchingSubject = null;
		}
	}

	async function handleDeclineRequest(subjectPubkey: string) {
		isVouchingSubject = subjectPubkey;
		try {
			await sessionStore.declineIncomingVouch(subjectPubkey);
			toast.info('Vouch request declined');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to decline request');
		} finally {
			isVouchingSubject = null;
		}
	}

	async function handleManualVouch(submitToRelay: boolean) {
		const pk = extractSubjectPubkey(manualSubjectInput);
		if (!pk) {
			toast.error('Paste a peer public key or vouch request payload');
			return;
		}
		isVouchingSubject = 'manual';
		try {
			await sessionStore.ensureUnlockedOnRelay();
			const expiresAtMs =
				vouchTtlHours && vouchTtlHours > 0 ? Date.now() + vouchTtlHours * 3_600_000 : null;
			const rootPk = sessionStore.relayStatus?.rootPubkey ?? null;
			const epId = sessionStore.relayStatus?.endpointId ?? null;
			const dialAddr = sessionStore.relayStatus?.dialPeerAddress ?? null;
			const card = submitToRelay
				? await araliyaService.submitVouchCard(
						pk,
						'initial_approval',
						rootPk,
						epId,
						dialAddr,
						expiresAtMs
					)
				: await araliyaService.issueVouchCard(
						pk,
						'initial_approval',
						rootPk,
						epId,
						dialAddr,
						expiresAtMs
					);
			lastIssuedCard = card;
			manualSubjectInput = '';
			toast.success(
				submitToRelay
					? 'Vouch submitted to relay & card ready'
					: 'Offline VouchCard minted'
			);
			if (submitToRelay) {
				void sessionStore.refreshIncomingVouchRequests();
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to issue vouch');
		} finally {
			isVouchingSubject = null;
		}
	}

	async function handleApplyPendingToken(event: SubmitEvent) {
		event.preventDefault();
		if (!pendingTokenPaste.trim()) return;
		isApplyingPendingToken = true;
		try {
			const info = await araliyaService.inspectVouchTokenAsync(pendingTokenPaste);
			if (!info.validFormat) {
				toast.error(info.error ?? 'Invalid vouch token');
				return;
			}
			if (info.isExpired) {
				toast.error('This vouch token has expired.');
				return;
			}
			if (
				info.subjectPubkey &&
				sessionStore.identity?.userPubkey &&
				pubkeyToHex(info.subjectPubkey) !== pubkeyToHex(sessionStore.identity.userPubkey)
			) {
				toast.error('This vouch token targets a different public key.');
				return;
			}
			sessionStore.setPendingVouchToken(info.tokenOrJson);
			pendingTokenPaste = '';
			await sessionStore.checkAndAutoCompleteVouch(info.tokenOrJson);
		} finally {
			isApplyingPendingToken = false;
		}
	}

	async function handleUpdateFieldValue(key: ProfileFieldKey, value: string) {
		try {
			if (!sessionStore.identity) throw new Error('Vault is locked');
			if (!sessionStore.isAdmitted) {
				await ledgerStore.stageProfileFieldValue(key, value);
				if (key === 'username') {
					await sessionStore.syncRequestedHandleToVoucher(
						ledgerStore.profile.username.visibility === 'public'
							? ledgerStore.profile.username.value
							: null
					);
				}
				toast.success(`Staged ${ledgerStore.profile[key].label} locally`);
				return;
			}
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
			if (!sessionStore.isAdmitted) {
				await ledgerStore.stageToggleProfileFieldVisibility(key);
				const updated = ledgerStore.profile[key];
				if (key === 'username') {
					await sessionStore.syncRequestedHandleToVoucher(
						updated.visibility === 'public' ? updated.value : null
					);
				}
				toast.success(
					`${updated.label} staged as ${
						updated.visibility === 'public' ? 'Public Ledger' : 'Private Only'
					}`
				);
				return;
			}
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
		if (sessionStore.isPendingVouch) {
			toast.info('Asking questions unlocks once your vouch is approved.');
			return;
		}
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
			{#if sessionStore.incomingVouchRequests.length > 0}
				<span class="rounded-full bg-primary px-1.5 py-0.2 font-mono text-[10px] font-bold text-primary-foreground">
					{sessionStore.incomingVouchRequests.length}
				</span>
			{/if}
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
			{#if sessionStore.isAdmitted}
				<!-- Invite & Vouch Card (Admitted Members) -->
				<div class="space-y-3 rounded-xl border border-primary/30 bg-card/90 p-3.5">
					<div class="flex items-center justify-between gap-2">
						<div class="flex items-center gap-2 text-xs font-semibold text-foreground">
							<UserPlus class="h-4 w-4 text-primary" />
							Invite &amp; Vouch
						</div>
						<button
							type="button"
							disabled={sessionStore.isLoadingIncomingVouches}
							onclick={() => sessionStore.refreshIncomingVouchRequests()}
							class="inline-flex cursor-pointer items-center gap-1 text-[11px] text-primary hover:underline"
						>
							<RefreshCw
								class={`h-3 w-3 ${sessionStore.isLoadingIncomingVouches ? 'animate-spin' : ''}`}
							/>
							Refresh
						</button>
					</div>

					<!-- Personal Onboarding Link -->
					{#if myInviteLink}
						<div class="space-y-1.5 rounded-lg border border-border/70 bg-background/60 p-2.5">
							<div class="flex items-center justify-between gap-2">
								<span class="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground">
									<Link2 class="h-3 w-3 text-primary" />
									Your Onboarding Link
								</span>
								<button
									type="button"
									onclick={() => copyLabelledText('invite link', myInviteLink)}
									class="inline-flex cursor-pointer items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
								>
									<Copy class="h-3 w-3" />
									Copy Link
								</button>
							</div>
							<p class="truncate font-mono text-[10px] text-muted-foreground">
								{myInviteLink}
							</p>
							<p class="text-[10px] leading-relaxed text-muted-foreground">
								Share this link — anyone who opens it sends their 72-hour vouch request straight to you.
							</p>
						</div>
					{/if}

					<!-- Expiry Selector for Issued Vouches -->
					<div class="flex items-center justify-between gap-2 text-[11px]">
						<span class="text-muted-foreground">Vouch validity:</span>
						<div class="flex items-center gap-1">
							{#each [
								{ label: '24h', hours: 24 },
								{ label: '72h', hours: 72 },
								{ label: '7d', hours: 168 },
								{ label: 'None', hours: null }
							] as opt (opt.label)}
								<button
									type="button"
									onclick={() => (vouchTtlHours = opt.hours)}
									class={`cursor-pointer rounded-md border px-2 py-0.5 font-mono text-[10px] transition-colors ${
										vouchTtlHours === opt.hours
											? 'border-primary bg-primary/15 font-semibold text-primary'
											: 'border-border bg-background/60 text-muted-foreground hover:text-foreground'
									}`}
								>
									{opt.label}
								</button>
							{/each}
						</div>
					</div>

					<!-- Incoming Vouch Requests -->
					<div class="space-y-2 border-t border-border/60 pt-2.5">
						<p class="text-[11px] font-semibold text-foreground">
							Pending Requests ({sessionStore.incomingVouchRequests.length})
						</p>
						{#if sessionStore.incomingVouchRequests.length === 0}
							<p class="text-[11px] text-muted-foreground">
								No incoming vouch requests right now.
							</p>
						{:else}
							<div class="space-y-2">
								{#each sessionStore.incomingVouchRequests as req (req.subjectPubkey)}
									<div class="space-y-2 rounded-lg border border-border/70 bg-background/70 p-2.5">
										<div class="flex items-center justify-between gap-2">
											<div class="min-w-0">
												<p class="truncate text-xs font-semibold text-foreground">
													{req.requestedHandle ? `@${req.requestedHandle}` : 'Private handle'}
												</p>
												<p class="truncate font-mono text-[10px] text-muted-foreground">
													{truncatePk(req.subjectPubkey)}
												</p>
											</div>
											<span class="shrink-0 font-mono text-[10px] text-amber-300">
												{formatTimeRemaining(req.expiresAtMs)} left
											</span>
										</div>
										<div class="flex gap-2">
											<Button
												type="button"
												size="sm"
												disabled={isVouchingSubject === req.subjectPubkey}
												onclick={() => handleApproveRequest(req.subjectPubkey)}
												class="h-7 flex-1 cursor-pointer text-[11px] font-semibold"
											>
												<UserCheck class="mr-1 h-3 w-3" />
												{isVouchingSubject === req.subjectPubkey
													? 'Approving…'
													: 'Approve & Vouch'}
											</Button>
											<Button
												type="button"
												size="sm"
												variant="outline"
												disabled={isVouchingSubject === req.subjectPubkey}
												onclick={() => handleDeclineRequest(req.subjectPubkey)}
												class="h-7 cursor-pointer px-2.5 text-[11px]"
											>
												<X class="h-3 w-3" />
											</Button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Manual / Offline Vouch Toggle -->
					<div class="border-t border-border/60 pt-2">
						<button
							type="button"
							onclick={() => (showManualVouch = !showManualVouch)}
							class="cursor-pointer text-[11px] font-medium text-primary hover:underline"
						>
							{showManualVouch
								? 'Hide manual pubkey vouch'
								: 'Vouch manually by Public Key / Request JSON →'}
						</button>

						{#if showManualVouch}
							<div class="mt-2.5 space-y-2">
								<Input
									bind:value={manualSubjectInput}
									placeholder="Paste peer pubkey or araliya-vouch-request/v1 JSON"
									autocapitalize="none"
									autocomplete="off"
									class="h-9 bg-background/70 font-mono text-[11px]"
								/>
								<div class="flex gap-2">
									<Button
										type="button"
										size="sm"
										disabled={isVouchingSubject === 'manual'}
										onclick={() => handleManualVouch(true)}
										class="h-8 flex-1 cursor-pointer text-[11px] font-semibold"
									>
										<ShieldCheck class="mr-1 h-3.5 w-3.5" />
										Vouch on Relay
									</Button>
									<Button
										type="button"
										size="sm"
										variant="outline"
										disabled={isVouchingSubject === 'manual'}
										onclick={() => handleManualVouch(false)}
										class="h-8 cursor-pointer text-[11px]"
									>
										Offline Card
									</Button>
								</div>
							</div>
						{/if}
					</div>

					<!-- Fallback Copyable VouchCard after Issuing -->
					{#if lastIssuedCard}
						<div class="space-y-2 rounded-lg border border-primary/40 bg-primary/10 p-2.5 text-[11px]">
							<div class="flex items-center justify-between gap-2">
								<span class="font-semibold text-foreground">Fallback VouchCard Ready</span>
								<button
									type="button"
									onclick={() => (lastIssuedCard = null)}
									class="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground"
								>
									Dismiss
								</button>
							</div>
							<p class="truncate font-mono text-[10px] text-muted-foreground">
								{lastIssuedCard.vouchCardToken}
							</p>
							<div class="flex gap-2">
								<Button
									type="button"
									size="sm"
									variant="secondary"
									onclick={() =>
										copyLabelledText(
											'vouch token',
											lastIssuedCard?.vouchCardToken ?? ''
										)}
									class="h-7 flex-1 cursor-pointer text-[10px]"
								>
									<Copy class="mr-1 h-3 w-3" />
									Copy Token
								</Button>
								{#if lastIssuedInviteLink}
									<Button
										type="button"
										size="sm"
										variant="outline"
										onclick={() =>
											copyLabelledText('offline vouch link', lastIssuedInviteLink)}
										class="h-7 flex-1 cursor-pointer text-[10px]"
									>
										<Link2 class="mr-1 h-3 w-3" />
										Copy Vouch Link
									</Button>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{:else if sessionStore.isPendingVouch}
				<!-- Pending Vouch Status Card (Bob's Profile while waiting) -->
				<div class="space-y-3 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3.5 text-xs">
					<div class="flex items-center justify-between gap-2">
						<span class="inline-flex items-center gap-1.5 font-semibold text-foreground">
							<Clock class="h-4 w-4 text-amber-400" />
							Waiting for Human Vouch
						</span>
						{#if sessionStore.pendingVouchRequest}
							<span class="font-mono text-[10px] text-amber-300">
								{formatTimeRemaining(sessionStore.pendingVouchRequest.expiresAtMs)} left
							</span>
						{/if}
					</div>
					<p class="text-[11px] leading-relaxed text-muted-foreground">
						Profile edits below are encrypted locally on your device and will sync automatically as soon as
						{sessionStore.pendingVouchRequest?.voucherHandle
							? `@${sessionStore.pendingVouchRequest.voucherHandle}`
							: 'a member'}
						approves your vouch.
					</p>
					<div class="flex gap-2">
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={sessionStore.isCheckingVouch}
							onclick={() => sessionStore.checkAndAutoCompleteVouch()}
							class="h-8 flex-1 cursor-pointer text-[11px]"
						>
							<RefreshCw
								class={`mr-1 h-3 w-3 ${sessionStore.isCheckingVouch ? 'animate-spin' : ''}`}
							/>
							Check Relay
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							onclick={() =>
								copyLabelledText(
									'public key',
									sessionStore.identity?.userPubkey ?? ''
								)}
							class="h-8 cursor-pointer text-[11px]"
						>
							<Copy class="mr-1 h-3 w-3" />
							Copy Pubkey
						</Button>
					</div>
					<form onsubmit={handleApplyPendingToken} class="flex gap-2 border-t border-amber-500/20 pt-2">
						<Input
							bind:value={pendingTokenPaste}
							placeholder="araliya-vouch-card:v1:..."
							autocapitalize="none"
							autocomplete="off"
							class="h-8 flex-1 bg-background/70 font-mono text-[11px]"
						/>
						<Button
							type="submit"
							size="sm"
							disabled={isApplyingPendingToken}
							class="h-8 cursor-pointer text-[11px]"
						>
							Apply
						</Button>
					</form>
				</div>
			{/if}

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
						{#if field.key === 'username'}
							<p class="text-[11px] leading-relaxed text-muted-foreground">
								Public handle is searchable in the Users directory; private handle keeps the account hidden.
							</p>
						{/if}
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
