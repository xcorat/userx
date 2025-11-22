<script lang="ts">
import type { QuestionAggregates } from '$lib/models/aggregate.model';
import type { QuestionChoice } from '$lib/models/types';
	import { formatPercentage } from '$lib/utils/formatting';
	import { Badge } from '$lib/components/ui/badge';

interface Props {
	question: { id: string; text: string; choices: QuestionChoice[] };
	aggregates: QuestionAggregates;
}

let { question, aggregates }: Props = $props();
</script>

<div class="space-y-3">
	<p class="text-sm text-muted-foreground">
		{aggregates.totalPublicAnswers} public {aggregates.totalPublicAnswers === 1 ? 'answer' : 'answers'}
	</p>

	<div class="space-y-2">
		{#each question.choices as choice}
			{@const aggregate = aggregates.aggregates.find((a) => a.choiceId === choice.id)}
			{@const count = aggregate?.count || 0}
			{@const percentage = aggregate?.percentage || 0}

			<div class="space-y-1">
				<div class="flex items-center justify-between text-sm">
					<span>{choice.text}</span>
					<span class="text-muted-foreground">
						{count} ({formatPercentage(percentage)})
					</span>
				</div>
				<div class="h-2 bg-secondary rounded-full overflow-hidden">
					<div 
						class="h-full bg-primary transition-all duration-300"
						style="width: {percentage}%"
					></div>
				</div>
			</div>
		{/each}
	</div>
</div>
