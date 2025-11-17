<script lang="ts">
	import UserMenu from '$lib/components/features/user-menu.svelte';
</script>

<header class="memeball-header">
	<UserMenu />
</header>

<style>
	.memeball-header {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 40;
		background: transparent;
		padding: 1rem 1.5rem;
	}
</style>
