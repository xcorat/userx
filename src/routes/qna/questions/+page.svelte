<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { questionsStore } from '$lib/stores/questions.store.svelte';
	import type { SortOption } from '$lib/utils/sorting';
	import type { CreateAnswerDTO } from '$lib/models';
	import QuestionCardAdapter from '$lib/components/features/questions/QuestionCardAdapter.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus, ChevronLeft, ChevronRight } from 'lucide-svelte';

	let sortValue = $state<SortOption>('newest');
	let cardNodes = $state<HTMLElement[]>([]);

	onMount(() => {
		questionsStore.loadQuestions('newest', 1);
	});

	async function handleAnswer(data: CreateAnswerDTO) {
		await questionsStore.answerQuestion(data);
	}

	function handleNewQuestion() {
		goto('/qna/questions/new');
	}

	async function handlePreviousPage() {
		await questionsStore.previousPage();
		// Reset card nodes when page changes
		cardNodes = [];
	}

	async function handleNextPage() {
		await questionsStore.nextPage();
		// Reset card nodes when page changes
		cardNodes = [];
	}

	function getNextCardRef(index: number): HTMLElement | null {
		const unansweredQuestions = questionsStore.questions.filter(q => !q.userAnswered);
		// Only return next card ref if there's a next question and the node exists
		if (index < unansweredQuestions.length - 1) {
			const nextIndex = index + 1;
			// Use a small delay to ensure the node is bound before accessing
			return cardNodes[nextIndex] || null;
		}
		return null;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-end mr-4">
		<Button variant="default" size="sm" onclick={handleNewQuestion}>
			<Plus class="w-4 h-4 mr-1" />
			New
		</Button>
	</div>

	{#if questionsStore.isLoading}
		<p class="text-center text-muted-foreground">Loading questions...</p>
	{:else if questionsStore.error}
		<p class="text-center text-destructive">{questionsStore.error}</p>
	{:else}
		{@const unansweredQuestions = questionsStore.questions.filter(q => !q.userAnswered)}
		{#if unansweredQuestions.length === 0}
			<p class="text-center text-muted-foreground">No unanswered questions</p>
		{:else}
			<div class="grid gap-6 md:grid-cols-2">
				{#each unansweredQuestions as question, index (question.id)}
					<div bind:this={cardNodes[index]}>
						<QuestionCardAdapter 
							{question} 
							onAnswer={handleAnswer} 
							onSkip={()=>{}} 
							nextCardRef={getNextCardRef(index)}
							normalizedPosition={0}
						/>
					</div>
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
	{/if}
</div>
