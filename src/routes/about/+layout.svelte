<script lang="ts">
	import AppHeader from '$lib/components/layout/AppHeader.svelte';
	
	let { children } = $props();
</script>

<AppHeader containerClass="container mx-auto px-6 py-3 max-w-7xl" />

<main class="about-layout">
	{@render children?.()}
</main>

<style>
	.about-layout {
		min-height: calc(100vh - 80px);
		width: 100%;
	}
</style>
