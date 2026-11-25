<script lang="ts">
	import {
		DEFAULT_SPONSORED_DEMO_QUESTION,
		findMatchingRelayQuestion
	} from '$lib/config/onboarding.questions';
	import { ledgerStore } from '$lib/stores/ledger.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import RelayStatusPill from '$lib/components/onboarding/RelayStatusPill.svelte';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { ArrowRight, Check, Coins, ExternalLink, Link2, Paperclip, Zap } from 'lucide-svelte';

	let selectedOptionId = $state<string | null>(null);
	let showContext = $state(false);
	let isSubmitting = $state(false);

	let relayQuestion = $derived(
		findMatchingRelayQuestion(ledgerStore.questions, DEFAULT_SPONSORED_DEMO_QUESTION)
	);
	let displayOptions = $derived(
		relayQuestion ? relayQuestion.options : DEFAULT_SPONSORED_DEMO_QUESTION.options
	);
	let rewardTokens = DEFAULT_SPONSORED_DEMO_QUESTION.sponsoredRewardTokens ?? 5;

	async function handleAnswerAndEarn() {
		if (!selectedOptionId) {
			toast.error('Select Agree or Disagree to earn the walkthrough reward');
			return;
		}
		isSubmitting = true;
		try {
			if (relayQuestion && sessionStore.isAdmitted) {
				await sessionStore.ensureUnlockedOnRelay().catch(() => {});
				await ledgerStore.submitAnswer(relayQuestion, selectedOptionId, false).catch(() => {});
			}
			if (sessionStore.demoTokenBalance < rewardTokens) {
				sessionStore.awardDemoTokens(rewardTokens);
				toast.success(`+${rewardTokens} Tokens earned in onboarding walkthrough!`);
			}
			await sessionStore.advanceOnboardingStep('ask-first');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleSkip() {
		await sessionStore.advanceOnboardingStep('ask-first');
	}
</script>

<div class="flex h-full flex-col justify-between gap-4 overflow-y-auto px-5 py-6">
	<RelayStatusPill
		stepLabel="Step 7 / 8"
		onBack={() => sessionStore.setOnboardingStep('demo-public')}
	/>

	<div class="my-auto space-y-4 py-2">
		<div class="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
			<span class="font-mono font-semibold text-primary">Question #2</span>
			<span>·</span>
			<span class="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 font-semibold text-accent">
				<Zap class="h-3 w-3" />
				Sponsored (+{rewardTokens} Tokens)
			</span>
			<span class="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-foreground">
				<Link2 class="h-3 w-3 text-primary" />
				External Context
			</span>
		</div>

		<h1 class="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
			{DEFAULT_SPONSORED_DEMO_QUESTION.text}
		</h1>

		<div>
			<button
				type="button"
				onclick={() => (showContext = !showContext)}
				class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card/85 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/60"
			>
				<Paperclip class="h-3.5 w-3.5" />
				{showContext ? 'Hide background link' : 'Read background link'}
				<ExternalLink class="h-3 w-3" />
			</button>

			{#if showContext}
				<div class="mt-2 space-y-1.5 rounded-xl border border-border/80 bg-card/90 p-3 text-xs">
					<p class="leading-relaxed text-muted-foreground">
						{DEFAULT_SPONSORED_DEMO_QUESTION.referenceSummary}
					</p>
					{#if DEFAULT_SPONSORED_DEMO_QUESTION.referenceUrl}
						<a
							href={DEFAULT_SPONSORED_DEMO_QUESTION.referenceUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
						>
							{DEFAULT_SPONSORED_DEMO_QUESTION.referenceUrl}
							<ExternalLink class="h-3 w-3" />
						</a>
					{/if}
				</div>
			{/if}
		</div>

		<div class="space-y-2.5">
			{#each displayOptions as option (option.id)}
				{@const isSelected = selectedOptionId === option.id}
				<button
					type="button"
					disabled={isSubmitting}
					onclick={() => (selectedOptionId = option.id)}
					class={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
						isSelected
							? 'border-primary bg-primary/15 text-foreground ring-1 ring-primary'
							: 'border-border bg-card/80 text-foreground hover:border-primary/50'
					}`}
				>
					<span
						class={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
							isSelected
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-muted-foreground/60'
						}`}
					>
						{#if isSelected}
							<Check class="h-3 w-3" />
						{/if}
					</span>
					<span class="text-sm font-medium">{option.text}</span>
				</button>
			{/each}
		</div>

		<div class="space-y-1 rounded-2xl border border-accent/30 bg-accent/10 p-3.5 text-xs">
			<p class="flex items-center gap-1.5 font-semibold text-foreground">
				<Coins class="h-4 w-4 text-accent" />
				Monetize your choices, not your attention.
			</p>
			<p class="text-[11px] leading-relaxed text-muted-foreground">
				Sponsored questions generate tokens when you answer—powered by an open market that no single entity controls, with a share allocated to ongoing protocol development.
			</p>
		</div>
	</div>

	<div class="flex gap-2.5 pb-2">
		<Button
			type="button"
			variant="outline"
			onclick={handleSkip}
			disabled={isSubmitting}
			class="h-12 cursor-pointer px-4 text-xs font-semibold"
		>
			Skip
		</Button>
		<Button
			type="button"
			onclick={handleAnswerAndEarn}
			disabled={isSubmitting}
			class="h-12 flex-1 cursor-pointer font-semibold"
		>
			{isSubmitting ? 'Submitting...' : `Answer & Earn +${rewardTokens} Tokens`}
			<ArrowRight class="ml-2 h-4 w-4" />
		</Button>
	</div>
</div>
