<script lang="ts">
	import { authStore } from '$lib/stores/auth.store.svelte';
	import UserMenu from '$lib/components/features/user-menu.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Home } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	
	let { children } = $props();
	
	function goToMain() {
		goto('/');
	}
</script>

<div class="min-h-screen bg-background">
	{#if authStore.isAuthenticated}
		<!-- Floating Navigation - Top Right -->
		<div class="fixed top-4 right-4 z-50 flex items-center gap-2">
			<Button variant="ghost" size="sm" onclick={goToMain} class="h-8 px-2">
				<Home class="h-4 w-4 mr-1" />
				<span class="hidden sm:inline">Home</span>
			</Button>
			<UserMenu />
		</div>
	{/if}

	<main class="container mx-auto px-4 py-8">
		{@render children?.()}
	</main>
</div>