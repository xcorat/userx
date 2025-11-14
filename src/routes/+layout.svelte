<script lang="ts">
	import '../app.css';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Toaster } from 'svelte-sonner';
	
	let { children } = $props();

	function handleLogout() {
		authStore.logout();
		goto('/login');
	}
</script>

<div class="min-h-screen bg-background">
	{#if authStore.isAuthenticated}
		<header class="border-b">
			<div class="container mx-auto px-4 py-4 flex items-center justify-between">
				<h1 class="text-2xl font-bold">
					<a href="/">QnA App</a>
				</h1>
				<nav class="flex items-center gap-4">
					<a href="/" class="hover:text-primary">Questions</a>
					<a href="/dm" class="hover:text-primary">DMs</a>
					<a href="/profile" class="hover:text-primary">Profile</a>
					<a href="/tests" class="hover:text-primary">DB Test</a>
					<Button variant="ghost" onclick={handleLogout}>Logout</Button>
				</nav>
			</div>
		</header>
	{/if}

	<main class="container mx-auto px-4 py-8">
		<slot />
	</main>
</div>

<Toaster richColors position="top-right" />