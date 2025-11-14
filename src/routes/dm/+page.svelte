<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { dmStore } from '$lib/stores/dm.store.svelte';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
	import { Plus, Send, CheckCircle, Clock } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import type { CreateDMAnswerDTO } from '$lib/models';

	let activeTab = $state<'received' | 'sent'>('received');
	let answeringDM = $state<string | null>(null);
	let selectedChoice = $state<Record<string, string>>({});

	onMount(() => {
		loadData();
	});

	async function loadData() {
		if (activeTab === 'received') {
			await dmStore.loadInbox();
		} else {
			await dmStore.loadSent();
		}
	}

	async function switchTab(tab: 'received' | 'sent') {
		activeTab = tab;
		await loadData();
	}

	function handleNewDM() {
		goto('/dm/compose');
	}

	function startAnswering(dmId: string) {
		answeringDM = dmId;
		selectedChoice[dmId] = '';
	}

	function cancelAnswering() {
		answeringDM = null;
	}

	async function submitAnswer(dmId: string, conversation: any) {
		if (!authStore.currentUser) {
			toast.error('You must be logged in');
			return;
		}

		const choiceId = selectedChoice[dmId];
		if (!choiceId && conversation.question.choices && conversation.question.choices.length > 0) {
			toast.error('Please select an answer');
			return;
		}

		try {
			const answerData: CreateDMAnswerDTO = {
				dmQuestionId: dmId,
				userId: authStore.currentUser.id,
				choiceId: choiceId || undefined
			};

			await dmStore.answerQuestion(answerData);
			toast.success('Answer submitted!');
			answeringDM = null;
			delete selectedChoice[dmId];
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to submit answer');
		}
	}

	function formatDate(date: Date | string): string {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric', 
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Direct Messages</h1>
		<Button onclick={handleNewDM}>
			<Plus class="w-4 h-4 mr-1" />
			New DM Question
		</Button>
	</div>

	<!-- Tabs -->
	<div class="flex gap-2 border-b">
		<Button
			variant={activeTab === 'received' ? 'default' : 'ghost'}
			onclick={() => switchTab('received')}
		>
			Received
		</Button>
		<Button
			variant={activeTab === 'sent' ? 'default' : 'ghost'}
			onclick={() => switchTab('sent')}
		>
			Sent
		</Button>
	</div>

	{#if dmStore.isLoading}
		<p class="text-center text-muted-foreground py-8">Loading...</p>
	{:else if dmStore.error}
		<p class="text-center text-destructive py-8">{dmStore.error}</p>
	{:else if activeTab === 'received'}
		<!-- Received DMs -->
		{#if dmStore.receivedConversations.length === 0}
			<Card>
				<CardContent class="py-12">
					<p class="text-center text-muted-foreground">
						No direct message questions yet
					</p>
				</CardContent>
			</Card>
		{:else}
			<div class="space-y-4">
				{#each dmStore.receivedConversations as conversation (conversation.question.id)}
					{@const dm = conversation.question}
					<Card>
						<CardHeader>
							<div class="flex items-start justify-between">
								<div class="space-y-1">
									<CardTitle class="text-lg">{dm.text}</CardTitle>
									<CardDescription>
										From: {conversation.sender.name}
										· {formatDate(dm.createdAt)}
									</CardDescription>
								</div>
								{#if conversation.answer}
									<Badge variant="default">
										<CheckCircle class="w-3 h-3 mr-1" />
										Answered
									</Badge>
								{:else}
									<Badge variant="secondary">
										<Clock class="w-3 h-3 mr-1" />
										Pending
									</Badge>
								{/if}
							</div>
						</CardHeader>
						<CardContent class="space-y-4">
							{#if conversation.answer}
								<!-- Show answer -->
								<div class="bg-secondary/20 p-4 rounded-lg">
									<p class="text-sm font-medium mb-2">Your answer:</p>
									{#if conversation.answer.choiceId && dm.choices}
										{@const choice = dm.choices.find(c => c.id === conversation.answer?.choiceId)}
										<p class="font-medium">{choice?.text || 'Unknown'}</p>
									{:else}
										<p class="italic text-muted-foreground">Text answer</p>
									{/if}
									<p class="text-xs text-muted-foreground mt-2">
										Answered on {formatDate(conversation.answer.createdAt)}
									</p>
								</div>
							{:else if answeringDM === dm.id}
								<!-- Answer form -->
								{#if dm.choices && dm.choices.length > 0}
									<div class="space-y-3">
										<Label>Select your answer:</Label>
										<RadioGroup bind:value={selectedChoice[dm.id]}>
											{#each dm.choices as choice}
												<div class="flex items-center space-x-2">
													<RadioGroupItem value={choice.id} id={choice.id} />
													<Label for={choice.id} class="font-normal cursor-pointer">
														{choice.text}
													</Label>
												</div>
											{/each}
										</RadioGroup>
									</div>
								{:else}
									<p class="text-sm text-muted-foreground">
										This is an open-ended question (no choices provided)
									</p>
								{/if}

								<div class="flex gap-2">
									<Button onclick={() => submitAnswer(dm.id, conversation)}>
										<Send class="w-4 h-4 mr-1" />
										Submit Answer
									</Button>
									<Button variant="outline" onclick={cancelAnswering}>
										Cancel
									</Button>
								</div>
							{:else}
								<!-- Show choices or answer button -->
								{#if dm.choices && dm.choices.length > 0}
									<div class="space-y-2">
										<p class="text-sm font-medium">Choices:</p>
										<ul class="list-disc list-inside space-y-1">
											{#each dm.choices as choice}
												<li class="text-sm">{choice.text}</li>
											{/each}
										</ul>
									</div>
								{/if}
								<Button onclick={() => startAnswering(dm.id)}>
									Answer Question
								</Button>
							{/if}
						</CardContent>
					</Card>
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Sent DMs -->
		{#if dmStore.sentConversations.length === 0}
			<Card>
				<CardContent class="py-12">
					<p class="text-center text-muted-foreground">
						You haven't sent any DM questions yet
					</p>
				</CardContent>
			</Card>
		{:else}
			<div class="space-y-4">
				{#each dmStore.sentConversations as conversation (conversation.question.id)}
					{@const dm = conversation.question}
					<Card>
						<CardHeader>
							<div class="flex items-start justify-between">
								<div class="space-y-1">
									<CardTitle class="text-lg">{dm.text}</CardTitle>
									<CardDescription>
										To: {conversation.sender.name}
										· {formatDate(dm.createdAt)}
									</CardDescription>
								</div>
								{#if conversation.answer}
									<Badge variant="default">
										<CheckCircle class="w-3 h-3 mr-1" />
										Answered
									</Badge>
								{:else}
									<Badge variant="secondary">
										<Clock class="w-3 h-3 mr-1" />
										Waiting
									</Badge>
								{/if}
							</div>
						</CardHeader>
						<CardContent>
							{#if dm.choices && dm.choices.length > 0}
								<div class="space-y-2 mb-4">
									<p class="text-sm font-medium">Choices:</p>
									<ul class="list-disc list-inside space-y-1">
										{#each dm.choices as choice}
											<li class="text-sm">{choice.text}</li>
										{/each}
									</ul>
								</div>
							{/if}

							{#if conversation.answer}
								<div class="bg-secondary/20 p-4 rounded-lg">
									<p class="text-sm font-medium mb-2">Their answer:</p>
									{#if conversation.answer.choiceId && dm.choices}
										{@const choice = dm.choices.find(c => c.id === conversation.answer?.choiceId)}
										<p class="font-medium">{choice?.text || 'Unknown'}</p>
									{:else}
										<p class="italic text-muted-foreground">Text answer</p>
									{/if}
									<p class="text-xs text-muted-foreground mt-2">
										Answered on {formatDate(conversation.answer.createdAt)}
									</p>
								</div>
							{:else}
								<p class="text-sm text-muted-foreground italic">
									Waiting for response...
								</p>
							{/if}
						</CardContent>
					</Card>
				{/each}
			</div>
		{/if}
	{/if}
</div>
