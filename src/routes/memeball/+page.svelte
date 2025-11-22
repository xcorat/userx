<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.store.svelte';

	onMount(() => {
		// If user not authenticated OR hasn't finished bootstrap, go to transmission
		if (!authStore.isAuthenticated || !authStore.bootstrapSkipped) {
			goto('/memeball/transmission');
			return;
		}
		// Authenticated and bootstrap completed -> main
		goto('/memeball/main');
	});
</script>

<svelte:head>
	<title>Memeball</title>
</svelte:head>

<div class="memeball-shell">
	<div class="nebula" aria-hidden="true"></div>
	<div class="gridlines" aria-hidden="true"></div>

	<div class="content">
		<div class="loading">Initializing Memeball...</div>
	</div>
</div>

<style>
	.memeball-shell {
		min-height: 567px;
		height:100%;
		background: radial-gradient(circle at top, rgba(88, 28, 135, 0.35), transparent 55%),
			linear-gradient(135deg, #040014 0%, #05011f 50%, #080a29 100%);
		color: #f8f5ff;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		overflow: hidden;
	}

	.nebula {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.08), transparent 30%),
			radial-gradient(circle at 80% 10%, rgba(99, 102, 241, 0.15), transparent 35%),
			radial-gradient(circle at 50% 80%, rgba(236, 72, 153, 0.12), transparent 30%);
		filter: blur(40px);
		pointer-events: none;
	}

	.gridlines {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
		background-size: 160px 160px;
		opacity: 0.25;
		mask-image: radial-gradient(circle at center, #000 45%, transparent 70%);
		pointer-events: none;
	}

	.content {
		position: relative;
		width: 100%;
		height: 100%;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.loading {
		font-size: 1.2rem;
		color: rgba(248, 245, 255, 0.6);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 1;
		}
	}
</style>
