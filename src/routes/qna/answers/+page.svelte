<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import DIContainer from '$lib/config/di-container';
	import type { AnswerWithQuestion } from '$lib/models';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Eye } from 'lucide-svelte';
	import QuestionAggregates from '$lib/components/features/questions/QuestionAggregates.svelte';

	let answers = $state<AnswerWithQuestion[]>([]);
	let isLoading = $state(true);
	let loadingStats = $state<Record<string, boolean>>({});
	let aggregatesMap = $state<Record<string, any>>({});

	onMount(async () => {
		if (!authStore.currentUser) {
			goto('/login');
			return;
		}

		await loadAnswers();
	});

	async function loadAnswers() {
		if (!authStore.currentUser) return;
		isLoading = true;
		try {
			const profileService = DIContainer.getProfileService();
			answers = await profileService.getProfileAnswers(authStore.currentUser.id, false);

			// Load aggregates for each answered question
			const aggregateService = DIContainer.getAggregateService();
			for (const a of answers) {
				const qid = a.question.id;
				loadingStats[qid] = true;
				const agg = await aggregateService.getQuestionAggregates(qid);
				aggregatesMap[qid] = agg;
				loadingStats[qid] = false;
			}
		} catch (err) {
			console.error('Failed to load answers:', err);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="space-y-6">
	{#if isLoading}
		<p class="text-center text-muted-foreground">Loading your public answers...</p>
	{:else if answers.length > 0}
		<Card>
			<CardHeader>
				<CardTitle>Your Public Answers</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				{#each answers as answer (answer.id)}
					<div class="border rounded-lg p-4 space-y-3">
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1 space-y-2">
								<p class="font-medium">{answer.question.text}</p>
								<div class="flex items-center gap-2">
									<Badge variant="outline" class="bg-primary/10">{answer.choiceText}</Badge>
									<Badge variant="default"><span class="flex items-center gap-1"><Eye class="w-3 h-3" /> Public</span></Badge>
								</div>
								<p class="text-xs text-muted-foreground">Answered on {new Date(answer.createdAt).toLocaleDateString()}</p>
								{#if aggregatesMap[answer.question.id]}
									<QuestionAggregates question={answer.question} aggregates={aggregatesMap[answer.question.id]} />
								{:else}
									<p class="text-sm text-muted-foreground">Loading stats...</p>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</CardContent>
		</Card>
	{:else}
		<Card>
			<CardContent class="py-8">
				<p class="text-center text-muted-foreground">You have no public answers yet.</p>
			</CardContent>
		</Card>
	{/if}
</div>
