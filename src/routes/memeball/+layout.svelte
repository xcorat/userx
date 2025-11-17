<!-- Memeball Independent Layout - No main app navigation -->
<script lang="ts">
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import MemeBallHeader from '$lib/components/layout/MemeBallHeader.svelte';
	
	let { children } = $props();

	// Check if current route is bootstrap - use reactive $page store
	let isBootstrap = $derived($page.url.pathname === '/memeball');

	// Ensure user is authenticated for memeball
	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/login');
		}
	});
</script>

<!-- Full screen dark space theme -->
<div class="memeball-layout">
	<!-- Header with transparent background and navigation -->
	{#if authStore.isAuthenticated && !isBootstrap}
		<MemeBallHeader />
	{/if}

	<!-- Main content area -->
	<main class="memeball-content" class:with-header={!isBootstrap}>
		{@render children?.()}
	</main>
</div>

<style>
	:global(body) {
		background-color: #030014;
		color: #f8f5ff;
		overflow-x: hidden;
	}

	.memeball-layout {
		height: 100vh;
		width: 100vw;
		background: radial-gradient(circle at top, rgba(88, 28, 135, 0.35), transparent 55%),
			linear-gradient(135deg, #040014 0%, #05011f 50%, #080a29 100%);
		position: fixed;
		top: 0;
		left: 0;
		overflow: hidden;
	}

	.memeball-content {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1;
	}


	.memeball-content.with-header {
		/** no change for now.*/
		top: 0rem;
	}
</style>