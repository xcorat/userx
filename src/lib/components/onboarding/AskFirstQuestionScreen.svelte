<script lang="ts">
	import { ledgerStore } from '$lib/stores/ledger.svelte';
	import { onboardingManifestStore } from '$lib/stores/onboarding-manifest.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import RelayStatusPill from '$lib/components/onboarding/RelayStatusPill.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
import { ArrowRight, Coins, Plus, Sparkles, Trash2, Zap } from 'lucide-svelte';

	let questionText = $state('');
	let choices = $state<string[]>(['', '']);
	let isPublishing = $state(false);
	let showGenesisContribution = $state(false);
	let selectedContribution = $state('');

	let contributionQuestion = $derived(
		onboardingManifestStore.question('genesis.contribution')
	);
	let contributionOptions = $derived(contributionQuestion?.answers ?? []);

	const MAX_CHOICES = 6;

	function addChoice() {
		if (choices.length >= MAX_CHOICES) return;
		choices = [...choices, ''];
	}

	function removeChoice(idx: number) {
		if (choices.length <= 2) return;
		choices = choices.filter((_, i) => i !== idx);
	}

	function updateChoice(idx: number, value: string) {
		const next = [...choices];
		next[idx] = value;
		choices = next;
	}

	async function handlePublish(event: SubmitEvent) {
		event.preventDefault();
		const cleanedPrompt = questionText.trim();
		const cleanedChoices = choices.map((c) => c.trim()).filter((c) => c.length > 0);

		if (cleanedPrompt.length < 3) {
			toast.error('Enter a question for the commons');
			return;
		}
		if (cleanedChoices.length < 2) {
			toast.error('Provide at least 2 answer choices');
			return;
		}
		if (new Set(cleanedChoices).size !== cleanedChoices.length) {
			toast.error('Choices must be unique');
			return;
		}

		if (!sessionStore.isAdmitted) {
			toast.info('Publishing questions unlocks as soon as your vouch is approved.');
			return;
		}
		isPublishing = true;
		try {
			await sessionStore.ensureUnlockedOnRelay();
			const rootPk = sessionStore.relayStatus?.rootPubkey ?? '';
			await ledgerStore.createQuestion(cleanedPrompt, cleanedChoices, rootPk);
			toast.success('Question published to araliya-net!');
			showGenesisContribution = true;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to publish question');
		} finally {
			isPublishing = false;
		}
	}

	async function finishGenesisContribution(saveResponse = true) {
		if (saveResponse && selectedContribution) {
			const question = ledgerStore.questions.find(
				(item) =>
					item.ownerType === 'genesis' &&
					item.text === contributionQuestion?.text &&
					item.multiple === contributionQuestion?.multiple &&
					item.options.length === contributionOptions.length &&
					item.options.every(
						(option, index) => option.text === contributionOptions[index]?.text
					)
			);
			const option = question?.options.find((item) => item.text === selectedContribution);
			if (!question || !option) {
				toast.error('Genesis’s private question is not available from the relay yet.');
				return;
			}

			try {
				await ledgerStore.submitAnswer(question, option.id, false);
				toast.success('Your response was saved privately');
			} catch (err) {
				toast.error(err instanceof Error ? err.message : 'Failed to save your private response');
				return;
			}
		}
		showGenesisContribution = false;
		await sessionStore.completeOnboarding();
	}

	async function handleSkipToApp() {
		await sessionStore.completeOnboarding();
	}
</script>

<form
	onsubmit={handlePublish}
	class="flex h-full flex-col justify-between gap-3 overflow-y-auto px-5 py-6"
