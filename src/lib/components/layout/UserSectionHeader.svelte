<script lang="ts">
	import { authStore } from '$lib/stores/auth.store.svelte';
	import AppHeader from '$lib/components/layout/AppHeader.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Search, MessageCircle, Users } from 'lucide-svelte';
	import { ButtonGroup } from '$lib/components/ui/button-group';
    
	let { children } = $props();
    
	// Placeholder for potential future navigation logic
</script>

<div class="min-h-screen bg-background">
	{#if authStore.isAuthenticated}
		<!-- Reuse AppHeader for consistent app toolbar and user menu -->
		<AppHeader>
			<!-- Center slot: icon-only on small screens, icon+text on md+ via responsive styles -->
			<div slot="center" class="flex items-center gap-2">
				<ButtonGroup class="inline-flex items-center gap-1" role="group">
					<!-- <Button href="/qna/search" variant="ghost" size="sm" class="rounded-none !px-2 md:!px-4" aria-label="Search">
						<Search class="h-4 w-4" />
						<span class="hidden md:inline ml-2">Search</span>
					</Button> -->
					<Button href={authStore.currentUser?.username ? `/${authStore.currentUser.username}/friends` : '/friends'} variant="ghost" size="sm" class="rounded-none !px-2 md:!px-4" aria-label="Friends">
						<Users class="h-4 w-4" />
						<span class="hidden md:inline ml-2">Friends</span>
					</Button>
					<Button href={authStore.currentUser?.username ? `/${authStore.currentUser.username}/dm` : '/dm'} variant="ghost" size="sm" class="rounded-none !px-2 md:!px-4" aria-label="Messages">
						<MessageCircle class="h-4 w-4" />
						<span class="hidden md:inline ml-2">Messages</span>
					</Button>
				</ButtonGroup>
			</div>
		</AppHeader>
	{/if}

	<main class="container mx-auto px-4 py-8">
		{@render children?.()}
	</main>
</div>