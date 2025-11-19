<script lang="ts">
	import '../../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { applyTheme, resetTheme } from '$lib/utils/theme';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import UserMenu from '$lib/components/features/user-menu.svelte';
	import AppMenu from '$lib/components/features/app-menu.svelte';
	import { Toaster } from 'svelte-sonner';
	import { MessageCircle, Users, Search, HelpCircle, Menu } from 'lucide-svelte';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	
	let { children } = $props();
	let isMenuOpen = $state(false);

	onMount(() => {
		applyTheme('qna');
	});

	onDestroy(() => {
		resetTheme();
	});
</script>

<div class="min-h-screen bg-background">
	{#if authStore.isAuthenticated}
		<header class="border-b">
			<div class="container mx-auto px-4 py-4 flex items-center justify-between">
				<h1 class="text-2xl font-bold flex items-center gap-2">
					<div class="mr-2">
						<AppMenu showApps={false}>
							<HelpCircle slot="trigger" class="h-5 w-5 text-orange-500" />
						</AppMenu>
					</div>
					<a href="/qna/questions" class="hidden sm:inline">Orph</a>
				</h1>
				
				<!-- Desktop Navigation -->
				<nav class="hidden md:flex items-center gap-4">
					<a href="/qna/questions" class="hover:text-primary flex items-center gap-2" title="Questions">
						<HelpCircle class="h-5 w-5" />
						<span>Questions</span>
					</a>
					<a href="/qna/search" class="hover:text-primary flex items-center gap-2" title="Search">
						<Search class="h-5 w-5" />
						<span>Search</span>
					</a>
				<a href={authStore.currentUser?.username ? `/${authStore.currentUser.username}/friends` : '/friends'} class="hover:text-primary flex items-center gap-2" title="Friends">
					<Users class="h-5 w-5" />
					<span>Friends</span>
				</a>
				<a href={authStore.currentUser?.username ? `/${authStore.currentUser.username}/dm` : '/dm'} class="hover:text-primary flex items-center gap-2" title="Messages">
					<MessageCircle class="h-5 w-5" />
					<span>DMs</span>
				</a>
                    
					<UserMenu />
				</nav>
				
				<!-- Mobile Navigation -->
				<div class="md:hidden flex items-center gap-2">
					<DropdownMenu bind:open={isMenuOpen}>
						<DropdownMenuTrigger class="p-2 hover:bg-muted rounded-md">
							<Menu class="h-6 w-6" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem>
								<a href="/qna/questions" class="flex items-center gap-2 w-full">
									<HelpCircle class="h-4 w-4" />
									<span>Questions</span>
								</a>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<a href="/qna/search" class="flex items-center gap-2 w-full">
									<Search class="h-4 w-4" />
									<span>Search</span>
								</a>
							</DropdownMenuItem>
						<DropdownMenuItem>
							<a href={authStore.currentUser?.username ? `/${authStore.currentUser.username}/friends` : '/friends'} class="flex items-center gap-2 w-full">
								<Users class="h-4 w-4" />
								<span>Friends</span>
							</a>
							</DropdownMenuItem>
						<DropdownMenuItem>
							<a href={authStore.currentUser?.username ? `/${authStore.currentUser.username}/dm` : '/dm'} class="flex items-center gap-2 w-full">
								<MessageCircle class="h-4 w-4" />
								<span>DMs</span>
							</a>
							</DropdownMenuItem>
                            
						</DropdownMenuContent>
					</DropdownMenu>
					<UserMenu />
				</div>
			</div>
		</header>
	{/if}

	<main class="container mx-auto px-4 py-8 max-w-[950px]">
		{@render children?.()}
	</main>
</div>

<Toaster richColors position="bottom-right" closeButton />