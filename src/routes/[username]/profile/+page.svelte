<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import DIContainer from '$lib/config/di-container';
	import type { UserProfile, AnswerWithQuestion } from '$lib/models';
	import { AnswerVisibility } from '$lib/models/types';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Eye, EyeOff } from 'lucide-svelte';

	let profile = $state<UserProfile | null>(null);
	let answers = $state<AnswerWithQuestion[]>([]);
	let allAnswers = $state<AnswerWithQuestion[]>([]);
	let isLoading = $state(true);
	let showPrivateAnswers = $state(true);
	let updatingVisibility = $state<Record<string, boolean>>({});

	onMount(() => {
		// Verify this is the current user's profile route
		const routeUsername = $page.params.username;
		if (!authStore.currentUser || authStore.currentUser.username !== routeUsername) {
			goto('/');
			return;
		}
		loadProfile();
	});

	async function loadProfile() {
		if (!authStore.currentUser) return;

		isLoading = true;
		try {
			const profileService = DIContainer.getProfileService();
			profile = await profileService.getUserProfile(authStore.currentUser.id);
			allAnswers = await profileService.getProfileAnswers(authStore.currentUser.id, true);
			answers = allAnswers;
		} catch (err) {
			console.error('Failed to load profile:', err);
		} finally {
			isLoading = false;
		}
	}

	async function toggleAnswerVisibility(answerId: string, currentVisibility: AnswerVisibility) {
		updatingVisibility[answerId] = true;
		
		try {
			const answerService = DIContainer.getAnswerService();
			const newVisibility = currentVisibility === AnswerVisibility.PUBLIC 
				? AnswerVisibility.PRIVATE 
				: AnswerVisibility.PUBLIC;
			await answerService.updateAnswerVisibility(answerId, newVisibility);
			
			// Update both arrays
			allAnswers = allAnswers.map(a => 
				a.id === answerId ? { ...a, visibility: newVisibility } : a
			);
			answers = answers.map(a => 
				a.id === answerId ? { ...a, visibility: newVisibility } : a
			);
			
			// Update profile stats
			if (profile) {
				if (newVisibility === 'public') {
					profile.publicAnswerCount++;
					profile.privateAnswerCount--;
				} else {
					profile.publicAnswerCount--;
					profile.privateAnswerCount++;
				}
			}
		} catch (err) {
			console.error('Failed to update visibility:', err);
		} finally {
			updatingVisibility[answerId] = false;
		}
	}

	$effect(() => {
		if (!showPrivateAnswers) {
			// Filter out private answers for display
			answers = allAnswers.filter(a => a.visibility === AnswerVisibility.PUBLIC);
		} else {
			// Show all answers
			answers = allAnswers;
		}
	});

	function getInitials(name: string): string {
		return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
	}
</script>

<div class="max-w-4xl mx-auto space-y-6">
	<Card>
		<CardHeader>
			<CardTitle>My Profile</CardTitle>
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
						<p class="text-sm text-muted-foreground">{profile.email}</p>
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
					<div class="grid grid-cols-3 gap-4 text-center">
						<div>
							<div class="text-2xl font-bold">{profile.questionsAnswered}</div>
							<div class="text-sm text-muted-foreground">Questions Answered</div>
						</div>
						<div>
							<div class="text-2xl font-bold text-green-600">{profile.publicAnswerCount}</div>
							<div class="text-sm text-muted-foreground">Public Answers</div>
						</div>
						<div>
							<div class="text-2xl font-bold text-blue-600">{profile.privateAnswerCount}</div>
							<div class="text-sm text-muted-foreground">Private Answers</div>
						</div>
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>

	{#if !isLoading && answers.length > 0}
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>My Answers</CardTitle>
					<Button
						variant="outline"
						size="sm"
						onclick={() => showPrivateAnswers = !showPrivateAnswers}
					>
						{showPrivateAnswers ? 'Hide Private' : 'Show All'}
					</Button>
				</div>
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
								<Badge variant={answer.visibility === AnswerVisibility.PUBLIC ? 'default' : 'secondary'}>
									{#if answer.visibility === AnswerVisibility.PUBLIC}
										<span class="flex items-center gap-1">
											<Eye class="w-3 h-3" /> Public
										</span>
									{:else}
										<span class="flex items-center gap-1">
											<EyeOff class="w-3 h-3" /> Private
										</span>
									{/if}
								</Badge>
								</div>
								<p class="text-xs text-muted-foreground">
									Answered on {new Date(answer.createdAt).toLocaleDateString()}
								</p>
							</div>
						<Button
							variant="ghost"
							size="sm"
							onclick={() => toggleAnswerVisibility(answer.id, answer.visibility)}
							disabled={updatingVisibility[answer.id]}
						>
							{updatingVisibility[answer.id] ? '...' : (answer.visibility === AnswerVisibility.PUBLIC ? 'Make Private' : 'Make Public')}
							</Button>
						</div>
					</div>
				{/each}
			</CardContent>
		</Card>
	{:else if !isLoading}
		<Card>
			<CardContent class="py-8">
				<p class="text-center text-muted-foreground">
					No answers yet. Start answering questions to build your profile!
				</p>
			</CardContent>
		</Card>
	{/if}
</div>