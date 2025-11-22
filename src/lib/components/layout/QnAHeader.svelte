<script lang="ts">
	import AppHeader from '$lib/components/layout/AppHeader.svelte';
	import type { NavItem } from './types';
	import AppMenu from '$lib/components/features/app-menu.svelte';
	import { MessageCircle, Users, Search, HelpCircle } from 'lucide-svelte';
	import { authStore } from '$lib/stores/auth.store.svelte';

	// Props
	let {
		showBranding = true
	}: {
		showBranding?: boolean;
	} = $props();

	// Define navigation items for the QnA app - reactive to authStore changes
	let navigationItems = $derived([
		{
			id: 'questions',
			label: 'Questions',
			href: '/qna/questions',
			icon: HelpCircle,
			title: 'Questions'
		},
		{
			id: 'search',
			label: 'Search',
			href: '/qna/search',
			icon: Search,
			title: 'Search'
		},
		{
			id: 'friends',
			label: 'Friends',
			href: authStore.currentUser?.username ? `/${authStore.currentUser.username}/friends` : '/friends',
			icon: Users,
			title: 'Friends'
		},
		{
			id: 'messages',
			label: 'DMs',
			href: authStore.currentUser?.username ? `/${authStore.currentUser.username}/dm` : '/dm',
			icon: MessageCircle,
			title: 'Messages'
		}
	] as NavItem[]);
</script>

<AppHeader 
	showNavigation={true}
	navigationItems={navigationItems}
	containerClass="container mx-auto px-4 py-4"
	showAppMenu={false}
>
	<!-- Custom left slot for QnA branding -->
	<div slot="left" class="flex items-center gap-2">
		{#if showBranding}
			<AppMenu showApps={false}>
				<HelpCircle slot="trigger" class="h-5 w-5 text-orange-500" />
			</AppMenu>
			<h1 class="text-2xl font-bold">
				<a href="/qna/questions" class="hidden sm:inline">Orph</a>
			</h1>
		{/if}
	</div>
</AppHeader>

