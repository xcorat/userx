<script lang="ts">
	import { onMount } from 'svelte';
	import {
		findMatchingRelayQuestion,
		toOnboardingDemoQuestion
	} from '$lib/config/onboarding.manifest';
	import { ledgerStore } from '$lib/stores/ledger.svelte';
	import { onboardingManifestStore } from '$lib/stores/onboarding-manifest.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import RelayStatusPill from '$lib/components/onboarding/RelayStatusPill.svelte';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { ArrowRight, Check, Globe, LockKeyhole } from 'lucide-svelte';

	let selectedOptionId = $state<string | null>(null);
	let submitted = $state(false);
	let isSubmitting = $state(false);

	let manifestQuestion = $derived(onboardingManifestStore.question('intro.preference'));
	let demo = $derived(
		manifestQuestion ? toOnboardingDemoQuestion(manifestQuestion) : null
	);
	let relayQuestion = $derived(
		demo ? findMatchingRelayQuestion(ledgerStore.questions, demo) : null
	);

	let displayOptions = $derived(
		relayQuestion?.options ?? demo?.options ?? []
	);

	let totalDisplayAnswers = $derived.by(() => {
		if (relayQuestion) {
			const liveTotal = Object.values(relayQuestion.communityCounts).reduce(
				(sum, c) => sum + c,
				0
			);
			if (liveTotal > 0) return liveTotal;
		}
		return demo?.totalBaselineResponses ?? 0;
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
		const baseOpt = demo?.options.find(
			(o) => o.id === optionId || o.text === optionText
		);
		const count = baseOpt
			? (demo?.baselineCounts[baseOpt.id] ?? 0)
			: 0;
		const total = demo?.totalBaselineResponses ?? 0;
		return total > 0 ? Math.round((count / total) * 100) : 0;
	}

	onMount(async () => {
		if (ledgerStore.questions.length === 0 && sessionStore.relayStatus?.connected) {
			await ledgerStore
				.loadQuestionsFromRelay(sessionStore.relayStatus.rootPubkey ?? '')
				.catch(() => {});
		}
	});

	async function handleSubmit() {
		if (!demo) {
			toast.error('Onboarding question is unavailable. Check the relay connection.');
			return;
		}
		if (!selectedOptionId) {
			toast.error('Select an answer or skip this walkthrough question');
			return;
		}
		isSubmitting = true;
		try {
			if (relayQuestion && sessionStore.isAdmitted) {
				await sessionStore.ensureUnlockedOnRelay();
				await ledgerStore.submitAnswer(relayQuestion, selectedOptionId, false);
				toast.success('Saved privately; your choice does not change public totals');
			} else if (!sessionStore.isAdmitted) {
				toast.success('Walkthrough choice previewed locally (waiting for vouch)');
			} else {
				toast.success('Walkthrough choice previewed locally; relay question is not available');
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
		<div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
			{demo?.text ?? 'Onboarding question unavailable'}
		</h1>
		{#if !demo}
			<p class="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-muted-foreground">
				{onboardingManifestStore.error ?? 'Connect to a relay seeded with the onboarding manifest to load this question.'}
			</p>
		{/if}

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

		<!-- The question is public; this onboarding response is private. -->
		<div class="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-card/85 px-3.5 py-2.5 text-xs">
			<div class="flex items-center gap-2">
				<span class="font-medium text-muted-foreground">Answer Mode:</span>
				<label class="inline-flex items-center gap-1.5 font-semibold text-primary">
					<input
						type="checkbox"
						checked
						disabled
						aria-label="Private answer mode, fixed"
						class="h-3.5 w-3.5 accent-[var(--primary)]"
					/>
					<LockKeyhole class="h-3 w-3" />
					Private
				</label>
			</div>
		</div>

		{#if submitted}
			<div class="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs leading-relaxed text-foreground">
				Your response is encrypted and does not contribute to the public totals above.
			</div>
		{:else}
			<p class="text-xs leading-relaxed text-muted-foreground">
				The question is public, but this intro response is private. Baseline results are display-only; your private response does not change them.
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
				disabled={isSubmitting || !demo}
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
