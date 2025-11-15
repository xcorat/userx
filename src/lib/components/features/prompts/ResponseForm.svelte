<script lang="ts">
	import type { PromptWithStats, CreateResponseDTO } from '$lib/models';
	import { ResponseVisibility } from '$lib/models';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
	import { toast } from 'svelte-sonner';

	interface Props {
		prompt: PromptWithStats;
		onresponse: (data: CreateResponseDTO) => Promise<void>;
	}

	let { prompt, onresponse }: Props = $props();

	let selectedChoiceId = $state('');
	let visibility = $state<ResponseVisibility>(ResponseVisibility.PUBLIC);
	let isSubmitting = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		if (!selectedChoiceId) {
			toast.error('Please select an response');
			return;
		}

		if (!authStore.currentUser) {
			toast.error('You must be logged in to response');
			return;
		}

		isSubmitting = true;

		try {
			await onresponse({
				userId: authStore.currentUser.id,
				promptId: prompt.id,
				choiceId: selectedChoiceId,
				visibility
			});
			toast.success('Response submitted successfully!');
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to submit response');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<div class="space-y-3">
		<Label>Select your response:</Label>
		<RadioGroup bind:value={selectedChoiceId}>
			{#each prompt.choices as choice}
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
				<RadioGroupItem value={ResponseVisibility.PUBLIC} id="public" />
				<Label for="public" class="font-normal cursor-pointer">
					Public (visible on your profile)
				</Label>
			</div>
			<div class="flex items-center space-x-2">
				<RadioGroupItem value={ResponseVisibility.PRIVATE} id="private" />
				<Label for="private" class="font-normal cursor-pointer">
					Private (only you can see)
				</Label>
			</div>
		</RadioGroup>
	</div>

	<Button type="submit" disabled={isSubmitting || !selectedChoiceId}>
		{isSubmitting ? 'Submitting...' : 'Submit Response'}
	</Button>
</form>
