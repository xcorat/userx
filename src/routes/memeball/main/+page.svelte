<!-- Main Meme Viewer Page - Full screen swipeable meme interface -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import SwipeCardStack from '$lib/components/ui/SwipeCardStack.svelte';
	import { memeStore } from '$lib/stores/meme.store.svelte';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus, RefreshCw, Heart, X } from 'lucide-svelte';
	import RightToolbar from '$lib/components/features/right-toolbar/RightToolbar.svelte';
	import { toast } from 'svelte-sonner';
	import type { MemeWithStats } from '$lib/models/meme.model';

	let isInitialized = $state(false);
	let swipeCardStack = $state<any>(null);

	onMount(async () => {
		// Ensure user is authenticated
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		try {
			await memeStore.initialize();
			isInitialized = true;

			// Show welcome message on first load
			if (memeStore.availableMemes.length > 0) {
				toast.success('Welcome to Memeball! Swipe or use buttons to interact with memes.');
			}
		} catch (error) {
			console.error('Failed to initialize meme store:', error);
			toast.error('Failed to load memes. Please try again.');
		}
	});

	// Handle swipe interactions
	async function handleSwipeLeft(meme: any, index: number) {
		if (memeStore.isInteracting) return;

		try {
			await memeStore.rejectMeme(meme.id);
			toast.info('Meme rejected');
			
			// Check if we need to load more memes
			if (memeStore.availableMemes.length < 5) {
				loadMoreMemes();
			}
		} catch (error) {
			console.error('Failed to reject meme:', error);
			toast.error('Failed to reject meme. Please try again.');
		}
	}

	async function handleSwipeRight(meme: any, index: number) {
		if (memeStore.isInteracting) return;

		try {
			await memeStore.pickMeme(meme.id);
			toast.success('Meme picked! 💖');
			
			// Check if we need to load more memes
			if (memeStore.availableMemes.length < 5) {
				loadMoreMemes();
			}
		} catch (error) {
			console.error('Failed to pick meme:', error);
			toast.error('Failed to pick meme. Please try again.');
		}
	}

	// Programmatic swipe actions
	function swipeLeft() {
		swipeCardStack?.swipeLeft();
	}

	function swipeRight() {
		swipeCardStack?.swipeRight();
	}

	// Load more memes
	async function loadMoreMemes() {
		try {
			await memeStore.loadAvailableMemes(10);
		} catch (error) {
			console.error('Failed to load more memes:', error);
		}
	}

	// Navigate to add meme page
	function goToAddMeme() {
		goto('/memeball/add');
	}

	// Refresh memes
	async function refreshMemes() {
		try {
			await memeStore.loadAvailableMemes(10);
			toast.success('Memes refreshed!');
		} catch (error) {
			console.error('Failed to refresh memes:', error);
			toast.error('Failed to refresh memes.');
		}
	}

	// Handle when cards are empty
	function handleCardsEmpty() {
		toast.info('No more memes! Loading more...');
		loadMoreMemes();
	}
</script>

<svelte:head>
	<title>Memeball - Curator Console</title>
	<meta name="description" content="Curate memes for the galactic archive" />
</svelte:head>

