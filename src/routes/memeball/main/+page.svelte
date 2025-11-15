<!-- Main Meme Viewer Page - Full screen swipeable meme interface -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import SwipeCard from '$lib/components/ui/SwipeCard.svelte';
	import MemeCard from '$lib/components/features/memes/MemeCard.svelte';
	import { memeStore } from '$lib/stores/meme.store.svelte';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus, RefreshCw } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let isInitialized = $state(false);
	let currentMemeElement = $state<HTMLElement | null>(null);

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
	function handleSwipeLeft() {
		handleReject();
	}

	function handleSwipeRight() {
		handlePick();
	}

	// Handle pick/reject actions
	async function handlePick() {
		if (!memeStore.currentMeme || memeStore.isInteracting) return;

		try {
			await memeStore.pickCurrentMeme();
			toast.success('Meme picked! 💖');
			
			// Check if we need to load more memes
			if (memeStore.availableMemes.length < 3) {
				loadMoreMemes();
			}
		} catch (error) {
			console.error('Failed to pick meme:', error);
			toast.error('Failed to pick meme. Please try again.');
		}
	}

	async function handleReject() {
		if (!memeStore.currentMeme || memeStore.isInteracting) return;

		try {
			await memeStore.rejectCurrentMeme();
			toast.info('Meme rejected');
			
			// Check if we need to load more memes
			if (memeStore.availableMemes.length < 3) {
				loadMoreMemes();
			}
		} catch (error) {
			console.error('Failed to reject meme:', error);
			toast.error('Failed to reject meme. Please try again.');
		}
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
	{:else if memeStore.currentMeme}
		<!-- Main meme display -->
		<div class="meme-container">
			<SwipeCard
				bind:ref={currentMemeElement}
				data={memeStore.currentMeme}
				onSwipeLeft={handleSwipeLeft}
				onSwipeRight={handleSwipeRight}
				swipeThreshold={100}
				disabled={memeStore.isInteracting}
				className="meme-swipe-card"
			>
				<MemeCard
					meme={memeStore.currentMeme}
					onPick={handlePick}
					onReject={handleReject}
					disabled={memeStore.isInteracting}
				/>
			</SwipeCard>

			<!-- Progress indicator -->
			<div class="progress-indicator">
				<div class="progress-text">
					Meme {memeStore.currentMemeIndex + 1} of {memeStore.availableMemes.length}
				</div>
				<div class="progress-bar">
					<div 
						class="progress-fill" 
						style={`width: ${((memeStore.currentMemeIndex + 1) / memeStore.availableMemes.length) * 100}%`}
					></div>
				</div>
			</div>

			<!-- Quick stats -->
			{#if memeStore.userStats}
				<div class="user-stats">
					<div class="stat-item">
						<span class="stat-number">{memeStore.userStats.totalPicks}</span>
						<span class="stat-label">Picks Today</span>
					</div>
					<div class="stat-item">
						<span class="stat-number">{memeStore.tokensRemaining}</span>
						<span class="stat-label">Tokens Left</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Floating Action Button -->
	{#if isInitialized && !memeStore.error}
		<button class="fab" onclick={goToAddMeme} aria-label="Submit new meme">
			<Plus size={20} />
		</button>
	{/if}
</div>

<style>
	.meme-viewer {
		position: relative;
		width: 100vw;
		height: 100vh;
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
		max-width: 450px;
		max-height: 800px;
		margin: 0 auto;
		padding: 1rem;
	}

	:global(.meme-swipe-card) {
		width: 100% !important;
		height: 100% !important;
		border-radius: 24px !important;
		background: transparent !important;
		box-shadow: none !important;
	}

	/* Progress indicator */
	.progress-indicator {
		position: absolute;
		top: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(3, 1, 20, 0.8);
		backdrop-filter: blur(12px);
		border-radius: 20px;
		padding: 0.75rem 1.25rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		z-index: 10;
	}

	.progress-text {
		font-size: 0.8rem;
		color: rgba(248, 245, 255, 0.8);
		text-align: center;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.progress-bar {
		width: 120px;
		height: 3px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #10b981, #06d6a0);
		border-radius: 2px;
		transition: width 300ms ease;
	}

	/* User stats */
	.user-stats {
		position: absolute;
		top: 1.5rem;
		right: 1.5rem;
		display: flex;
		gap: 1rem;
		z-index: 10;
	}

	.stat-item {
		background: rgba(3, 1, 20, 0.8);
		backdrop-filter: blur(12px);
		border-radius: 12px;
		padding: 0.5rem 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		text-align: center;
		min-width: 60px;
	}

	.stat-number {
		display: block;
		font-size: 1rem;
		font-weight: 600;
		color: #f8f5ff;
	}

	.stat-label {
		display: block;
		font-size: 0.7rem;
		color: rgba(248, 245, 255, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Floating Action Button */
	.fab {
		position: fixed;
		bottom: 2rem;
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
		.meme-container {
			padding: 0.5rem;
		}

		.progress-indicator {
			top: 1rem;
			padding: 0.5rem 1rem;
		}

		.progress-text {
			font-size: 0.7rem;
		}

		.progress-bar {
			width: 100px;
		}

		.user-stats {
			top: 1rem;
			right: 1rem;
			gap: 0.5rem;
		}

		.stat-item {
			padding: 0.4rem 0.6rem;
			min-width: 50px;
		}

		.stat-number {
			font-size: 0.9rem;
		}

		.stat-label {
			font-size: 0.6rem;
		}

		.fab {
			bottom: 1.5rem;
			right: 1.5rem;
			width: 48px;
			height: 48px;
		}

		.empty-actions {
			flex-direction: column;
			align-items: center;
		}
	}
</style>