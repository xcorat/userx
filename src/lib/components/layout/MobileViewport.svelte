<script lang="ts">
	import type { Snippet } from 'svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import PendingVouchBanner from '$lib/components/onboarding/PendingVouchBanner.svelte';
	import { Flame, LayoutDashboard, Users } from 'lucide-svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	let decoration = $derived(themeStore.currentTheme.decoration);
	let fullBleed = $derived(page.url.pathname === '/' && sessionStore.isHeroOnboarding);
	let showMainNav = $derived(
		sessionStore.isLoggedIn &&
			sessionStore.onboardingStep === 'feed' &&
			!sessionStore.isVouchExpired
	);
	let showPendingBanner = $derived(showMainNav && sessionStore.isPendingVouch);

	let activeNav = $derived<'feed' | 'users' | 'dashboard'>(
		page.url.pathname.startsWith('/dashboard')
			? 'dashboard'
			: page.url.pathname.startsWith('/users')
				? 'users'
				: sessionStore.activeTab
	);

	function openFeed() {
		sessionStore.setActiveTab('feed');
		if (page.url.pathname !== '/') {
			goto('/');
		}
	}

	function openUsers() {
		sessionStore.setActiveTab('users');
		if (page.url.pathname !== '/users') {
			goto('/users');
		}
	}

	function openDashboard() {
		sessionStore.setActiveTab('dashboard');
		if (page.url.pathname !== '/dashboard') {
			goto('/dashboard');
		}
	}
</script>

<div
	class="relative flex h-dvh w-full justify-center overflow-hidden bg-background text-foreground transition-colors duration-300"
	style="font-family: var(--font-body);"
>
	<!-- Theme-specific UI Decorations -->
	{#if decoration === 'grid'}
		<div class="theme-deco-grid pointer-events-none absolute inset-0 opacity-35"></div>
	{:else if decoration === 'aura'}
		<div class="theme-deco-aura pointer-events-none absolute inset-0"></div>
	{:else if decoration === 'editorial'}
		<div class="theme-deco-editorial pointer-events-none absolute inset-0"></div>
	{/if}

	<!-- Mobile-First Fullscreen Column (Full-bleed during hero intro) -->
	<div
		class={`relative z-10 flex h-full w-full flex-col overflow-hidden ${
			fullBleed
				? ''
				: `max-w-5xl ${
						decoration === 'editorial'
							? 'sm:border-x sm:border-border/80'
							: 'sm:border-x sm:border-border/40'
					}`
		}`}
	>
		{#if showPendingBanner}
			<PendingVouchBanner />
		{/if}

		<main class="min-h-0 flex-1 overflow-hidden">
			{@render children()}
		</main>

		{#if showMainNav}
			<nav
				aria-label="Primary navigation"
				class="grid h-16 shrink-0 grid-cols-3 border-t border-border/80 bg-card/90 backdrop-blur-md"
			>
				<button
					type="button"
					onclick={openFeed}
					class={`flex cursor-pointer items-center justify-center gap-2 text-sm font-semibold transition-colors ${
						activeNav === 'feed'
							? 'text-primary'
							: 'text-muted-foreground hover:text-foreground'
					}`}
				>
					<Flame class="h-5 w-5" />
					Feed
				</button>
				<button
					type="button"
					onclick={openUsers}
					class={`flex cursor-pointer items-center justify-center gap-2 text-sm font-semibold transition-colors ${
						activeNav === 'users'
							? 'text-primary'
							: 'text-muted-foreground hover:text-foreground'
					}`}
				>
					<Users class="h-5 w-5" />
					Users
				</button>
				<button
					type="button"
					onclick={openDashboard}
					class={`flex cursor-pointer items-center justify-center gap-2 text-sm font-semibold transition-colors ${
						activeNav === 'dashboard'
							? 'text-primary'
							: 'text-muted-foreground hover:text-foreground'
					}`}
				>
					<LayoutDashboard class="h-5 w-5" />
					Dashboard
				</button>
			</nav>
		{/if}
	</div>
</div>
