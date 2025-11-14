// Auth Store using Svelte 5 runes
import { browser } from '$app/environment';
import type { User } from '$lib/models';
import DIContainer from '$lib/config/di-container';
import { appConfig } from '$lib/config/app.config';

class AuthStore {
	currentUser = $state<User | null>(null);
	isLoading = $state(false);
	error = $state<string | null>(null);

	constructor() {
		if (browser) {
			this.loadSession();
		}
	}

	private loadSession() {
		const stored = localStorage.getItem(appConfig.auth.sessionStorageKey);
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				// Restore Date objects
				this.currentUser = {
					...parsed,
					createdAt: new Date(parsed.createdAt)
				};
			} catch (e) {
				console.error('Failed to load session', e);
				this.clearSession();
			}
		}
	}

	private saveSession(user: User) {
		localStorage.setItem(appConfig.auth.sessionStorageKey, JSON.stringify(user));
	}

	private clearSession() {
		localStorage.removeItem(appConfig.auth.sessionStorageKey);
	}

	async login(email: string, password: string) {
		this.isLoading = true;
		this.error = null;

		try {
			const authService = DIContainer.getAuthService();
			const user = await authService.login(email, password);
			this.currentUser = user;
			this.saveSession(user);
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Login failed';
			throw e;
		} finally {
			this.isLoading = false;
		}
	}

	async signup(data: { email: string; password: string; name?: string; username?: string; birthdate?: string; location?: string; timezone?: string }) {
		this.isLoading = true;
		this.error = null;

		try {
			const authService = DIContainer.getAuthService();
			const user = await authService.signup({
				email: data.email,
				password: data.password,
				name: data.name || data.email.split('@')[0],
				username: data.username,
				birthdate: data.birthdate,
				location: data.location,
				timezone: data.timezone
			});
			this.currentUser = user;
			this.saveSession(user);
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Signup failed';
			throw e;
		} finally {
			this.isLoading = false;
		}
	}

	logout() {
		this.currentUser = null;
		this.clearSession();
	}

	get isAuthenticated() {
		return this.currentUser !== null;
	}
}

export const authStore = new AuthStore();
