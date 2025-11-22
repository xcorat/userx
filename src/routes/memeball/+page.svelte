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
		min-height: var(--memeball-min-height);
		height: 100%;
		background: var(--memeball-gradient-background);
		color: var(--memeball-foreground);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		overflow: hidden;
	}

	.nebula {
		position: absolute;
		inset: 0;
		background: var(--memeball-gradient-nebula);
		filter: blur(var(--memeball-blur-xl));
		pointer-events: none;
	}

	.gridlines {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(
				var(--memeball-gridline-color-primary) 1px,
				transparent 1px
			),
			linear-gradient(
				90deg,
				var(--memeball-gridline-color-secondary) 1px,
				transparent 1px
			);
		background-size: var(--memeball-gridline-size) var(--memeball-gridline-size);
		opacity: var(--memeball-gridline-opacity);
		mask-image: var(--memeball-gridline-mask);
		pointer-events: none;
	}

	.content {
		position: relative;
		width: 100%;
		height: 100%;
		z-index: var(--memeball-z-base);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.loading {
		font-size: var(--memeball-text-xl);
		color: var(--memeball-muted-foreground);
		letter-spacing: var(--memeball-tracking-wider);
		text-transform: uppercase;
		animation: memeball-pulse 2s ease-in-out infinite;
	}
</style>
