<script lang="ts">
	import { onMount } from 'svelte';
	import {
		DEFAULT_PUBLIC_DEMO_QUESTION,
		findMatchingRelayQuestion
	} from '$lib/config/onboarding.questions';
	import { ledgerStore } from '$lib/stores/ledger.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import RelayStatusPill from '$lib/components/onboarding/RelayStatusPill.svelte';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { ArrowRight, Check, Globe, Lock } from 'lucide-svelte';

	let selectedOptionId = $state<string | null>(null);
	let submitted = $state(false);
	let isSubmitting = $state(false);

	let relayQuestion = $derived(
		findMatchingRelayQuestion(ledgerStore.questions, DEFAULT_PUBLIC_DEMO_QUESTION)
	);

	let displayOptions = $derived(
		relayQuestion ? relayQuestion.options : DEFAULT_PUBLIC_DEMO_QUESTION.options
	);

	let totalDisplayAnswers = $derived.by(() => {
		if (relayQuestion) {
			const liveTotal = Object.values(relayQuestion.communityCounts).reduce(
				(sum, c) => sum + c,
				0
			);
			if (liveTotal > 0) return liveTotal;
		}
		return DEFAULT_PUBLIC_DEMO_QUESTION.totalBaselineResponses;
	});

	function optionPercent(optionId: string, optionText: string): number {
		if (relayQuestion) {
			const liveTotal = Object.values(relayQuestion.communityCounts).reduce(
				(sum, c) => sum + c,
				0
			);
			if (liveTotal > 0) {
				const count = relayQuestion.communityCounts[optionId] ?? 0;
				return Math.round((count / liveTotal) * 100);
			}
		}
		const baseOpt = DEFAULT_PUBLIC_DEMO_QUESTION.options.find(
			(o) => o.id === optionId || o.text === optionText
		);
		const count = baseOpt
			? (DEFAULT_PUBLIC_DEMO_QUESTION.baselineCounts[baseOpt.id] ?? 0)
			: 0;
		return Math.round((count / DEFAULT_PUBLIC_DEMO_QUESTION.totalBaselineResponses) * 100);
	}

	onMount(async () => {
		if (ledgerStore.questions.length === 0 && sessionStore.relayStatus?.connected) {
			await ledgerStore
				.loadQuestionsFromRelay(sessionStore.relayStatus.rootPubkey ?? '')
				.catch(() => {});
		}
	});

	async function handleSubmit() {
		if (!selectedOptionId) {
			toast.error('Select an answer or skip this walkthrough question');
			return;
		}
		isSubmitting = true;
		try {
			if (relayQuestion && sessionStore.isAdmitted) {
				await sessionStore.ensureUnlockedOnRelay();
				await ledgerStore.submitAnswer(relayQuestion, selectedOptionId, false);
				toast.success('Saved encrypted response to your private store');
			} else if (!sessionStore.isAdmitted) {
				toast.success('Walkthrough choice previewed locally (waiting for vouch)');
			} else {
				toast.success('Walkthrough choice recorded privately');
			}
			submitted = true;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save response');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleContinue() {
		await sessionStore.advanceOnboardingStep('demo-sponsored');
	}
</script>

<div class="flex h-full flex-col justify-between gap-4 overflow-y-auto px-5 py-6">
	<RelayStatusPill
		stepLabel="Step 6 / 8"
		onBack={() => sessionStore.setOnboardingStep('details')}
	/>

	<div class="my-auto space-y-4 py-2">
		<div class="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
			<span class="font-mono font-semibold text-primary">Question #1</span>
			<span>·</span>
			<span class="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-foreground">
				<Globe class="h-3 w-3 text-primary" />
				Public
			</span>
			<span>·</span>
			<span class="font-mono">{totalDisplayAnswers.toLocaleString()} answers</span>
		</div>

		<h1 class="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
			{DEFAULT_PUBLIC_DEMO_QUESTION.text}
		</h1>

		<div class="space-y-2.5">
			{#each displayOptions as option (option.id)}
				{@const isSelected = selectedOptionId === option.id}
				{@const pct = optionPercent(option.id, option.text)}
				<button
					type="button"
					disabled={submitted || isSubmitting}
					onclick={() => (selectedOptionId = option.id)}
					class={`relative flex w-full cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-xl border px-4 py-3.5 text-left transition-all ${
						isSelected
							? 'border-primary bg-primary/15 text-foreground ring-1 ring-primary'
							: 'border-border bg-card/80 text-foreground hover:border-primary/50'
					}`}
				>
					{#if submitted}
						<div
							class="pointer-events-none absolute inset-y-0 left-0 bg-primary/15 transition-all duration-500"
							style={`width: ${pct}%;`}
						></div>
					{/if}
					<span class="relative z-10 flex items-center gap-2.5 text-sm font-medium">
						<span
							class={`flex h-4 w-4 items-center justify-center rounded-full border ${
								isSelected
									? 'border-primary bg-primary text-primary-foreground'
									: 'border-muted-foreground/60'
							}`}
						>
							{#if isSelected}
								<Check class="h-3 w-3" />
							{/if}
						</span>
						{option.text}
					</span>
					{#if submitted}
						<span class="relative z-10 font-mono text-xs font-semibold text-primary">
							{pct}%
						</span>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Locked Answer Mode Notice -->
		<div class="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-card/85 px-3.5 py-2.5 text-xs">
			<div class="flex items-center gap-2">
				<span class="font-medium text-muted-foreground">Answer Mode:</span>
				<span class="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-semibold text-primary">
					<Lock class="h-3 w-3" />
					Private
				</span>
			</div>
			<span class="font-mono text-[10px] text-muted-foreground">
				[✓] Always selected (Locked)
			</span>
		</div>

		{#if submitted}
			<div class="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs leading-relaxed text-foreground">
				Your choice stayed encrypted inside your <span class="font-mono">/private</span> store. Public percentages above only count opted-in public votes.
			</div>
		{:else}
			<p class="text-[11px] leading-relaxed text-muted-foreground">
				Note: Every question-and-answer set is uniquely indexed to prevent duplicate splits. Different choices create distinct questions.
			</p>
		{/if}
	</div>

	<div class="flex gap-2.5 pb-2">
		{#if !submitted}
			<Button
				type="button"
				variant="outline"
				onclick={handleContinue}
				disabled={isSubmitting}
				class="h-12 cursor-pointer px-4 text-xs font-semibold"
			>
				Skip Question
			</Button>
			<Button
				type="button"
				onclick={handleSubmit}
				disabled={isSubmitting}
				class="h-12 flex-1 cursor-pointer font-semibold"
			>
				{isSubmitting ? 'Encrypting...' : 'Submit & View Results'}
				<ArrowRight class="ml-2 h-4 w-4" />
			</Button>
		{:else}
			<Button
				type="button"
				onclick={handleContinue}
				size="lg"
				class="h-12 w-full cursor-pointer font-semibold"
			>
				Next Question
				<ArrowRight class="ml-2 h-4 w-4" />
			</Button>
		{/if}
	</div>
</div>
