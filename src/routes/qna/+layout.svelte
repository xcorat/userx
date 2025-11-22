<script lang="ts">
	import '../../app.css';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import QnAHeader from '$lib/components/layout/QnAHeader.svelte';
	import { Toaster } from 'svelte-sonner';
	
	let { children } = $props();

	// Note: Theme is now managed centrally in root +layout.svelte
</script>

<div class="min-h-screen bg-background">
	{#if authStore.isAuthenticated}
		<QnAHeader />
	{/if}

	<main class="container mx-auto px-4 py-8 max-w-[950px]">
		{@render children?.()}
	</main>
</div>

<Toaster richColors position="bottom-right" closeButton />