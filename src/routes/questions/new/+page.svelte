<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import DIContainer from '$lib/config/di-container';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Card from '$lib/components/ui/card';
	import { Plus, X } from 'lucide-svelte';
	import { appConfig } from '$lib/config/app.config';

	let questionText = $state('');
	let choices = $state<string[]>(['', '']);
	let isSubmitting = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	const MIN_CHOICES = appConfig.features.minChoicesPerQuestion;
	const MAX_CHOICES = appConfig.features.maxChoicesPerQuestion;

	function addChoice() {
		if (choices.length < MAX_CHOICES) {
			choices = [...choices, ''];
		}
	}

	function removeChoice(index: number) {
		if (choices.length > MIN_CHOICES) {
			choices = choices.filter((_, i) => i !== index);
		}
	}

	function validateForm(): boolean {
		fieldErrors = {};
		error = '';

		// Validate question text
		if (!questionText.trim()) {
			fieldErrors.questionText = 'Question text is required';
			return false;
		}
		if (questionText.trim().length < 10) {
			fieldErrors.questionText = 'Question must be at least 10 characters';
			return false;
		}
		if (questionText.trim().length > appConfig.features.maxQuestionTextLength) {
			fieldErrors.questionText = `Question must be no more than ${appConfig.features.maxQuestionTextLength} characters`;
			return false;
		}

		// Validate choices
		const nonEmptyChoices = choices.filter(c => c.trim());
		if (nonEmptyChoices.length < MIN_CHOICES) {
			error = `Please provide at least ${MIN_CHOICES} answer choices`;
			return false;
		}

		for (let i = 0; i < choices.length; i++) {
			const choice = choices[i].trim();
			if (choice && choice.length > appConfig.features.maxChoiceTextLength) {
				fieldErrors[`choice${i}`] = `Choice must be no more than ${appConfig.features.maxChoiceTextLength} characters`;
				return false;
			}
		}

		// Check for duplicate choices
		const uniqueChoices = new Set(nonEmptyChoices.map(c => c.toLowerCase()));
		if (uniqueChoices.size !== nonEmptyChoices.length) {
			error = 'Each choice must be unique';
			return false;
		}

		return true;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		if (!validateForm()) return;
		if (!authStore.currentUser) {
			error = 'You must be logged in to create a question';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const questionService = DIContainer.getQuestionService();
			const nonEmptyChoices = choices.filter(c => c.trim());

			await questionService.createQuestion({
				text: questionText.trim(),
				createdBy: authStore.currentUser.id,
				choices: nonEmptyChoices.map((text, index) => ({
					text: text.trim(),
					order: index
				}))
			});

			goto('/questions');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create question';
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		goto('/questions');
	}
</script>

<div class="max-w-2xl mx-auto">
	<Card.Root>
		<Card.Header>
			<Card.Title>Create a New Question</Card.Title>
			<Card.Description>
				Ask a question for the community to answer. Provide 2-{MAX_CHOICES} answer choices.
			</Card.Description>
		</Card.Header>
		<form onsubmit={handleSubmit}>
			<Card.Content class="space-y-6">
				{#if error}
					<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
						{error}
					</div>
				{/if}

				<!-- Question Text -->
				<div class="space-y-2">
					<Label for="questionText">Question *</Label>
					<Textarea
						id="questionText"
						placeholder="What's your question?"
						bind:value={questionText}
						disabled={isSubmitting}
						rows={3}
						class={fieldErrors.questionText ? 'border-destructive' : ''}
					/>
					{#if fieldErrors.questionText}
						<p class="text-sm text-destructive">{fieldErrors.questionText}</p>
					{:else}
						<p class="text-xs text-muted-foreground">
							{questionText.length}/{appConfig.features.maxQuestionTextLength} characters
						</p>
					{/if}
				</div>

				<!-- Answer Choices -->
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<Label>Answer Choices ({choices.filter(c => c.trim()).length}/{MAX_CHOICES}) *</Label>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={addChoice}
							disabled={isSubmitting || choices.length >= MAX_CHOICES}
						>
							<Plus class="w-4 h-4 mr-1" />
							Add Choice
						</Button>
					</div>

					<div class="space-y-3">
						{#each choices as choice, index (index)}
							<div class="flex gap-2">
								<div class="flex-1 space-y-1">
									<Input
										placeholder={`Choice ${index + 1}`}
										bind:value={choices[index]}
										disabled={isSubmitting}
										class={fieldErrors[`choice${index}`] ? 'border-destructive' : ''}
									/>
									{#if fieldErrors[`choice${index}`]}
										<p class="text-xs text-destructive">{fieldErrors[`choice${index}`]}</p>
									{/if}
								</div>
								{#if choices.length > MIN_CHOICES}
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onclick={() => removeChoice(index)}
										disabled={isSubmitting}
									>
										<X class="w-4 h-4" />
									</Button>
								{/if}
							</div>
						{/each}
					</div>

					<p class="text-xs text-muted-foreground">
						Provide at least {MIN_CHOICES} choices. Empty choices will be ignored.
					</p>
				</div>
			</Card.Content>
			<Card.Footer class="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					onclick={handleCancel}
					disabled={isSubmitting}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Creating...' : 'Create Question'}
				</Button>
			</Card.Footer>
		</form>
	</Card.Root>
</div>
