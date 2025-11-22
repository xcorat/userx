<script lang="ts">
	import UserMenu from '$lib/components/features/user-menu.svelte';
	import AppMenu from '$lib/components/features/app-menu.svelte';
	import { Command } from 'lucide-svelte';

	export let transparent: boolean = false;
	export let absolute: boolean = false;
	export let containerClass: string = 'container mx-auto px-4 py-3';
</script>

<header class={`app-header ${transparent ? 'bg-transparent' : ''} ${absolute ? 'absolute top-0 left-0 right-0 z-50' : ''} ${transparent ? '' : 'border-b'}`}>
	<div class={containerClass + ' flex items-center'}>
		<div class="flex items-center mr-4">
			<AppMenu>
				<Command slot="trigger" class="h-6 w-6" />
			</AppMenu>
		</div>

		<div class="flex-1 flex items-center justify-center">
			<slot name="center" />
		</div>

		<div class="flex items-center ml-4">
			<UserMenu />
		</div>
	</div>
</header>

<style>
	/* App header defaults - transparent by prop */
	.app-header {
		background: var(--bg);
		color: var(--foreground);
	}
	
	/* Keep styling simple; hover state controlled with utility classes */
</style>
