<script lang="ts">
	import type { QuestionWithStats, QuestionAggregates as AggregatesType, CreateAnswerDTO } from '$lib/models';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import QuestionAggregates from './QuestionAggregates.svelte';
	import AnswerForm from './AnswerForm.svelte';
	import DIContainer from '$lib/config/di-container';

	interface Props {
		question: QuestionWithStats;
		onAnswer: (data: CreateAnswerDTO) => Promise<void>;
	}

	let { question, onAnswer }: Props = $props();

	let aggregates = $state<AggregatesType | null>(null);
	let isLoadingAggregates = $state(false);
	let imageUrl = $state<string | null>(null);
	let isLoadingImage = $state(false);
	let imageError = $state(false);

	// Load image if present
	$effect(() => {
		if (question.imageHashId && !imageUrl && !imageError) {
			loadImage();
		}
	});

	// Load aggregates if user has answered
	$effect(() => {
		if (question.userAnswered) {
			loadAggregates();
		}
	});

  interface QuestionImage { imageUrl: string }

  async function loadImage() {
    if (!question.imageHashId) return;
    
    isLoadingImage = true;
    try {
      // Use fetch to call the API route directly
      const response = await fetch(`/api/questions/${question.id}/image`);
      if (response.ok) {
        const image = await response.json() as QuestionImage;
        imageUrl = image.imageUrl;
      } else if (response.status !== 404) {
        // Only log if it's not a 404 (no image found)
        console.error('Failed to load question image:', response.statusText);
        imageError = true;
      }
    } catch (error) {
      console.error('Failed to load question image:', error);
      imageError = true;
    } finally {
      isLoadingImage = false;
    }
  }

	function getImageUrl(hashId: string): string {
		return imageUrl || '';
	}

	function handleImageError() {
		imageError = true;
	}

	async function loadAggregates() {
		isLoadingAggregates = true;
		try {
			const aggregateService = DIContainer.getAggregateService();
			aggregates = await aggregateService.getQuestionAggregates(question.id);
		} finally {
			isLoadingAggregates = false;
		}
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>{question.text}</CardTitle>
		<CardDescription>
			{question.totalAnswers} {question.totalAnswers === 1 ? 'person has' : 'people have'} answered
			{#if question.userAnswered}
				· <Badge variant="secondary">{question.userAnswerVisibility}</Badge>
			{/if}
		</CardDescription>
	</CardHeader>
	{#if question.imageHashId}
		<div class="px-6 pb-4">
			<img 
				src={getImageUrl(question.imageHashId)} 
				alt=""
				class="w-full max-h-64 object-cover rounded-md"
				loading="lazy"
				onerror={handleImageError}
			/>
		</div>
	{/if}
	<CardContent>
		{#if question.userAnswered}
			{#if isLoadingAggregates}
				<p class="text-sm text-muted-foreground">Loading results...</p>
			{:else if aggregates}
				<QuestionAggregates {question} {aggregates} />
			{/if}
		{:else}
			<AnswerForm {question} {onAnswer} />
		{/if}
	</CardContent>
</Card>
