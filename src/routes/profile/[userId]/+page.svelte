<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import DIContainer from '$lib/config/di-container';
	import type { UserProfile, AnswerWithQuestion } from '$lib/models';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { MessageSquare, Eye } from 'lucide-svelte';

	let userId = $state('');
	let profile = $state<UserProfile | null>(null);
	let answers = $state<AnswerWithQuestion[]>([]);
	let isLoading = $state(true);

	$effect(() => {
		userId = $page.params.userId;
		if (userId) {
			loadProfile();
		}
	});

	async function loadProfile() {
		isLoading = true;
		try {
			const profileService = DIContainer.getProfileService();
			profile = await profileService.getUserProfile(userId);
			// Only load public answers for other users
			answers = await profileService.getProfileAnswers(userId, false);
		} catch (err) {
			console.error('Failed to load profile:', err);
		} finally {
			isLoading = false;
		}
	}

	function getInitials(name: string): string {
		return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
	}

	function sendDMQuestion() {
		goto('/dm/compose?recipientId=' + userId);
	}
</script>

<div class="max-w-4xl mx-auto space-y-6">
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<CardTitle>User Profile</CardTitle>
				{#if authStore.currentUser && authStore.currentUser.id !== userId}
					<Button onclick={sendDMQuestion}>
						<MessageSquare class="w-4 h-4 mr-1" />
						Send DM Question
					</Button>
				{/if}
			</div>
		</CardHeader>
		<CardContent class="space-y-4">
			{#if isLoading}
				<p class="text-center text-muted-foreground">Loading profile...</p>
			{:else if profile}
				<div class="flex items-start gap-4">
					{#if profile.avatarUrl}
						<img
							src={profile.avatarUrl}
							alt={profile.name}
							class="w-16 h-16 rounded-full"
						/>
					{:else}
						<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
							<span class="text-2xl font-bold text-primary">
								{getInitials(profile.name)}
							</span>
						</div>
					{/if}

					<div class="flex-1">
						<h2 class="text-2xl font-bold">{profile.name}</h2>
						{#if profile.username}
							<p class="text-muted-foreground">@{profile.username}</p>
						{/if}
						{#if profile.location}
							<p class="text-sm text-muted-foreground mt-1">📍 {profile.location}</p>
						{/if}
						{#if profile.birthdate}
							<p class="text-sm text-muted-foreground">🎂 {new Date(profile.birthdate).toLocaleDateString()}</p>
						{/if}
					</div>
				</div>

				<div class="pt-4 border-t">
					<h3 class="text-lg font-semibold mb-3">Stats</h3>
					<div class="grid grid-cols-2 gap-4 text-center">
						<div>
							<div class="text-2xl font-bold">{profile.questionsAnswered}</div>
							<div class="text-sm text-muted-foreground">Questions Answered</div>
						</div>
						<div>
							<div class="text-2xl font-bold text-green-600">{profile.publicAnswerCount}</div>
							<div class="text-sm text-muted-foreground">Public Answers</div>
						</div>
					</div>
				</div>
			{:else}
				<p class="text-center text-destructive">User not found</p>
			{/if}
		</CardContent>
	</Card>

	{#if !isLoading && answers.length > 0}
		<Card>
			<CardHeader>
				<CardTitle>Public Answers</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				{#each answers as answer (answer.id)}
					<div class="border rounded-lg p-4 space-y-3">
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1 space-y-2">
								<p class="font-medium">{answer.question.text}</p>
								<div class="flex items-center gap-2">
									<Badge variant="outline" class="bg-primary/10">
										{answer.choiceText}
									</Badge>
									<Badge variant="default">
										<span class="flex items-center gap-1">
											<Eye class="w-3 h-3" /> Public
										</span>
									</Badge>
								</div>
								<p class="text-xs text-muted-foreground">
									Answered on {new Date(answer.createdAt).toLocaleDateString()}
								</p>
							</div>
						</div>
					</div>
				{/each}
			</CardContent>
		</Card>
	{:else if !isLoading && answers.length === 0}
		<Card>
			<CardContent class="py-8">
				<p class="text-center text-muted-foreground">
					No public answers yet
				</p>
			</CardContent>
		</Card>
	{/if}
</div>
