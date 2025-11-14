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

	// Load aggregates if user has answered
	$effect(() => {
		if (question.userAnswered) {
			loadAggregates();
		}
	});

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
