<script lang="ts">
	import UserMenu from '$lib/components/features/user-menu.svelte';
	import AppMenu from '$lib/components/features/app-menu.svelte';
	import { Command, Menu } from 'lucide-svelte';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import type { NavItem } from './types';

	// Component props using runes
	let {
		variant = 'default',
		transparent = false,
		absolute = false,
		containerClass = 'container mx-auto px-4 py-3',
		showNavigation = false,
		navigationItems = [],
		showAppMenu = true,
		showUserMenu = true,
		children
	}: {
		variant?: 'default' | 'transparent' | 'sticky' | 'fixed';
		transparent?: boolean;
		absolute?: boolean;
		containerClass?: string;
		showNavigation?: boolean;
		navigationItems?: NavItem[];
		showAppMenu?: boolean;
		showUserMenu?: boolean;
		children?: any;
	} = $props();

	// Handle backward compatibility: transparent prop overrides variant
	let effectiveVariant = $derived(transparent ? 'transparent' : variant);
	
	// Build header classes based on variant
	let headerClasses = $derived([
		'app-header',
		effectiveVariant === 'transparent' ? 'bg-transparent' : '',
		effectiveVariant === 'sticky' ? 'sticky top-0 z-40' : '',
		effectiveVariant === 'fixed' ? 'fixed top-0 left-0 right-0 z-40' : '',
		absolute ? 'absolute top-0 left-0 right-0 z-50' : '',
		effectiveVariant !== 'transparent' ? 'border-b' : ''
	].filter(Boolean).join(' '));

	// Mobile menu state
	let isMobileMenuOpen = $state(false);
</script>

<header class={headerClasses}>
	<div class={containerClass + ' flex items-center justify-between'}>
		<!-- Left section: App Menu -->
		<div class="flex items-center gap-2">
			{#if showAppMenu}
				<AppMenu>
					<Command slot="trigger" class="h-6 w-6" />
				</AppMenu>
			{/if}
			<slot name="left" />
		</div>

		<!-- Center section: Navigation or custom content -->
		{#if showNavigation && navigationItems.length > 0}
			<!-- Desktop Navigation -->
			<nav class="hidden md:flex items-center gap-4 flex-1 justify-center" aria-label="Main navigation">
				{#each navigationItems as item}
					<a 
						href={item.href} 
						class="nav-link flex items-center gap-2" 
						title={item.title || item.label}
						aria-label={item.title || item.label}
					>
						{#if item.icon}
							<svelte:component this={item.icon} class="h-5 w-5" />
						{/if}
						<span>{item.label}</span>
					</a>
				{/each}
			</nav>
		{:else}
			<div class="flex-1 flex items-center justify-center">
				<slot name="center" />
			</div>
		{/if}

		<!-- Right section: Mobile menu + User Menu -->
		<div class="flex items-center gap-2">
			<!-- Mobile Navigation Menu -->
			{#if showNavigation && navigationItems.length > 0}
				<div class="md:hidden">
					<DropdownMenu bind:open={isMobileMenuOpen}>
						<DropdownMenuTrigger 
							class="p-2 hover:bg-muted rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
							aria-label="Open navigation menu"
						>
							<Menu class="h-6 w-6" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{#each navigationItems as item}
								<DropdownMenuItem>
									<a href={item.href} class="flex items-center gap-2 w-full">
										{#if item.icon}
											<svelte:component this={item.icon} class="h-4 w-4" />
										{/if}
										<span>{item.label}</span>
									</a>
								</DropdownMenuItem>
							{/each}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			{/if}

			<slot name="right" />
			
			{#if showUserMenu}
				<UserMenu />
			{/if}
		</div>
	</div>
</header>

<style>
	/* App header defaults - theme-aware using CSS variables */
	.app-header {
		background: var(--background);
		color: var(--foreground);
		transition: background-color 0.2s ease, border-color 0.2s ease;
	}

	.app-header.bg-transparent {
		background: transparent;
	}

	.app-header.border-b {
		border-bottom: 1px solid var(--border);
	}

	/* Navigation links - theme-aware */
	.nav-link {
		color: var(--foreground);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.nav-link:hover {
		color: var(--primary);
	}

	.nav-link:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
		border-radius: 0.25rem;
	}

	/* Ensure sticky/fixed headers have proper backdrop */
	.app-header.sticky,
	.app-header.fixed {
		backdrop-filter: blur(8px);
		background: var(--background);
	}

	.app-header.sticky.bg-transparent,
	.app-header.fixed.bg-transparent {
		background: rgba(var(--background-rgb), 0.8);
	}
</style>
