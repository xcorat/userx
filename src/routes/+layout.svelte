<script lang="ts">
	import '../app.css';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import UserMenu from '$lib/components/features/user-menu.svelte';
	import { Toaster } from 'svelte-sonner';
	import { MessageCircle, Users, Search, Settings, HelpCircle, Flame, Menu } from 'lucide-svelte';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	
	let { children } = $props();
	let isMenuOpen = $state(false);
</script>

<div class="min-h-screen bg-background">
	{#if authStore.isAuthenticated}
		<header class="border-b">
			<div class="container mx-auto px-4 py-4 flex items-center justify-between">
				<h1 class="text-2xl font-bold flex items-center gap-2">
					<Flame class="h-6 w-6 text-orange-500" />
					<a href="/" class="hidden sm:inline">QnA App</a>
				</h1>
				
				<!-- Desktop Navigation -->
				<nav class="hidden md:flex items-center gap-4">
					<a href="/" class="hover:text-primary flex items-center gap-2" title="Questions">
						<HelpCircle class="h-5 w-5" />
						<span>Questions</span>
					</a>
					<a href="/search" class="hover:text-primary flex items-center gap-2" title="Search">
						<Search class="h-5 w-5" />
						<span>Search</span>
					</a>
					<a href="/friends" class="hover:text-primary flex items-center gap-2" title="Friends">
						<Users class="h-5 w-5" />
						<span>Friends</span>
					</a>
					<a href="/dm" class="hover:text-primary flex items-center gap-2" title="Messages">
						<MessageCircle class="h-5 w-5" />
						<span>DMs</span>
					</a>
					<a href="/tests" class="hover:text-primary flex items-center gap-2" title="Settings">
						<Settings class="h-5 w-5" />
						<span>Test</span>
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
								<a href="/" class="flex items-center gap-2 w-full">
									<HelpCircle class="h-4 w-4" />
									<span>Questions</span>
								</a>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<a href="/search" class="flex items-center gap-2 w-full">
									<Search class="h-4 w-4" />
									<span>Search</span>
								</a>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<a href="/friends" class="flex items-center gap-2 w-full">
									<Users class="h-4 w-4" />
									<span>Friends</span>
								</a>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<a href="/dm" class="flex items-center gap-2 w-full">
									<MessageCircle class="h-4 w-4" />
									<span>DMs</span>
								</a>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<a href="/tests" class="flex items-center gap-2 w-full">
									<Settings class="h-4 w-4" />
									<span>Test</span>
								</a>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<UserMenu />
				</div>
			</div>
		</header>
	{/if}

	<main class="container mx-auto px-4 py-8">
		{@render children?.()}
	</main>
</div>

<Toaster richColors position="bottom-right" closeButton />