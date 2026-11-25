<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { sessionStore } from '$lib/stores/session.svelte';
	import UserDashboard from '$lib/components/dashboard/UserDashboard.svelte';

	onMount(() => {
		if (!sessionStore.isLoggedIn || sessionStore.isVouchExpired) {
			goto('/');
			return;
		}
		sessionStore.setActiveTab('dashboard');
	});
</script>

{#if sessionStore.isLoggedIn && !sessionStore.isVouchExpired}
	<UserDashboard />
{/if}
