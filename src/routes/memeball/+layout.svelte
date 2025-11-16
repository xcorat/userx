<!-- Memeball Independent Layout - No main app navigation -->
<script lang="ts">
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import UserMenu from '$lib/components/features/user-menu.svelte';
	import { Toaster } from 'svelte-sonner';
	
	let { children } = $props();

	// Ensure user is authenticated for memeball
	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/login');
		}
	});
</script>

<!-- Full screen dark space theme -->
<div class="memeball-layout">
	<!-- Shared user menu in top right -->
	{#if authStore.isAuthenticated}
		<div class="memeball-overlay">
			<UserMenu />
		</div>
	{/if}

	<!-- Main content area -->
	<main class="memeball-content">
		{@render children?.()}
	</main>
</div>

<!-- Space-themed toaster -->
<Toaster richColors position="top-right" />

<style>
	:global(body) {
		background-color: #030014;
		color: #f8f5ff;
		overflow-x: hidden;
	}

	.memeball-layout {
		min-height: 100vh;
		background: radial-gradient(circle at top, rgba(88, 28, 135, 0.35), transparent 55%),
			linear-gradient(135deg, #040014 0%, #05011f 50%, #080a29 100%);
		position: relative;
		overflow-x: hidden;
	}

	.memeball-overlay {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		z-index: 50;
		pointer-events: auto;
	}

	.memeball-content {
		position: relative;
		z-index: 1;
		min-height: 100vh;
	}

	@media (max-width: 640px) {
		.memeball-overlay {
			top: 1rem;
			right: 1rem;
		}
	}
</style>