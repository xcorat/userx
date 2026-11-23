<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { Toaster } from 'svelte-sonner';
	import { themeStore } from '$lib/stores/theme.svelte';
	import MobileViewport from '$lib/components/layout/MobileViewport.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	$effect(() => {
		// Re-apply active local theme variables whenever themeId changes
		void themeStore.themeId;
		themeStore.applyCurrent();
	});
</script>

<MobileViewport>
	{@render children()}
</MobileViewport>

<Toaster richColors position="top-center" />
