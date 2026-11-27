<script lang="ts">
	import { onMount } from 'svelte';
	import { swipe } from '$lib/actions/swipe';
	import { ledgerStore } from '$lib/stores/ledger.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import type { QuestionItem } from '$lib/types';
	import PublicLedgerCheckbox from '$lib/components/ui/PublicLedgerCheckbox.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import {
		CheckCircle2,
		Database,
		Globe,
		LayoutDashboard,
		Plus,
		RefreshCw,
		Sparkles,
		UserCheck
	} from 'lucide-svelte';

	let currentQuestion = $derived.by(() => {
		if (!sessionStore.isPendingVouch) {
			return ledgerStore.currentFeedQuestion;
		}
		const all = [...ledgerStore.nextGenesisQuestions, ...ledgerStore.nextCommunityQuestions];
		return all.find((q) => !skippedCids.has(q.cid)) ?? all[0] ?? null;
	});
	let skippedCids = $state<Set<string>>(new Set());
	let keepPublic = $state(true);
	let selectedOptionId = $state<string | null>(null);
	let exitDirection = $state<'left' | 'right' | 'up' | null>(null);
	let dragOffset = $state({ x: 0, y: 0 });
	let isDragging = $state(false);
	let isTransitioning = $state(false);

	function skipQuestionReadOnly(question: QuestionItem) {
		const next = new Set(skippedCids);
		next.add(question.cid);
		const totalAvailable =
			ledgerStore.nextGenesisQuestions.length + ledgerStore.nextCommunityQuestions.length;
		if (next.size >= totalAvailable) {
			skippedCids = new Set();
			toast.info('Looping back to the first public question.');
		} else {
			skippedCids = next;
		}
	}

	onMount(async () => {
		const status = sessionStore.relayStatus ?? (await sessionStore.refreshRelayStatus());
		if (ledgerStore.questions.length === 0) {
			await ledgerStore.loadQuestionsFromRelay(status.rootPubkey);
		}
		if (!ledgerStore.isLiveSyncActive) {
			await ledgerStore.startLiveSync(status.rootPubkey);
		}
	});

	$effect(() => {
		if (currentQuestion) {
			keepPublic = currentQuestion.defaultPublic;
			selectedOptionId = null;
			exitDirection = null;
			dragOffset = { x: 0, y: 0 };
			isTransitioning = false;
		}
	});

	let answeredCount = $derived(ledgerStore.answers.length);
	let totalCount = $derived(ledgerStore.totalQuestionsCount);

	let isBinarySwipeable = $derived(
		currentQuestion !== null && currentQuestion.options.length === 2
	);

	async function answerQuestion(
		question: QuestionItem,
		optionId: string,
		direction: 'left' | 'right' | 'up' = 'up'
	) {
		if (sessionStore.isPendingVouch) {
			dragOffset = { x: 0, y: 0 };
			toast.info('Read-only while waiting for your vouch — answering unlocks once approved.');
			return;
		}
		if (isTransitioning) return;
		isTransitioning = true;
		selectedOptionId = optionId;
		exitDirection = direction;

		try {
			if (!sessionStore.identity) throw new Error('Vault is locked');
			await ledgerStore.submitAnswer(question, optionId, keepPublic);
			toast.success(
				keepPublic ? 'Response recorded on relay' : 'Encrypted & saved privately on relay',
				{ duration: 1500 }
			);
		} catch (err) {
			exitDirection = null;
			selectedOptionId = null;
			isTransitioning = false;
			toast.error(err instanceof Error ? err.message : 'Failed to submit response to relay');
		}
	}

	async function handleRefresh() {
		const rootPk = sessionStore.relayStatus?.rootPubkey ?? '';
		await ledgerStore.loadQuestionsFromRelay(rootPk);
	}

	function cardTransformStyle(): string {
		if (exitDirection === 'right') {
			return 'transform: translate3d(120%, -18px, 0) rotate(10deg); opacity: 0; transition: transform 240ms ease-out, opacity 240ms ease-out;';
		}
		if (exitDirection === 'left') {
			return 'transform: translate3d(-120%, -18px, 0) rotate(-10deg); opacity: 0; transition: transform 240ms ease-out, opacity 240ms ease-out;';
		}
		if (exitDirection === 'up') {
			return 'transform: translate3d(0, -48px, 0) scale(0.96); opacity: 0; transition: transform 220ms ease-out, opacity 220ms ease-out;';
		}
		if (isDragging) {
			const rot = dragOffset.x / 28;
			return `transform: translate3d(${dragOffset.x}px, ${dragOffset.y * 0.25}px, 0) rotate(${rot}deg); transition: none;`;
		}
		return 'transform: translate3d(0, 0, 0) rotate(0deg); opacity: 1; transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease-out;';
	}

	function totalVotes(question: QuestionItem): number {
		return Object.values(question.communityCounts).reduce((sum, count) => sum + count, 0);
	}
