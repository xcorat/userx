<script lang="ts">
	import AppHeader from '$lib/components/layout/AppHeader.svelte';
	import type { NavItem } from './types';
	import AppMenu from '$lib/components/features/app-menu.svelte';
	import { MessageCircle, Users, Search, HelpCircle } from 'lucide-svelte';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { goto } from '$app/navigation';

	// Props
	let {
		showBranding = true
	}: {
		showBranding?: boolean;
	} = $props();

	function goToQuestions() {
		goto('/qna/questions');
	}

	// Define navigation items for the QnA app - reactive to authStore changes
	let navigationItems = $derived([
		{
			id: 'answers',
			label: 'Answers',
			href: '/qna/answers',
			icon: HelpCircle,
			title: 'Answers'
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
			<button 
				onclick={goToQuestions}
				class="p-2 hover:bg-muted rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
				aria-label="Go to questions"
			>
				<HelpCircle class="h-5 w-5 text-orange-500" />
			</button>
			<h1 class="text-2xl font-bold">
				<a href="/qna/questions" class="hidden sm:inline hover:text-primary transition-colors">Orph</a>
			</h1>
		{/if}
	</div>
</AppHeader>

