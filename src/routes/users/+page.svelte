<script lang="ts">
	import { goto } from '$app/navigation';
	import { sessionStore } from '$lib/stores/session.svelte';
	import UsersDirectory from '$lib/components/users/UsersDirectory.svelte';
	import { RefreshCw } from 'lucide-svelte';

	$effect(() => {
		if (!sessionStore.isInitialized) return;
		if (!sessionStore.isLoggedIn || sessionStore.isVouchExpired) {
			goto('/');
			return;
		}
		sessionStore.setActiveTab('users');
	});
</script>

{#if !sessionStore.isInitialized}
	<div class="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
		<RefreshCw class="h-6 w-6 animate-spin text-primary" />
		<p class="font-mono text-xs text-muted-foreground">Restoring encrypted session…</p>
	</div>
{:else if sessionStore.isLoggedIn && !sessionStore.isVouchExpired}
	<UsersDirectory />
{/if}
