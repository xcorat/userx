<!-- Memeball Independent Layout - No main app navigation -->
<script lang="ts">
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { applyTheme, resetTheme } from '$lib/utils/theme';
	import MemeBallHeader from '$lib/components/layout/MemeBallHeader.svelte';
	
	let { children } = $props();

	// Check if current route is bootstrap or transmission - use reactive $page store
	// Use $derived so it recalculates whenever $page changes
	let isBootstrap = $derived($page.url.pathname === '/memeball');
	let isTransmission = $derived($page.url.pathname.startsWith('/memeball/transmission'));

	// Ensure user is authenticated for main memeball views, but allow transmission & base redirect without login
	onMount(() => {
		const path = $page.url.pathname;
		const isTransmission = path.startsWith('/memeball/transmission');
		const isBase = path === '/memeball';
		if (!authStore.isAuthenticated && !isTransmission && !isBase) {
			goto('/login');
		}

		// Apply per-app theme for memeball
		applyTheme('memeball');

		// Cleanup on unmount
		return () => {
			try { resetTheme(); } catch (e) { /* ignore */ }
		};
	});
</script>

<!-- Full screen dark space theme -->
<div class="memeball-layout">
	<!-- Header with transparent background and navigation -->
	{#if authStore.isAuthenticated && !isBootstrap && !isTransmission}
		<MemeBallHeader />
	{/if}

	<!-- Main content area -->
	<main class="memeball-content">
		{@render children?.()}
	</main>
</div>

<style>
	/* Scoping memeball visual style inside the memeball container to avoid
	   leaking global body color/background into other routes */
	.memeball-layout {
		/* Ensure the full-screen layout covers the viewport and provides
		   the background and foreground color without setting body styles */
		height: 100vh;
		width: 100vw;
		color: #f8f5ff;
		 overflow-x: hidden;
		 /* Allow vertical scrolling when the inner content needs more height than the viewport
			 or the app is viewed on a narrow/small device. Previously overflow: hidden prevented
			 vertical scrolling. */
		 overflow-y: auto;
		background: radial-gradient(circle at top, rgba(88, 28, 135, 0.35), transparent 55%),
			linear-gradient(135deg, #040014 0%, #05011f 50%, #080a29 100%);
		position: fixed;
		top: 0;
		left: 0;
		/* Keep horizontal overflow hidden but do allow vertical scrolling */
		overflow-x: hidden;
	}

	.memeball-content {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1;
		/* Make the content scrollable while the background stays fixed */
		overflow-y: auto;
	}

	/* Header overlays content - no offset needed */
</style>