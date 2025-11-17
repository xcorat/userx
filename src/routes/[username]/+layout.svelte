<script lang="ts">
	import '../../app.css';
	import UserSectionHeader from '$lib/components/layout/UserSectionHeader.svelte';
	import { Toaster } from 'svelte-sonner';
	
	let { children } = $props();
</script>

<UserSectionHeader>
	{@render children?.()}
</UserSectionHeader>

<Toaster richColors position="bottom-right" closeButton />