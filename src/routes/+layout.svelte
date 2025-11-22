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
</script>

<div class="min-h-screen bg-background">
	<main class="container mx-auto px-4 py-8 max-w-[950px]">
		{@render children?.()}
	</main>
</div>

<Toaster richColors position="bottom-right" closeButton toastOptions={{ style: 'opacity: 0.75;' }} />

 