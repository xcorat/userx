<script lang="ts">
	import type { Snippet } from 'svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Flame, LayoutDashboard } from 'lucide-svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	let decoration = $derived(themeStore.currentTheme.decoration);
	let showMainNav = $derived(
		sessionStore.isLoggedIn && sessionStore.onboardingStep === 'feed'
	);

	let activeNav = $derived<'feed' | 'dashboard'>(
		page.url.pathname.startsWith('/dashboard') || sessionStore.activeTab === 'dashboard'
			? 'dashboard'
			: 'feed'
	);

	function openFeed() {
		sessionStore.setActiveTab('feed');
		if (page.url.pathname !== '/') {
			goto('/');
		}
	}

	function openDashboard() {
		sessionStore.setActiveTab('dashboard');
		if (page.url.pathname !== '/') {
			goto('/dashboard');
		}
	}
</script>

<div
	class="relative flex h-dvh w-full justify-center overflow-hidden bg-background text-foreground transition-colors duration-300"
	style="font-family: var(--font-sans);"
>
	<!-- Theme-specific UI Decorations -->
	{#if decoration === 'grid'}
		<div class="theme-deco-grid pointer-events-none absolute inset-0 opacity-35"></div>
	{:else if decoration === 'aura'}
		<div class="theme-deco-aura pointer-events-none absolute inset-0"></div>
	{:else if decoration === 'editorial'}
		<div class="theme-deco-editorial pointer-events-none absolute inset-0"></div>
	{/if}

	<!-- Mobile-First Fullscreen Column -->
	<div
		class={`relative z-10 flex h-full w-full max-w-[440px] flex-col overflow-hidden ${
			decoration === 'editorial'
				? 'sm:border-x sm:border-border/80'
				: 'sm:border-x sm:border-border/40'
		}`}
	>
		<main class="min-h-0 flex-1 overflow-hidden">
			{@render children()}
		</main>

		{#if showMainNav}
			<nav
				aria-label="Primary navigation"
				class="grid h-14 shrink-0 grid-cols-2 border-t border-border/80 bg-card/90 backdrop-blur-md"
			>
				<button
					type="button"
					onclick={openFeed}
					class={`flex cursor-pointer items-center justify-center gap-2 text-xs font-semibold transition-colors ${
						activeNav === 'feed'
							? 'text-primary'
							: 'text-muted-foreground hover:text-foreground'
					}`}
				>
					<Flame class="h-4 w-4" />
					Feed
				</button>
				<button
					type="button"
					onclick={openDashboard}
					class={`flex cursor-pointer items-center justify-center gap-2 text-xs font-semibold transition-colors ${
						activeNav === 'dashboard'
							? 'text-primary'
							: 'text-muted-foreground hover:text-foreground'
					}`}
				>
					<LayoutDashboard class="h-4 w-4" />
					Dashboard
				</button>
			</nav>
		{/if}
	</div>
</div>
