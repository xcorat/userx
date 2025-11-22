// Meme Store using Svelte 5 runes for Memeball feature
import type { 
	MemeWithStats, 
	CreateMemeDTO, 
	UserMemeStats,
	Meme 
} from '$lib/models/meme.model';
import { MemeInteractionType, MemeSubmissionStatus } from '$lib/models/meme.model';
import DIContainer from '$lib/config/di-container';
import { authStore } from './auth.store.svelte';

class MemeStore {
	// Current available memes for user to vote on
	availableMemes = $state<MemeWithStats[]>([]);
	currentMemeIndex = $state(0);
	
	// Loading states
	isLoading = $state(false);
	isSubmitting = $state(false);
	isInteracting = $state(false);
	
	// Error states
	error = $state<string | null>(null);
	submissionError = $state<string | null>(null);
	
	// User stats
	userStats = $state<UserMemeStats | null>(null);
	
	// Submission state
	lastSubmissionStatus = $state<MemeSubmissionStatus | null>(null);
	
	// Current meme being viewed
	currentMeme = $derived(this.availableMemes[this.currentMemeIndex] || null);
	
	// Whether user has more memes to view
	hasMoreMemes = $derived(this.currentMemeIndex < this.availableMemes.length - 1);
	
	// Token availability
	canSubmitToday = $state(true);
	tokensRemaining = $state(1);

