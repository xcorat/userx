<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { page } from '$app/stores';
	import { applyTheme, getThemeFromRoute } from '$lib/utils/theme';
	
	let { children } = $props();

	// Centralized theme management: apply theme based on current route
	$effect(() => {
		const themeName = getThemeFromRoute($page.url.pathname);
		applyTheme(themeName);
	});

	// Check if we're on an about page (which has its own layout)
	const isAboutPage = $derived($page.url.pathname.startsWith('/about'));
</script>

<div class="min-h-screen bg-background">
	{#if isAboutPage}
		<!-- About pages have their own layout with wider constraints -->
		{@render children?.()}
	{:else}
		<!-- App pages use standard container with max-w-950px -->
		<main class="container mx-auto px-4 py-8 max-w-[950px]">
			{@render children?.()}
		</main>
	{/if}
</div>

<Toaster richColors position="bottom-right" closeButton toastOptions={{ style: 'opacity: 0.75;' }} />

 