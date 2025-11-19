<script lang="ts">
	import UserMenu from '$lib/components/features/user-menu.svelte';
	import { Command } from 'lucide-svelte';

	export let transparent: boolean = false;
	export let absolute: boolean = false;
	export let containerClass: string = 'container mx-auto px-4 py-3';
</script>

<header class={`app-header ${transparent ? 'bg-transparent' : ''} ${absolute ? 'absolute top-0 left-0 right-0 z-50' : ''} ${transparent ? '' : 'border-b'}`}>
	<div class={containerClass + ' flex items-center justify-between'}>
		<a href="/" aria-label="App Selection" class="hover:bg-transparent">
			<Command class="h-6 w-6" />
		</a>
		<UserMenu />
	</div>
</header>

<style>
	/* App header defaults - transparent by prop */
	.app-header {
		background: var(--bg);
	}
	
	/* Keep styling simple; hover state controlled with utility classes */
</style>
