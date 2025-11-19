<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { resetTheme } from '$lib/utils/theme';
	
	let { children } = $props();

	// Ensure default theme variables are used when rendering the root layout
	onMount(() => {
		resetTheme();
	});
</script>

<div class="min-h-screen bg-background">
	<main class="container mx-auto px-4 py-8 max-w-[950px]">
		{@render children?.()}
	</main>
</div>

<Toaster richColors position="bottom-right" closeButton toastOptions={{ style: 'opacity: 0.85;' }} />

 