</script>

<div class="relative flex h-full flex-col justify-between overflow-hidden px-5 pt-4 pb-4 md:px-8">
	<!-- Top Feed Status Bar -->
	<header class="flex items-center justify-between gap-2 px-1">
		<div class="flex items-center gap-2">
			{#if currentQuestion?.ownerType === 'genesis'}
				<Badge class="gap-1 bg-primary text-primary-foreground">
					<UserCheck class="h-3 w-3" />
					Genesis Profile
				</Badge>
			{:else if currentQuestion}
				<Badge variant="secondary" class="gap-1">
					<Globe class="h-3 w-3 text-primary" />
					Community Public
				</Badge>
			{:else}
				<Badge variant="outline">Relay Feed</Badge>
			{/if}

			{#if ledgerStore.isLiveSyncActive}
				<span class="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-400">
					<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"></span>
					Live
				</span>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={() => {
					if (sessionStore.isPendingVouch) {
						toast.info('Asking questions unlocks once your vouch is approved.');
						return;
					}
					sessionStore.setOnboardingStep('ask-first');
				}}
				class="inline-flex cursor-pointer items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
			>
				<Plus class="h-3 w-3" />
				Ask
			</button>
			<span class="font-mono text-xs text-muted-foreground">
				{answeredCount} / {totalCount}
			</span>
			<button
				type="button"
				onclick={handleRefresh}
				aria-label="Refresh questions from relay"
				class="cursor-pointer rounded-md p-1 text-muted-foreground hover:text-foreground"
			>
				<RefreshCw class={`h-3.5 w-3.5 ${ledgerStore.isLoadingQuestions ? 'animate-spin' : ''}`} />
			</button>
		</div>
	</header>

	<!-- Fullscreen Question Card Stage -->
	<div class="relative my-2 flex flex-1 items-stretch justify-center overflow-hidden">
		{#if (ledgerStore.isLoadingQuestions || ledgerStore.isHydrating) && ledgerStore.questions.length === 0}
			<div class="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border/80 bg-card/85 p-6 text-center">
				<RefreshCw class="h-6 w-6 animate-spin text-primary" />
				<p class="text-xs text-muted-foreground">Loading questions from relay…</p>
			</div>
		{:else if ledgerStore.loadError}
			<div class="flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/40 bg-card/85 p-6 text-center">
				<p class="text-xs text-destructive">{ledgerStore.loadError}</p>
				<Button onclick={handleRefresh} variant="outline" size="sm" class="cursor-pointer">
					Retry Relay
				</Button>
			</div>
		{:else if ledgerStore.questions.length === 0}
			<div class="flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-border/80 bg-card/85 p-6 text-center backdrop-blur-md">
				<div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
					<Database class="h-6 w-6" />
				</div>
				<div class="space-y-1.5">
					<h2 class="font-heading text-lg font-bold">No questions on relay</h2>
					<p class="max-w-xs text-xs leading-relaxed text-muted-foreground">
						The connected relay currently has an empty <span class="font-mono">questions</span> table.
					</p>
				</div>
				<div class="flex w-full max-w-xs flex-col gap-2">
					<Button
						onclick={() => sessionStore.setOnboardingStep('ask-first')}
						class="w-full cursor-pointer"
					>
						<Plus class="mr-2 h-4 w-4" />
						Ask First Question
					</Button>
					<Button onclick={handleRefresh} variant="outline" class="w-full cursor-pointer">
						<RefreshCw class="mr-2 h-4 w-4" />
						Refresh from Relay
					</Button>
				</div>
			</div>
		{:else if currentQuestion}
			{@const question = currentQuestion}
			{@const votes = totalVotes(question)}
			<div
				use:swipe={{
					disabled: isTransitioning || !isBinarySwipeable,
					onStart: () => {
						isDragging = true;
					},
					onMove: ({ dx, dy }) => {
						dragOffset = { x: dx, y: dy };
					},
					onEnd: ({ dx }) => {
						isDragging = false;
						if (isBinarySwipeable && Math.abs(dx) > 95) {
							const option = dx > 0 ? question.options[0] : question.options[1];
							answerQuestion(question, option.id, dx > 0 ? 'right' : 'left');
						} else {
							dragOffset = { x: 0, y: 0 };
						}
					}
				}}
				style={cardTransformStyle()}
				class="flex w-full max-w-3xl flex-col justify-between rounded-2xl border border-border/80 bg-card/90 p-5 shadow-lg backdrop-blur-md select-none md:p-7"
			>
				<!-- Card Metadata -->
				<div class="space-y-3">
					<div class="flex items-center justify-between gap-2">
						<span class="font-mono text-xs uppercase tracking-wider text-primary">
							{question.ownerType === 'genesis' ? 'Genesis Root' : 'Public Question'}
						</span>
						<span class="font-mono text-xs text-muted-foreground">
							{question.authorHandle}
						</span>
					</div>

					<h2 class="font-heading text-2xl leading-snug font-bold tracking-tight text-card-foreground sm:text-3xl">
						{question.text}
					</h2>

					<p class="font-mono text-xs text-muted-foreground">
						cid: {question.cid.slice(0, 18)}… · {votes} relay votes
					</p>
				</div>

				<!-- Answer Options -->
				<div class="my-auto space-y-3 py-4" data-no-drag>
					{#each question.options as option, idx (option.id)}
						{@const isSelected = selectedOptionId === option.id}
						{@const optionVotes = question.communityCounts[option.id] ?? 0}
						{@const pct = votes > 0 ? Math.round((optionVotes / votes) * 100) : 0}
						<button
							type="button"
							disabled={isTransitioning}
							onclick={() =>
								answerQuestion(
									question,
									option.id,
									isBinarySwipeable ? (idx === 0 ? 'right' : 'left') : 'up'
								)}
							class={`group relative flex w-full cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-xl border px-5 py-4 text-left transition-all active:scale-[0.985] ${
								isSelected
									? 'border-primary bg-primary text-primary-foreground shadow-md'
									: 'border-border bg-background/60 text-foreground hover:border-primary/60 hover:bg-secondary/70'
							}`}
						>
							<span class="relative z-10 text-base font-medium leading-snug">
								{option.text}
							</span>
							<span
								class={`relative z-10 shrink-0 font-mono text-xs ${
									isSelected ? 'text-primary-foreground/85' : 'text-muted-foreground'
								}`}
							>
								{pct}%
							</span>
						</button>
					{/each}
				</div>

				<!-- Card Footer -->
				<div class="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
					{#if sessionStore.isPendingVouch}
						<span class="font-mono text-xs text-amber-300">Read-only preview</span>
						<button
							type="button"
							onclick={() => skipQuestionReadOnly(question)}
							class="cursor-pointer rounded-md border border-border/70 bg-background/70 px-2.5 py-1 text-xs font-semibold text-foreground hover:border-primary/50"
						>
							Next Question →
						</button>
					{:else}
						<PublicLedgerCheckbox bind:checked={keepPublic} label="keep public" compact />
						<span class="text-xs text-muted-foreground">
							{#if isBinarySwipeable}
								Tap or swipe card
							{:else}
								Select to advance
							{/if}
						</span>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Caught Up State -->
			<div class="flex w-full flex-col items-center justify-center gap-5 rounded-2xl border border-border/80 bg-card/85 p-6 text-center backdrop-blur-md">
				<div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
					<CheckCircle2 class="h-8 w-8" />
				</div>
				<div class="space-y-2">
					<h2 class="font-heading text-xl font-bold">You're caught up</h2>
					<p class="max-w-xs text-xs leading-relaxed text-muted-foreground">
						Answered all {totalCount} questions currently stored on the relay.
					</p>
				</div>
				<div class="flex w-full max-w-xs flex-col gap-2.5">
					<Button
						onclick={() => sessionStore.setOnboardingStep('ask-first')}
						class="w-full cursor-pointer"
					>
						<Plus class="mr-2 h-4 w-4" />
						Ask a Question
					</Button>
					<Button
						variant="secondary"
						onclick={() => sessionStore.setActiveTab('dashboard')}
						class="w-full cursor-pointer"
					>
						<LayoutDashboard class="mr-2 h-4 w-4" />
						View Dashboard &amp; Ledger
					</Button>
					<Button
						variant="outline"
						onclick={handleRefresh}
						disabled={ledgerStore.isLoadingQuestions}
						class="w-full cursor-pointer"
					>
						<RefreshCw class={`mr-2 h-4 w-4 ${ledgerStore.isLoadingQuestions ? 'animate-spin' : ''}`} />
						Refresh Feed
					</Button>
				</div>
			</div>
		{/if}
	</div>

	{#if currentQuestion}
		<div class="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
			<Sparkles class="h-3 w-3 text-primary" />
			{#if ledgerStore.remainingGenesisCount > 0}
				<span>
					{ledgerStore.remainingGenesisCount} Genesis profile {ledgerStore.remainingGenesisCount === 1
						? 'question'
						: 'questions'} remaining before community feed
				</span>
			{:else}
				<span>
					Live from relay · {ledgerStore.remainingCommunityCount} community questions left
				</span>
			{/if}
		</div>
	{/if}
</div>
