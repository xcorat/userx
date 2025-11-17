<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	
	let { children } = $props();
</script>

<div class="min-h-screen bg-background">
	<main class="container mx-auto px-4 py-8 max-w-[950px]">
		{@render children?.()}
	</main>
</div>

<Toaster richColors position="bottom-right" closeButton />