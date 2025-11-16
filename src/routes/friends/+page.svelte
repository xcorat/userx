<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import DIContainer from '$lib/config/di-container';
	import type { RelationWithUser } from '$lib/models';
	import { Button } from '$lib/components/ui/button';
	import { Tabs } from 'bits-ui';
	import { UserCheck, Clock, UserX, Mail } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let activeTab = $state('friends');
	let friends = $state<RelationWithUser[]>([]);
	let receivedRequests = $state<RelationWithUser[]>([]);
	let sentRequests = $state<RelationWithUser[]>([]);
	let isLoading = $state(false);

	onMount(async () => {
		await loadAllData();
	});

	async function loadAllData() {
		if (!authStore.currentUser) return;

		try {
			isLoading = true;
			const relationService = DIContainer.getRelationService();
			
			const [friendsData, receivedData, sentData] = await Promise.all([
				relationService.getFriends(authStore.currentUser.id),
				relationService.getReceivedRequests(authStore.currentUser.id),
				relationService.getSentRequests(authStore.currentUser.id)
			]);

			friends = friendsData;
			receivedRequests = receivedData;
			sentRequests = sentData;
		} catch (error) {
			console.error('Failed to load relation data:', error);
			toast.error('Failed to load friend data');
		} finally {
			isLoading = false;
		}
	}

	async function removeFriend(relationId: string) {
		if (!authStore.currentUser) return;

		try {
			const relationService = DIContainer.getRelationService();
			await relationService.removeRelation(authStore.currentUser.id, relationId);
			toast.success('Friend removed');
			await loadAllData();
		} catch (error) {
			console.error('Failed to remove friend:', error);
			toast.error('Failed to remove friend');
		}
	}

	async function approveRequest(relationId: string) {
		if (!authStore.currentUser) return;

		try {
			const relationService = DIContainer.getRelationService();
			await relationService.approveRequest(authStore.currentUser.id, relationId);
			toast.success('Friend request approved!');
			await loadAllData();
		} catch (error) {
			console.error('Failed to approve request:', error);
			toast.error('Failed to approve request');
		}
	}

	async function rejectRequest(relationId: string) {
		if (!authStore.currentUser) return;

		try {
			const relationService = DIContainer.getRelationService();
			await relationService.rejectRequest(authStore.currentUser.id, relationId);
			toast.success('Friend request rejected');
			await loadAllData();
		} catch (error) {
			console.error('Failed to reject request:', error);
			toast.error('Failed to reject request');
		}
	}

	async function cancelRequest(relationId: string) {
		if (!authStore.currentUser) return;

		try {
			const relationService = DIContainer.getRelationService();
			await relationService.removeRelation(authStore.currentUser.id, relationId);
			toast.success('Request cancelled');
			await loadAllData();
		} catch (error) {
			console.error('Failed to cancel request:', error);
			toast.error('Failed to cancel request');
		}
	}

	function renderUserCard(relation: RelationWithUser, actions: { label: string; onclick: () => void; variant?: any; icon?: any }[]) {
		return `
			<div class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition">
				<div class="flex items-center gap-4">
					${relation.avatarUrl 
						? `<img src="${relation.avatarUrl}" alt="${relation.name}" class="w-12 h-12 rounded-full" />`
						: `<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
							<span class="text-lg font-semibold text-primary">
								${relation.name.charAt(0).toUpperCase()}
							</span>
						</div>`
					}
					
					<div>
						<h3 class="font-semibold">${relation.name}</h3>
						<p class="text-sm text-muted-foreground">@${relation.username}</p>
					</div>
				</div>

				<div class="flex gap-2">
					${actions.map(action => `
						<button class="btn" onclick="${action.onclick}">
							${action.label}
						</button>
					`).join('')}
				</div>
			</div>
		`;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Friends</h1>
	</div>

	<!-- Tabs -->
	<div class="border-b">
		<div class="flex gap-4">
			<button
				class="px-4 py-2 border-b-2 transition {activeTab === 'friends' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				onclick={() => activeTab = 'friends'}
			>
				<UserCheck class="w-4 h-4 inline mr-1" />
				Friends ({friends.length})
			</button>
			<button
				class="px-4 py-2 border-b-2 transition {activeTab === 'received' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				onclick={() => activeTab = 'received'}
			>
				<Mail class="w-4 h-4 inline mr-1" />
				Requests ({receivedRequests.length})
			</button>
			<button
				class="px-4 py-2 border-b-2 transition {activeTab === 'sent' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
				onclick={() => activeTab = 'sent'}
			>
				<Clock class="w-4 h-4 inline mr-1" />
				Sent ({sentRequests.length})
			</button>
		</div>
	</div>

	<!-- Content -->
	<div class="space-y-4">
		{#if isLoading}
			<div class="text-center py-8 text-muted-foreground">
				Loading...
			</div>
		{:else if activeTab === 'friends'}
			{#if friends.length === 0}
				<div class="text-center py-8 text-muted-foreground">
					You don't have any friends yet. Use the search page to find people!
				</div>
			{:else}
			{#each friends as friend (friend.id)}
				<div 
					class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition cursor-pointer"
					onclick={() => goto(`/profile/${friend.userId}`)}
					onkeydown={(e) => e.key === 'Enter' && goto(`/profile/${friend.userId}`)}
						role="button"
						tabindex="0"
					>
						<div class="flex items-center gap-4">
							{#if friend.avatarUrl}
								<img src={friend.avatarUrl} alt={friend.name} class="w-12 h-12 rounded-full" />
							{:else}
								<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
									<span class="text-lg font-semibold text-primary">
										{friend.name.charAt(0).toUpperCase()}
									</span>
								</div>
							{/if}
							
							<div>
								<h3 class="font-semibold">{friend.name}</h3>
								<p class="text-sm text-muted-foreground">@{friend.username}</p>
							</div>
						</div>

						<Button 
							variant="ghost" 
							size="sm" 
							onclick={(e) => {
								e.stopPropagation();
								removeFriend(friend.id);
							}}
						>
							<UserX class="w-4 h-4 mr-1" />
							Remove
						</Button>
					</div>
				{/each}
			{/if}
		{:else if activeTab === 'received'}
			{#if receivedRequests.length === 0}
				<div class="text-center py-8 text-muted-foreground">
					No pending friend requests.
				</div>
			{:else}
			{#each receivedRequests as request (request.id)}
				<div 
					class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition cursor-pointer"
					onclick={() => goto(`/profile/${request.userId}`)}
					onkeydown={(e) => e.key === 'Enter' && goto(`/profile/${request.userId}`)}
						role="button"
						tabindex="0"
					>
						<div class="flex items-center gap-4">
							{#if request.avatarUrl}
								<img src={request.avatarUrl} alt={request.name} class="w-12 h-12 rounded-full" />
							{:else}
								<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
									<span class="text-lg font-semibold text-primary">
										{request.name.charAt(0).toUpperCase()}
									</span>
								</div>
							{/if}
							
							<div>
								<h3 class="font-semibold">{request.name}</h3>
								<p class="text-sm text-muted-foreground">@{request.username}</p>
							</div>
						</div>

						<div class="flex gap-2">
							<Button 
								variant="default" 
								size="sm" 
								onclick={(e) => {
									e.stopPropagation();
									approveRequest(request.id);
								}}
							>
								<UserCheck class="w-4 h-4 mr-1" />
								Accept
							</Button>
							<Button 
								variant="ghost" 
								size="sm" 
								onclick={(e) => {
									e.stopPropagation();
									rejectRequest(request.id);
								}}
							>
								<UserX class="w-4 h-4 mr-1" />
								Reject
							</Button>
						</div>
					</div>
				{/each}
			{/if}
		{:else if activeTab === 'sent'}
			{#if sentRequests.length === 0}
				<div class="text-center py-8 text-muted-foreground">
					No pending sent requests.
				</div>
			{:else}
			{#each sentRequests as request (request.id)}
				<div 
					class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition cursor-pointer"
					onclick={() => goto(`/profile/${request.userId}`)}
					onkeydown={(e) => e.key === 'Enter' && goto(`/profile/${request.userId}`)}
						role="button"
						tabindex="0"
					>
						<div class="flex items-center gap-4">
							{#if request.avatarUrl}
								<img src={request.avatarUrl} alt={request.name} class="w-12 h-12 rounded-full" />
							{:else}
								<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
									<span class="text-lg font-semibold text-primary">
										{request.name.charAt(0).toUpperCase()}
									</span>
								</div>
							{/if}
							
							<div>
								<h3 class="font-semibold">{request.name}</h3>
								<p class="text-sm text-muted-foreground">@{request.username}</p>
								<p class="text-xs text-muted-foreground mt-1">Pending...</p>
							</div>
						</div>

						<Button 
							variant="ghost" 
							size="sm" 
							onclick={(e) => {
								e.stopPropagation();
								cancelRequest(request.id);
							}}
						>
							Cancel
						</Button>
					</div>
				{/each}
			{/if}
		{/if}
	</div>
</div>
