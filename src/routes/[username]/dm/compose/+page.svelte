<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { dmStore } from '$lib/stores/dm.store.svelte';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import DIContainer from '$lib/config/di-container';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Card from '$lib/components/ui/card';
	import { Plus, X, Send } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { appConfig } from '$lib/config/app.config';
	import type { User, CreateDMQuestionDTO } from '$lib/models';

	let users = $state<User[]>([]);
	let selectedUserId = $state<string>('');
	let questionText = $state('');
	let choices = $state<string[]>([]);
	let isSubmitting = $state(false);
	let isLoadingUsers = $state(true);

	const MIN_CHOICES = 0; // DM questions can have no choices
	const MAX_CHOICES = appConfig.features.maxChoicesPerQuestion;

	onMount(async () => {
		await loadUsers();
	});

	async function loadUsers() {
		isLoadingUsers = true;
		try {
			const userService = DIContainer.getUserService();
			const allUsers = await userService.getAllUsers();
			// Filter out current user
			users = allUsers.filter(u => u.id !== authStore.currentUser?.id);
		} catch (err) {
			toast.error('Failed to load users');
		} finally {
			isLoadingUsers = false;
		}
	}

	function addChoice() {
		if (choices.length < MAX_CHOICES) {
			choices = [...choices, ''];
		}
	}

	function removeChoice(index: number) {
		choices = choices.filter((_, i) => i !== index);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!selectedUserId) {
			toast.error('Please select a recipient');
			return;
		}

		if (!questionText.trim()) {
			toast.error('Question text is required');
			return;
		}

		if (questionText.trim().length > appConfig.features.maxQuestionTextLength) {
			toast.error(`Question must be no more than ${appConfig.features.maxQuestionTextLength} characters`);
			return;
		}

		if (!authStore.currentUser) {
			toast.error('You must be logged in');
			return;
		}

		// Filter non-empty choices
		const nonEmptyChoices = choices.filter(c => c.trim());

		// Validate choices if provided
		for (const choice of nonEmptyChoices) {
			if (choice.length > appConfig.features.maxChoiceTextLength) {
				toast.error(`Choice must be no more than ${appConfig.features.maxChoiceTextLength} characters`);
				return;
			}
		}

		isSubmitting = true;

		try {
			const data: CreateDMQuestionDTO = {
				senderId: authStore.currentUser.id,
				recipientId: selectedUserId,
				text: questionText.trim(),
				choices: nonEmptyChoices.length > 0 
					? nonEmptyChoices.map((text, index) => ({ text: text.trim(), order: index }))
					: undefined
			};

			await dmStore.sendQuestion(data);
			toast.success('DM question sent!');
			goto(`/${authStore.currentUser?.username}/dm`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to send DM');
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		goto(`/${authStore.currentUser?.username}/dm`);
	}
</script>

<div class="max-w-2xl mx-auto">
	<Card.Root>
		<Card.Header>
			<Card.Title>Send DM Question</Card.Title>
			<Card.Description>
				Send a private question to another user. Choices are optional.
			</Card.Description>
		</Card.Header>
		<form onsubmit={handleSubmit}>
			<Card.Content class="space-y-6">
				<!-- Recipient Selection -->
				<div class="space-y-2">
					<Label for="recipient">Recipient *</Label>
					{#if isLoadingUsers}
						<p class="text-sm text-muted-foreground">Loading users...</p>
					{:else if users.length === 0}
						<p class="text-sm text-muted-foreground">No other users available</p>
					{:else}
						<select
							bind:value={selectedUserId}
							disabled={isSubmitting}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="">Select a user</option>
							{#each users as user (user.id)}
								<option value={user.id}>
									{user.name} {user.username ? `(@${user.username})` : ''}
								</option>
							{/each}
						</select>
					{/if}
				</div>

				<!-- Question Text -->
				<div class="space-y-2">
					<Label for="questionText">Question *</Label>
					<Textarea
						id="questionText"
						placeholder="What would you like to ask?"
						bind:value={questionText}
						disabled={isSubmitting}
						rows={3}
					/>
					<p class="text-xs text-muted-foreground">
						{questionText.length}/{appConfig.features.maxQuestionTextLength} characters
					</p>
				</div>

				<!-- Optional Choices -->
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<Label>Answer Choices (Optional)</Label>
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

					{#if choices.length > 0}
						<div class="space-y-3">
							{#each choices as choice, index (index)}
								<div class="flex gap-2">
									<div class="flex-1">
										<Input
											placeholder={`Choice ${index + 1}`}
											bind:value={choices[index]}
											disabled={isSubmitting}
										/>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onclick={() => removeChoice(index)}
										disabled={isSubmitting}
									>
										<X class="w-4 h-4" />
									</Button>
								</div>
							{/each}
						</div>
						<p class="text-xs text-muted-foreground">
							Empty choices will be ignored. Leave all empty for an open-ended question.
						</p>
					{:else}
						<p class="text-sm text-muted-foreground italic">
							No choices added. This will be an open-ended question.
						</p>
					{/if}
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
				<Button type="submit" disabled={isSubmitting || !selectedUserId || !questionText.trim()}>
					<Send class="w-4 h-4 mr-1" />
					{isSubmitting ? 'Sending...' : 'Send Question'}
				</Button>
			</Card.Footer>
		</form>
	</Card.Root>
</div>