<div class="meme-viewer">
	{#if !isInitialized}
		<!-- Loading state -->
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<div class="loading-text">Initializing Memeball...</div>
			<div class="loading-subtext">Connecting to the galactic archive</div>
		</div>
	{:else if memeStore.error}
		<!-- Error state -->
		<div class="error-state">
			<div class="error-icon">⚠️</div>
			<h2 class="error-title">Archive Connection Failed</h2>
			<p class="error-message">{memeStore.error}</p>
			<Button onclick={refreshMemes} variant="outline" class="refresh-btn">
				<RefreshCw size={16} />
				Retry Connection
			</Button>
		</div>
	{:else if memeStore.availableMemes.length === 0}
		<!-- No memes state -->
		<div class="empty-state">
			<div class="empty-icon">🎯</div>
			<h2 class="empty-title">Archive Secured</h2>
			<p class="empty-message">
				You've reviewed all available memes for today. The galaxy appreciates your service, curator.
			</p>
			<div class="empty-actions">
				<Button onclick={goToAddMeme} class="submit-btn">
					<Plus size={16} />
					Submit New Meme
				</Button>
				<Button onclick={refreshMemes} variant="outline" class="refresh-btn">
					<RefreshCw size={16} />
					Check for Updates
				</Button>
			</div>
		</div>
	{:else if memeStore.availableMemes.length > 0}
		<!-- Main meme display -->
		<div class="meme-container">
			<SwipeCardStack
				bind:this={swipeCardStack}
				bind:cards={memeStore.availableMemes}
				onSwipeLeft={handleSwipeLeft}
				onSwipeRight={handleSwipeRight}
				onCardsEmpty={handleCardsEmpty}
				swipeThreshold={100}
				disabled={memeStore.isInteracting}
				maxVisibleCards={3}
				className="meme-swipe-stack"
			>
				{#snippet children(meme: MemeWithStats, index: number)}
					<div class="meme-card-wrapper">
						<!-- Main meme image -->
						<img
							src={meme.imageUrl}
							alt="Meme image"
							class="meme-image"
						/>
					</div>
				{/snippet}
			</SwipeCardStack>
		</div>
	{/if}

	<!-- Bottom Action Bar -->
	{#if isInitialized && !memeStore.error && memeStore.availableMemes.length > 0}
		<footer class="action-bar">
			<button
				class="action-btn reject-btn"
				onclick={swipeLeft}
				disabled={memeStore.isInteracting}
				aria-label="Reject meme"
			>
				<X size={28} />
			</button>
			<button
				class="action-btn pick-btn"
				onclick={swipeRight}
				disabled={memeStore.isInteracting}
				aria-label="Pick meme"
			>
				<Heart size={28} />
			</button>
		</footer>
	{/if}

	<!-- Right Toolbar (auto toggles between FAB stack and vertical toolbar) -->
	{#if isInitialized && !memeStore.error}
		<RightToolbar
			items={[
				{ id: 'new', icon: Plus, handler: goToAddMeme, ariaLabel: 'Submit new meme', title: 'Submit new meme' },
				{ id: 'refresh', icon: RefreshCw, handler: refreshMemes, ariaLabel: 'Refresh memes', title: 'Refresh memes' },
			]}
			variant="auto"
		/>

		<!-- Floating Action Button (mobile fallback) -->
		<button class="fab" onclick={goToAddMeme} aria-label="Submit new meme">
			<Plus size={20} />
		</button>
	{/if}
</div>

<style>
	.meme-viewer {
		position: absolute;
		inset: 0;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Loading state */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		color: #f8f5ff;
	}

	.loading-spinner {
		width: 48px;
		height: 48px;
		border: 3px solid rgba(248, 245, 255, 0.2);
		border-top: 3px solid #f8f5ff;
		border-radius: 50%;
		animation: spin 1.5s linear infinite;
		margin-bottom: 2rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading-text {
		font-size: 1.25rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.loading-subtext {
		font-size: 0.9rem;
		color: rgba(248, 245, 255, 0.6);
	}

	/* Error state */
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		color: #f8f5ff;
		max-width: 400px;
		padding: 2rem;
	}

	.error-icon {
		font-size: 4rem;
		margin-bottom: 1.5rem;
	}

	.error-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #f87171;
	}

	.error-message {
		font-size: 1rem;
		color: rgba(248, 245, 255, 0.8);
		margin-bottom: 2rem;
		line-height: 1.5;
	}

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		color: #f8f5ff;
		max-width: 400px;
		padding: 2rem;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1.5rem;
	}

	.empty-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.empty-message {
		font-size: 1rem;
		color: rgba(248, 245, 255, 0.8);
		margin-bottom: 2rem;
		line-height: 1.5;
	}

	.empty-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	/* Main meme display */
	.meme-container {
		position: relative;
		width: 100%;
		height: 100%;
		max-width: none;
		max-height: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	:global(.meme-swipe-stack) {
		flex: 1;
		min-height: 0;
	}

	/* Meme card styling */
	.meme-card-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: 0;
		overflow: hidden;
		background: #000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.meme-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	/* Bottom Action Bar */
	.action-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 40;
		background: transparent;
		padding: 1rem 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
	}

	.action-btn {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 200ms ease;
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
		color: white;
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.reject-btn {
		background: linear-gradient(135deg, #ef4444, #dc2626);
		box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
	}

	.reject-btn:hover:not(:disabled) {
		box-shadow: 0 12px 24px rgba(239, 68, 68, 0.4);
	}

	.pick-btn {
		background: linear-gradient(135deg, #10b981, #059669);
		box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
	}

	.pick-btn:hover:not(:disabled) {
		box-shadow: 0 12px 24px rgba(16, 185, 129, 0.4);
	}

	/* Floating Action Button */
	.fab {
		position: fixed;
		bottom: 5.5rem;
		right: 2rem;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: linear-gradient(135deg, #10b981, #06d6a0);
		border: none;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 200ms ease;
		box-shadow: 0 12px 24px rgba(16, 185, 129, 0.3);
		z-index: 50;
	}

	.fab:hover {
		transform: scale(1.05);
		box-shadow: 0 16px 32px rgba(16, 185, 129, 0.4);
	}

	.fab:active {
		transform: scale(0.95);
	}

	/* Button styling */
	:global(.refresh-btn) {
		border-color: rgba(255, 255, 255, 0.2) !important;
		color: #f8f5ff !important;
		background: rgba(3, 1, 20, 0.8) !important;
		backdrop-filter: blur(12px);
	}

	:global(.submit-btn) {
		background: linear-gradient(135deg, #10b981, #06d6a0) !important;
		border: none !important;
		color: white !important;
	}

	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.action-bar {
			padding: 0.75rem 1rem;
			gap: 1rem;
		}

		.action-btn {
			width: 56px;
			height: 56px;
		}

		.fab {
			bottom: 5rem;
			right: 1.5rem;
			width: 48px;
			height: 48px;
		}

		.empty-actions {
			flex-direction: column;
			align-items: center;
		}
	}

	/* Hide the old FAB on larger screens because the RightToolbar will show */
	@media (min-width: 640px) {
		.fab {
			display: none;
		}
	}
</style>