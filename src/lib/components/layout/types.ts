// Types for layout components
import type { ComponentType } from 'svelte';

/**
 * Navigation item for header navigation
 */
export type NavItem = {
	id: string;
	label: string;
	href: string;
	icon?: ComponentType;
	title?: string;
};

