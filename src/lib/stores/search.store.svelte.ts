// Search Store using Svelte 5 runes
import type { User } from '$lib/models';
import DIContainer from '$lib/config/di-container';
import { authStore } from './auth.store.svelte';

class SearchStore {
	searchQuery = $state('');
	searchResults = $state<User[]>([]);
	isLoading = $state(false);
	activeTab = $state<'users' | 'questions'>('users');
	error = $state<string | null>(null);
	hasSearched = $state(false);

	async searchUsers(query: string) {
		if (!query.trim()) {
			this.searchResults = [];
			this.error = null;
			return;
		}

		this.isLoading = true;
		this.error = null;

		try {
			const userService = DIContainer.getUserService();
			let results = await userService.searchUsers(query);
			// Filter out the current logged-in user
			if (authStore.currentUser) {
				results = results.filter((user) => user.id !== authStore.currentUser?.id);
			}
			this.searchResults = results;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to search users';
			this.searchResults = [];
		} finally {
			this.isLoading = false;
		}
	}

	setQuery(query: string) {
		this.searchQuery = query;
	}

	setActiveTab(tab: 'users' | 'questions') {
		this.activeTab = tab;
		// Clear results when switching tabs
		if (tab === 'questions') {
			this.searchResults = [];
		}
	}

	async executeSearch() {
		if (this.activeTab === 'users') {
			await this.searchUsers(this.searchQuery);
			this.hasSearched = true;
		}
		// Questions search would be implemented here later
	}

	reset() {
		this.searchQuery = '';
		this.searchResults = [];
		this.isLoading = false;
		this.error = null;
		this.hasSearched = false;
		this.activeTab = 'users';
	}
}

export const searchStore = new SearchStore();