	/**
	 * Load available memes for current user
	 */
	async loadAvailableMemes(limit = 10) {
		if (!authStore.currentUser) {
			this.error = 'Must be logged in to view memes';
			return;
		}

		this.isLoading = true;
		this.error = null;

		try {
			const memeService = DIContainer.getMemeService();
			this.availableMemes = await memeService.getAvailableMemesForUser(
				authStore.currentUser.id, 
				limit
			);
			this.currentMemeIndex = 0;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load memes';
			throw e;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Submit a new meme
	 */
	async submitMeme(data: Omit<CreateMemeDTO, 'submittedBy'>) {
		if (!authStore.currentUser) {
			this.submissionError = 'Must be logged in to submit memes';
			return;
		}
		this.isSubmitting = true;
		this.submissionError = null;

		try {
			const memeService = DIContainer.getMemeService();
			const result = await memeService.submitMeme({
				...data,
				submittedBy: authStore.currentUser.id
			});
			this.lastSubmissionStatus = result.status;

			// If successful, update token status
			if (result.status === 'success') {
				await this.updateTokenStatus();
			}
			return result;
		} catch (e) {
			this.submissionError = e instanceof Error ? e.message : 'Failed to submit meme';
			throw e;
		} finally {
			this.isSubmitting = false;
		}
	}

	/**
	 * Interact with current meme (pick/reject)
	 */
	async interactWithCurrentMeme(interactionType: MemeInteractionType) {
		if (!authStore.currentUser || !this.currentMeme) {
			return;
		}

		this.isInteracting = true;
		this.error = null;

		try {
			const memeService = DIContainer.getMemeService();
			await memeService.interactWithMeme(
				authStore.currentUser.id,
				this.currentMeme.id,
				interactionType
			);

			// Remove current meme from available list and advance
			this.availableMemes = this.availableMemes.filter(
				(_, index) => index !== this.currentMemeIndex
			);

			// Adjust index if we're at the end
			if (this.currentMemeIndex >= this.availableMemes.length && this.availableMemes.length > 0) {
				this.currentMemeIndex = this.availableMemes.length - 1;
			}

			// Update user stats
			await this.loadUserStats();

		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to interact with meme';
			throw e;
		} finally {
			this.isInteracting = false;
		}
	}

	/**
	 * Pick current meme (swipe right)
	 */
	async pickCurrentMeme() {
		await this.interactWithCurrentMeme(MemeInteractionType.PICK);
	}

	/**
	 * Reject current meme (swipe left)
	 */
	async rejectCurrentMeme() {
		await this.interactWithCurrentMeme(MemeInteractionType.REJECT);
	}

	/**
	 * Pick a specific meme by ID
	 */
	async pickMeme(memeId: string) {
		if (!authStore.currentUser) return;

		this.isInteracting = true;
		this.error = null;

		try {
			const memeService = DIContainer.getMemeService();
			await memeService.interactWithMeme(
				authStore.currentUser.id,
				memeId,
				MemeInteractionType.PICK
			);

			// Remove meme from available list
			this.availableMemes = this.availableMemes.filter(m => m.id !== memeId);

			// Update user stats
			await this.loadUserStats();
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to pick meme';
			throw e;
		} finally {
			this.isInteracting = false;
		}
	}

	/**
	 * Reject a specific meme by ID
	 */
	async rejectMeme(memeId: string) {
		if (!authStore.currentUser) return;

		this.isInteracting = true;
		this.error = null;

		try {
			const memeService = DIContainer.getMemeService();
			await memeService.interactWithMeme(
				authStore.currentUser.id,
				memeId,
				MemeInteractionType.REJECT
			);

			// Remove meme from available list
			this.availableMemes = this.availableMemes.filter(m => m.id !== memeId);

			// Update user stats
			await this.loadUserStats();
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to reject meme';
			throw e;
		} finally {
			this.isInteracting = false;
		}
	}

	/**
	 * Navigate to next meme without interacting
	 */
	goToNextMeme() {
		if (this.currentMemeIndex < this.availableMemes.length - 1) {
			this.currentMemeIndex++;
		}
	}

	/**
	 * Navigate to previous meme
	 */
	goToPreviousMeme() {
		if (this.currentMemeIndex > 0) {
			this.currentMemeIndex--;
		}
	}

	/**
	 * Load user's meme statistics
	 */
	async loadUserStats() {
		if (!authStore.currentUser) {
			return;
		}

		try {
			const memeService = DIContainer.getMemeService();
			this.userStats = await memeService.getUserMemeStats(authStore.currentUser.id);
		} catch (e) {
			// Don't throw for stats loading errors
			console.error('Failed to load user meme stats:', e);
		}
	}

	/**
	 * Update daily token status
	 */
	async updateTokenStatus() {
		if (!authStore.currentUser) {
			return;
		}

		try {
			const memeService = DIContainer.getMemeService();
			const tokenStatus = await memeService.canUserSubmitToday(authStore.currentUser.id);
			this.canSubmitToday = tokenStatus.canSubmit;
			this.tokensRemaining = tokenStatus.tokensRemaining;
		} catch (e) {
			console.error('Failed to update token status:', e);
		}
	}

	/**
	 * Get user's submitted memes
	 */
	async getUserSubmissions(): Promise<Meme[]> {
		if (!authStore.currentUser) {
			return [];
		}

		try {
			const memeService = DIContainer.getMemeService();
			return await memeService.getUserSubmittedMemes(authStore.currentUser.id);
		} catch (e) {
			console.error('Failed to load user submissions:', e);
			return [];
		}
	}

	/**
	 * Clear all user swipe interactions
	 */
	async clearSwipes() {
		if (!authStore.currentUser) {
			this.error = 'Must be logged in to clear swipes';
			return;
		}

		this.isLoading = true;
		this.error = null;

		try {
			const memeService = DIContainer.getMemeService();
			await memeService.clearUserInteractions(authStore.currentUser.id);

			// Reload memes and stats after clearing
			await Promise.all([
				this.loadAvailableMemes(),
				this.loadUserStats()
			]);
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to clear swipes';
			throw e;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Initialize store (load initial data)
	 */
	async initialize() {
		if (!authStore.currentUser) {
			return;
		}

		await Promise.all([
			this.loadAvailableMemes(),
			this.loadUserStats(),
			this.updateTokenStatus()
		]);
	}

	/**
	 * Reset store state
	 */
	reset() {
		this.availableMemes = [];
		this.currentMemeIndex = 0;
		this.isLoading = false;
		this.isSubmitting = false;
		this.isInteracting = false;
		this.error = null;
		this.submissionError = null;
		this.userStats = null;
		this.lastSubmissionStatus = null;
		this.canSubmitToday = true;
		this.tokensRemaining = 1;
	}
}

export const memeStore = new MemeStore();