<script lang="ts">
	import type { QuestionWithStats, CreateAnswerDTO } from '$lib/models';
	import { AnswerVisibility } from '$lib/models';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
	import { toast } from 'svelte-sonner';

	interface Props {
		question: QuestionWithStats;
		onAnswer: (data: CreateAnswerDTO) => Promise<void>;
	}

	let { question, onAnswer }: Props = $props();

	let selectedChoiceId = $state('');
	let visibility = $state<AnswerVisibility>(AnswerVisibility.PUBLIC);
	let isSubmitting = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		if (!selectedChoiceId) {
			toast.error('Please select an answer');
			return;
		}

		if (!authStore.currentUser) {
			toast.error('You must be logged in to answer');
			return;
		}

		isSubmitting = true;

		try {
			await onAnswer({
				userId: authStore.currentUser.id,
				questionId: question.id,
				choiceId: selectedChoiceId,
				visibility
			});
			toast.success('Answer submitted successfully!');
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to submit answer');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<div class="space-y-3">
		<Label>Select your answer:</Label>
		<RadioGroup bind:value={selectedChoiceId}>
			{#each question.choices as choice}
				<div class="flex items-center space-x-2">
					<RadioGroupItem value={choice.id} id={choice.id} />
					<Label for={choice.id} class="font-normal cursor-pointer">
						{choice.text}
					</Label>
				</div>
			{/each}
		</RadioGroup>
	</div>

	<div class="space-y-3">
		<Label>Visibility:</Label>
		<RadioGroup bind:value={visibility}>
			<div class="flex items-center space-x-2">
				<RadioGroupItem value={AnswerVisibility.PUBLIC} id="public" />
				<Label for="public" class="font-normal cursor-pointer">
					Public (visible on your profile)
				</Label>
			</div>
			<div class="flex items-center space-x-2">
				<RadioGroupItem value={AnswerVisibility.PRIVATE} id="private" />
				<Label for="private" class="font-normal cursor-pointer">
					Private (only you can see)
				</Label>
			</div>
		</RadioGroup>
	</div>

	<Button type="submit" disabled={isSubmitting || !selectedChoiceId}>
		{isSubmitting ? 'Submitting...' : 'Submit Answer'}
	</Button>
</form>