>
	<RelayStatusPill
		stepLabel="Step 8 / 8"
		onBack={() => sessionStore.setOnboardingStep('demo-sponsored')}
	/>

	<div class="my-auto space-y-4 py-1">
		<div class="flex items-start justify-between gap-2">
			<div class="space-y-1">
				<p class="font-mono text-[11px] uppercase tracking-widest text-primary">
					Stage 4 · Add Your Own Question
				</p>
				<h1 class="font-heading text-2xl font-bold tracking-tight">
					Ask Your First Question
				</h1>
			</div>

			{#if sessionStore.demoTokenBalance > 0}
				<span class="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-accent">
					<Coins class="h-3 w-3" />
					{sessionStore.demoTokenBalance}
				</span>
			{/if}
		</div>

		<div class="space-y-3 rounded-2xl border border-border/80 bg-card/85 p-3.5">
			<div class="space-y-1.5">
				<Label for="first-question-input" class="text-xs font-semibold">Question</Label>
				<Input
					id="first-question-input"
					bind:value={questionText}
					placeholder="Ask the commons anything..."
					required
					class="h-10 bg-background/70 text-sm"
				/>
			</div>

			<div class="space-y-2">
				<Label class="text-xs font-semibold">Choices</Label>
				{#each choices as choice, idx (idx)}
					<div class="flex items-center gap-2">
						<span class="w-4 text-center font-mono text-[11px] text-muted-foreground">
							{idx + 1}.
						</span>
						<Input
							value={choice}
							oninput={(e) =>
								updateChoice(idx, (e.currentTarget as HTMLInputElement).value)}
							placeholder={`Option ${idx + 1}`}
							required={idx < 2}
							class="h-9 flex-1 bg-background/70 text-xs"
						/>
						{#if idx >= 2}
							<button
								type="button"
								onclick={() => removeChoice(idx)}
								aria-label="Remove choice"
								class="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:text-destructive"
							>
								<Trash2 class="h-3.5 w-3.5" />
							</button>
						{/if}
					</div>
				{/each}

				{#if choices.length < MAX_CHOICES}
					<button
						type="button"
						onclick={addChoice}
						class="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:underline"
					>
						<Plus class="h-3.5 w-3.5" />
						Add another choice
					</button>
				{/if}
			</div>

		</div>

		<!-- Not yet persisted by the Q&A protocol. -->
		<div class="space-y-2 rounded-2xl border border-accent/35 bg-accent/10 p-3.5 text-xs">
			<div class="flex items-center gap-1.5 font-semibold text-foreground">
				<Zap class="h-3.5 w-3.5 text-accent" />
				Sponsorship is a preview only
			</div>
			<p class="text-[11px] leading-relaxed text-muted-foreground">
				Publishing stores the question text and choices only. Reference links, sponsorship, token credits, and payments are not currently saved or processed.
			</p>
		</div>
	</div>

	<div class="space-y-2 pb-2">
		{#if !sessionStore.isAdmitted}
			<div class="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-200">
				Your vouch is still pending — you can browse the commons read-only right now, and ask questions once vouched.
			</div>
			<Button
				type="button"
				onclick={handleSkipToApp}
				size="lg"
				class="h-12 w-full cursor-pointer font-semibold"
			>
				Explore Commons While Waiting
				<ArrowRight class="ml-2 h-4 w-4" />
			</Button>
		{:else}
			<Button
				type="submit"
				disabled={isPublishing}
				size="lg"
				class="h-12 w-full cursor-pointer font-semibold"
			>
				<Sparkles class="mr-2 h-4 w-4" />
				{isPublishing ? 'Publishing Question...' : 'Publish Question & Enter App'}
				<ArrowRight class="ml-2 h-4 w-4" />
			</Button>
			<div class="text-center">
				<button
					type="button"
					onclick={handleSkipToApp}
					class="cursor-pointer text-xs text-muted-foreground hover:text-foreground hover:underline"
				>
					Skip for now &amp; Enter App →
				</button>
			</div>
		{/if}
	</div>
</form>

{#if showGenesisContribution}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-5 py-6 backdrop-blur-sm"
		role="presentation"
	>
		<div
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-labelledby="genesis-contribution-title"
			class="w-full max-w-md space-y-5 rounded-2xl border border-primary/30 bg-card p-5 shadow-2xl"
		>
			<div class="space-y-1.5">
				<p class="font-mono text-[11px] uppercase tracking-widest text-primary">
					A private question from Genesis
				</p>
				<h2 id="genesis-contribution-title" class="font-heading text-xl font-bold">
					{contributionQuestion?.text ?? 'Contribution question unavailable'}
				</h2>
				<p class="text-xs leading-relaxed text-muted-foreground">
					Choose one. Your response will be saved privately and won’t appear on the public ledger.
				</p>
			</div>

			<fieldset class="space-y-2">
				<legend class="sr-only">Ways you would contribute</legend>
				{#each contributionOptions as option (option.id)}
					<label
						class={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors hover:border-primary/50 ${
							selectedContribution === option.text
								? 'border-primary bg-primary/5'
								: 'border-border/80 bg-background/50'
						}`}
					>
						<input
							type="radio"
							name="genesis-contribution"
							value={option.text}
							bind:group={selectedContribution}
							class="h-4 w-4 accent-[var(--primary)]"
						/>
						<span>{option.text}</span>
					</label>
				{/each}
			</fieldset>

			<div class="flex gap-2">
				<Button
					type="button"
					variant="outline"
					onclick={() => finishGenesisContribution(false)}
					class="h-11 flex-1 cursor-pointer"
				>
					Skip
				</Button>
				<Button
					type="button"
					onclick={() => finishGenesisContribution()}
					disabled={!selectedContribution}
					class="h-11 flex-1 cursor-pointer"
				>
					Continue
					<ArrowRight class="ml-2 h-4 w-4" />
				</Button>
			</div>
		</div>
	</div>
{/if}
