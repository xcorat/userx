// Auth Store using Svelte 5 runes
import { browser } from '$app/environment';
import type { User } from '$lib/models';
import DIContainer from '$lib/config/di-container';
import { appConfig } from '$lib/config/app.config';
import { generateEd25519KeyPair, signChallenge } from '$lib/utils/keypair';
import { encryptPrivateKey, decryptPrivateKey } from '$lib/utils/encryption';

class AuthStore {
	currentUser = $state<User | null>(null);
	isLoading = $state(false);
	error = $state<string | null>(null);
	private encryptedPrivateKey: string | null = null;
	private password: string | null = null; // Stored in memory only

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
				// Restore Date objects and ensure id field is set
				this.currentUser = {
					id: parsed.id || parsed.publicKey,
					...parsed,
					createdAt: new Date(parsed.createdAt)
				};
				console.log('Loaded session for user:', this.currentUser);
			} catch (e) {
				console.error('Failed to load session', e);
				this.clearSession();
			}
		}
	}

	private saveSession(user: User) {
		console.log('Saving session for user:', user);
		localStorage.setItem(appConfig.auth.sessionStorageKey, JSON.stringify(user));
	}

	private clearSession() {
		localStorage.removeItem(appConfig.auth.sessionStorageKey);
		sessionStorage.removeItem('encryptedPrivateKey');
		this.encryptedPrivateKey = null;
		this.password = null;
	}

	/**
	 * Challenge-based login flow
	 */
	async login(username: string, password: string) {
		this.isLoading = true;
		this.error = null;

		try {
			// Step 1: Get encrypted private key and challenge
			const step1Response = await fetch('/api/auth/login-step1', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username })
			});

			if (!step1Response.ok) {
				const error = await step1Response.json();
				throw new Error(error.error || 'Login failed');
			}

			const { publicKey, encryptedPrivateKey, challenge } = await step1Response.json();

			// Step 2: Decrypt private key with password
			let privateKey: string;
			try {
				privateKey = await decryptPrivateKey(encryptedPrivateKey, password);
			} catch (e) {
				throw new Error('Invalid password or corrupted key');
			}

			// Step 3: Sign challenge with private key
			const signature = await signChallenge(challenge, privateKey);

			// Step 4: Verify signature and authenticate
			const step2Response = await fetch('/api/auth/login-step2', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ publicKey, challenge, signature })
			});

			if (!step2Response.ok) {
				const error = await step2Response.json();
				throw new Error(error.error || 'Authentication failed');
			}

			const userData = await step2Response.json() as any;
			
			// Restore Date objects and ensure id field is set
			const user: User = {
				id: userData.id || userData.publicKey,
				...userData,
				createdAt: new Date(userData.createdAt)
			};
			
			this.currentUser = user;
			this.saveSession(user);

			// Store encrypted key and password for on-demand decryption
			this.encryptedPrivateKey = encryptedPrivateKey;
			this.password = password;
			sessionStorage.setItem('encryptedPrivateKey', encryptedPrivateKey);
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Login failed';
			throw e;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Signup with client-side keypair generation
	 */
	async signup(data: { email: string; password: string; name?: string; username?: string; birthdate?: string; location?: string; timezone?: string }) {
		this.isLoading = true;
		this.error = null;

		try {
			// Generate Ed25519 keypair client-side
			const { publicKey, privateKey } = await generateEd25519KeyPair();

			// Encrypt private key with user's password
			const encryptedPrivateKey = await encryptPrivateKey(privateKey, data.password);

			// Create user with encrypted keypair
			const authService = DIContainer.getAuthService();
			const user = await authService.signup({
				publicKey,
				encryptedPrivateKey,
				email: data.email,
				password: data.password, // Used for encryption, not stored on server
				name: data.name || data.email.split('@')[0],
				username: data.username,
				birthdate: data.birthdate,
				location: data.location,
				timezone: data.timezone
			});

			this.currentUser = user;
			this.saveSession(user);

			// Store encrypted key and password for session
			this.encryptedPrivateKey = encryptedPrivateKey;
			this.password = data.password;
			sessionStorage.setItem('encryptedPrivateKey', encryptedPrivateKey);
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Signup failed';
			throw e;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Decrypt private key on demand (for signing operations)
	 */
	async decryptPrivateKeyOnDemand(password?: string): Promise<string> {
		const pwd = password || this.password;
		const encKey = this.encryptedPrivateKey || sessionStorage.getItem('encryptedPrivateKey');

		if (!pwd || !encKey) {
			throw new Error('No encrypted key or password available');
		}

		return await decryptPrivateKey(encKey, pwd);
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
