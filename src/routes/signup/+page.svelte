<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirect to onboarding wizard
		goto('/onboard');
	});
</script>

<div class="flex items-center justify-center min-h-[80vh]">
	<p class="text-muted-foreground">Redirecting to onboarding...</p>
</div>
