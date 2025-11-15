<script lang="ts">
	import { searchStore } from '$lib/stores/search.store.svelte';
	import { goto } from '$app/navigation';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { onMount } from 'svelte';

	let searchInput = $state('');

	function handleInputChange(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		searchInput = value;
		searchStore.setQuery(value);
	}

	function handleTabChange(tab: 'users' | 'questions') {
		searchStore.setActiveTab(tab);
	}

	async function handleSearch() {
		await searchStore.executeSearch();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSearch();
		}
	}

	function goToProfile(userId: string) {
		goto(`/profile/${userId}`);
	}

	onMount(() => {
		// Reset store when component mounts
		searchStore.reset();
	});
</script>

<div class="max-w-2xl mx-auto">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-4">Search</h1>
		<div class="flex gap-2">
			<Input
				type="text"
				placeholder="Search users by username, email, or name..."
				bind:value={searchInput}
				onchange={handleInputChange}
				oninput={handleInputChange}
				onkeydown={handleKeyDown}
				class="flex-1"
			/>
			<Button onclick={handleSearch} disabled={searchStore.isLoading || !searchInput.trim()}>
				{#if searchStore.isLoading}
					Searching...
				{:else}
					Search
				{/if}
			</Button>
		</div>
	</div>

	<!-- Tab Navigation -->
	<div class="flex gap-2 mb-6 border-b">
		<button
			onclick={() => handleTabChange('users')}
			class="px-4 py-2 font-medium transition-colors {searchStore.activeTab === 'users'
				? 'text-primary border-b-2 border-primary'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			Users
		</button>
		<button
			onclick={() => handleTabChange('questions')}
			class="px-4 py-2 font-medium transition-colors {searchStore.activeTab === 'questions'
				? 'text-primary border-b-2 border-primary'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			Questions
		</button>
	</div>

	<!-- Content -->
	{#if searchStore.activeTab === 'users'}
		<div class="space-y-4">
			{#if searchStore.error}
				<div class="text-center py-8">
					<p class="text-destructive">{searchStore.error}</p>
				</div>
			{:else if searchStore.isLoading}
				<div class="text-center py-8">
					<p class="text-muted-foreground">Searching...</p>
				</div>
			{:else if searchStore.hasSearched && searchStore.searchResults.length === 0}
				<div class="text-center py-8">
					<p class="text-muted-foreground">No users found matching "{searchInput}"</p>
				</div>
			{:else if !searchStore.hasSearched}
				<div class="text-center py-8">
					<p class="text-muted-foreground">Enter a search term and click Search to find users</p>
				</div>
			{:else}
				{#each searchStore.searchResults as user (user.id)}
					<Card
						class="p-4 cursor-pointer hover:bg-accent transition-colors"
						onclick={() => goToProfile(user.id)}
					>
						<div class="flex items-center gap-4">
							{#if user.avatarUrl}
								<img
									src={user.avatarUrl}
									alt={user.name}
									class="w-12 h-12 rounded-full object-cover"
								/>
							{:else}
								<div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
									<span class="text-sm font-semibold">
										{user.name.charAt(0).toUpperCase()}
									</span>
								</div>
							{/if}
							<div class="flex-1">
								<h3 class="font-semibold">{user.name}</h3>
								{#if user.username}
									<p class="text-sm text-muted-foreground">@{user.username}</p>
								{/if}
								<p class="text-sm text-muted-foreground">{user.email}</p>
								{#if user.location}
									<p class="text-sm text-muted-foreground">{user.location}</p>
								{/if}
							</div>
						</div>
					</Card>
				{/each}
			{/if}
		</div>
	{:else if searchStore.activeTab === 'questions'}
		<div class="text-center py-8">
			<p class="text-muted-foreground">Question search coming soon...</p>
		</div>
	{/if}
</div>