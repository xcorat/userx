<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { questionsStore } from '$lib/stores/questions.store.svelte';
	import type { SortOption } from '$lib/utils/sorting';
	import type { CreateAnswerDTO } from '$lib/models';
	import QuestionCard from '$lib/components/features/questions/QuestionCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus, ChevronLeft, ChevronRight } from 'lucide-svelte';

	let sortValue = $state<SortOption>('newest');

	onMount(() => {
		questionsStore.loadQuestions('newest', 1);
	});

	async function handleSortChange(newValue: string | string[] | undefined) {
		if (typeof newValue === 'string') {
			sortValue = newValue as SortOption;
			await questionsStore.loadQuestions(sortValue, 1);
		}
	}

	async function handleAnswer(data: CreateAnswerDTO) {
		await questionsStore.answerQuestion(data);
	}

	function handleNewQuestion() {
		goto('/questions/new');
	}

	async function handlePreviousPage() {
		await questionsStore.previousPage();
	}

	async function handleNextPage() {
		await questionsStore.nextPage();
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Questions</h1>

		<div class="flex items-center gap-4">
			<Button variant="default" size="sm" onclick={handleNewQuestion}>
				<Plus class="w-4 h-4 mr-1" />
				New Question
			</Button>
			
			<div class="flex items-center gap-2">
				<span class="text-sm text-muted-foreground">Sort by:</span>
				<div class="flex gap-2">
					<Button 
						variant={sortValue === 'newest' ? 'default' : 'outline'} 
						size="sm"
						onclick={() => handleSortChange('newest')}
					>
						Newest
					</Button>
					<Button 
						variant={sortValue === 'trending' ? 'default' : 'outline'} 
						size="sm"
						onclick={() => handleSortChange('trending')}
					>
						Trending
					</Button>
					<Button 
						variant={sortValue === 'random' ? 'default' : 'outline'} 
						size="sm"
						onclick={() => handleSortChange('random')}
					>
						Random
					</Button>
				</div>
			</div>
		</div>
	</div>

	{#if questionsStore.isLoading}
		<p class="text-center text-muted-foreground">Loading questions...</p>
	{:else if questionsStore.error}
		<p class="text-center text-destructive">{questionsStore.error}</p>
	{:else if questionsStore.questions.length === 0}
		<p class="text-center text-muted-foreground">No questions yet</p>
	{:else}
		<div class="grid gap-6 md:grid-cols-2">
			{#each questionsStore.questions as question (question.id)}
				<QuestionCard {question} onAnswer={handleAnswer} />
			{/each}
		</div>

		<!-- Pagination Controls -->
		{#if questionsStore.totalPages > 1}
			<div class="flex items-center justify-center gap-4 mt-8">
				<Button
					variant="outline"
					size="sm"
					onclick={handlePreviousPage}
					disabled={questionsStore.currentPage === 1 || questionsStore.isLoading}
				>
					<ChevronLeft class="w-4 h-4 mr-1" />
					Previous
				</Button>

				<div class="flex items-center gap-2">
					<span class="text-sm text-muted-foreground">
						Page {questionsStore.currentPage} of {questionsStore.totalPages}
					</span>
					<span class="text-xs text-muted-foreground">
						({questionsStore.totalItems} total)
					</span>
				</div>

				<Button
					variant="outline"
					size="sm"
					onclick={handleNextPage}
					disabled={!questionsStore.hasMore || questionsStore.isLoading}
				>
					Next
					<ChevronRight class="w-4 h-4 ml-1" />
				</Button>
			</div>
		{/if}
	{/if}
</div>
