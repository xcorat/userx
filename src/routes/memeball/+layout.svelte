<!-- Memeball Independent Layout - No main app navigation -->
<script lang="ts">
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import UserMenu from '$lib/components/features/user-menu.svelte';
	
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
	<!-- Shared user menu in top right (hidden on bootstrap) -->
	{#if authStore.isAuthenticated && !isBootstrap}
		<div class="memeball-overlay">
			<UserMenu />
		</div>
	{/if}

	<!-- Main content area -->
	<main class="memeball-content">
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

	.memeball-overlay {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		z-index: 50;
		pointer-events: auto;
		background: transparent;
	}

	.memeball-content {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1;
	}

	@media (max-width: 640px) {
		.memeball-overlay {
			top: 1rem;
			right: 1rem;
		}
	}
</style>