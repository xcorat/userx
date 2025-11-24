<!-- Main Meme Viewer Page - Full screen swipeable meme interface -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import SwipeCardStack from '$lib/components/ui/SwipeCardStack.svelte';
	import { memeStore } from '$lib/stores/meme.store.svelte';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus, RefreshCw, Heart, X, RotateCcw, BarChart } from 'lucide-svelte';
	import RightToolbar from '$lib/components/features/right-toolbar/RightToolbar.svelte';
	import { toast } from 'svelte-sonner';
	import type { MemeWithStats } from '$lib/models/meme.model';

	let isInitialized = $state(false);
	let swipeCardStack = $state<any>(null);
	let statsData = $state<MemeWithStats[]>([]);
	let acceptanceRatio = $state<number | null>(null);

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

			// Fetch stats for the stats button
			await loadStats();
		} catch (error) {
			console.error('Failed to initialize meme store:', error);
			toast.error('Failed to load memes. Please try again.');
		}
	});

	// Set CSS variables for bottom offset so RightToolbar can align above the bottom action bar
	onMount(() => {
		function setBottomOffset() {
			try {
				const actionBar = document.querySelector('.action-bar') as HTMLElement | null;
				const defaultOffset = 88; // approximate fallback
				const height = actionBar ? actionBar.offsetHeight : defaultOffset;
				document.documentElement.style.setProperty('--memeball-bottom-offset', `${height + 16}px`);
				document.documentElement.style.setProperty('--memeball-right-offset', `2rem`);
			} catch (e) { /* ignore in SSR */ }
		}

		setBottomOffset();
		window.addEventListener('resize', setBottomOffset);
		return () => { try { window.removeEventListener('resize', setBottomOffset); } catch (e) { /* ignore */ } };
	});

	// Handle swipe interactions
	async function handleSwipeLeft(meme: any, index: number) {
		if (memeStore.isInteracting) return;

		try {
			await memeStore.rejectMeme(meme.id);
			toast.info('Meme rejected');
			
			// Refresh stats to update button color
			await loadStats();
			
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
			
			// Refresh stats to update button color
			await loadStats();
			
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

	// Reset swipes
	async function resetSwipes() {
		try {
			await memeStore.clearSwipes();
			toast.success('Swipes reset! All memes are available again.');
		} catch (error) {
			console.error('Failed to reset swipes:', error);
			toast.error('Failed to reset swipes.');
		}
	}

	// Handle when cards are empty
	function handleCardsEmpty() {
		toast.info('No more memes! Loading more...');
		loadMoreMemes();
	}

	// Load stats data
	async function loadStats() {
		try {
			const response = await fetch('/api/memes/stats');
			if (response.ok) {
				const data = await response.json();
				statsData = data;
				calculateAcceptanceRatio();
			}
		} catch (error) {
			console.error('Failed to load stats:', error);
		}
	}

	// Calculate overall acceptance ratio
	function calculateAcceptanceRatio() {
		if (statsData.length === 0) {
			acceptanceRatio = null;
			return;
		}

		const totalPicks = statsData.reduce((sum, meme) => sum + meme.totalPicks, 0);
		const totalRejects = statsData.reduce((sum, meme) => sum + meme.totalRejects, 0);
		const total = totalPicks + totalRejects;

		if (total === 0) {
			acceptanceRatio = null;
			return;
		}

		acceptanceRatio = totalPicks / total;
	}

	// Map acceptance ratio to color gradient
	function getStatsButtonColor(): string {
		if (acceptanceRatio === null) {
			// Default neutral color when no stats
			return 'background: rgba(255,255,255,0.4); box-shadow: 0 6px 16px rgba(0,0,0,0.48);';
		}

		const ratio = acceptanceRatio;

		// Red gradient for low acceptance (0.0 - 0.3)
		if (ratio < 0.3) {
			const intensity = ratio / 0.3; // 0 to 1
			const alpha1 = 0.3 + (0.1 * intensity); // 0.3 to 0.4
			const alpha2 = 0.28 + (0.08 * intensity); // 0.28 to 0.36
			const shadowAlpha = 0.4 + (0.08 * intensity); // 0.4 to 0.48
			return `background: linear-gradient(135deg, rgba(239,68,68,${alpha1}), rgba(220,38,38,${alpha2})); box-shadow: 0 6px 16px rgba(239,68,68,${shadowAlpha});`;
		}

		// Yellow/Orange gradient for medium acceptance (0.3 - 0.7)
		if (ratio < 0.7) {
			const normalized = (ratio - 0.3) / 0.4; // 0 to 1 within this range
			const alpha1 = 0.3 + (0.1 * normalized); // 0.3 to 0.4
			const alpha2 = 0.28 + (0.08 * normalized); // 0.28 to 0.36
			const shadowAlpha = 0.4 + (0.08 * normalized); // 0.4 to 0.48
			return `background: linear-gradient(135deg, rgba(251,191,36,${alpha1}), rgba(245,158,11,${alpha2})); box-shadow: 0 6px 16px rgba(251,191,36,${shadowAlpha});`;
		}

		// Green gradient for high acceptance (0.7 - 1.0)
		const normalized = (ratio - 0.7) / 0.3; // 0 to 1 within this range
		const alpha1 = 0.3 + (0.1 * normalized); // 0.3 to 0.4
		const alpha2 = 0.28 + (0.08 * normalized); // 0.28 to 0.36
		const shadowAlpha = 0.4 + (0.08 * normalized); // 0.4 to 0.48
		return `background: linear-gradient(135deg, rgba(74,222,128,${alpha1}), rgba(34,197,94,${alpha2})); box-shadow: 0 6px 16px rgba(74,222,128,${shadowAlpha});`;
	}

	// Navigate to stats page
	function goToStats() {
		goto('/memeball/stats');
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
				<Button onclick={resetSwipes} variant="outline" class="refresh-btn">
					<RotateCcw size={16} />
					Reset Swipes
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
							alt={meme.altText || "Meme"}
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

	<!-- Right Toolbar (auto toggles between vertical toolbar and FAB on mobile) -->
	{#if isInitialized && !memeStore.error}
		<RightToolbar
			items={[
				{ id: 'stats', icon: BarChart, handler: goToStats, ariaLabel: 'View stats', title: 'View stats', style: getStatsButtonColor() },
				{ id: 'new', icon: Plus, handler: goToAddMeme, ariaLabel: 'Submit new meme', title: 'Submit new meme', color: 'primary' },
				{ id: 'refresh', icon: RefreshCw, handler: refreshMemes, ariaLabel: 'Refresh memes', title: 'Refresh memes', color: 'neutral' },
			]}
			variant="auto"
		/>
	{/if}
</div>

<style>
	.meme-viewer {
		position: absolute;
		inset: 0;
		/* Allow page to scroll vertically when content is taller than viewport.
			 Keep horizontal overflow hidden to avoid stray content horizontally. */
		overflow-x: hidden;
		overflow-y: auto;
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
		color: var(--memeball-foreground);
	}

	.loading-spinner {
		width: 48px;
		height: 48px;
		border: 3px solid var(--memeball-border);
		border-top: 3px solid var(--memeball-foreground);
		border-radius: var(--memeball-radius-full);
		animation: memeball-spin 1.5s linear infinite;
		margin-bottom: var(--memeball-space-2xl);
	}

	.loading-text {
		font-size: var(--memeball-text-xl);
		font-weight: var(--memeball-font-medium);
		margin-bottom: var(--memeball-space-sm);
	}

	.loading-subtext {
		font-size: var(--memeball-text-base);
		color: var(--memeball-muted-foreground);
	}

	/* Error state */
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		color: var(--memeball-foreground);
		max-width: 400px;
		padding: var(--memeball-space-2xl);
	}

	.error-icon {
		font-size: var(--memeball-text-4xl);
		margin-bottom: var(--memeball-space-2xl);
	}

	.error-title {
		font-size: var(--memeball-text-2xl);
		font-weight: var(--memeball-font-semibold);
		margin-bottom: var(--memeball-space-lg);
		color: var(--memeball-error-text);
	}

	.error-message {
		font-size: var(--memeball-text-md);
		color: var(--memeball-muted-foreground);
		margin-bottom: var(--memeball-space-2xl);
		line-height: var(--memeball-leading-relaxed);
	}

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		color: var(--memeball-foreground);
		max-width: 400px;
		padding: var(--memeball-space-2xl);
	}

	.empty-icon {
		font-size: var(--memeball-text-4xl);
		margin-bottom: var(--memeball-space-2xl);
	}

	.empty-title {
		font-size: var(--memeball-text-2xl);
		font-weight: var(--memeball-font-semibold);
		margin-bottom: var(--memeball-space-lg);
	}

	.empty-message {
		font-size: var(--memeball-text-md);
		color: var(--memeball-muted-foreground);
		margin-bottom: var(--memeball-space-2xl);
		line-height: var(--memeball-leading-relaxed);
	}

	.empty-actions {
		display: flex;
		gap: var(--memeball-space-lg);
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
		z-index: var(--memeball-z-fixed);
		background: transparent;
		padding: var(--memeball-space-lg) var(--memeball-space-2xl);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--memeball-space-2xl);
	}

	.action-btn {
		width: 64px;
		height: 64px;
		border-radius: var(--memeball-radius-full);
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all var(--memeball-duration-normal) var(--memeball-ease);
		box-shadow: var(--memeball-shadow-md);
		color: white;
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.reject-btn {
		background: var(--memeball-gradient-destructive);
		box-shadow: var(--memeball-shadow-destructive);
	}

	.reject-btn:hover:not(:disabled) {
		box-shadow: var(--memeball-shadow-destructive-hover);
	}

	.pick-btn {
		background: var(--memeball-gradient-primary);
		box-shadow: var(--memeball-shadow-primary);
	}

	.pick-btn:hover:not(:disabled) {
		box-shadow: var(--memeball-shadow-primary-hover);
	}

	/* Button styling */
	:global(.refresh-btn) {
		border-color: var(--memeball-border-emphasis);
		color: var(--memeball-foreground);
		background: var(--memeball-surface);
		backdrop-filter: var(--memeball-backdrop-blur-md);
	}

	:global(.submit-btn) {
		background: var(--memeball-gradient-primary);
		border: none;
		color: white;
	}

	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.action-bar {
			padding: var(--memeball-space-md) var(--memeball-space-lg);
			gap: var(--memeball-space-lg);
		}

		.action-btn {
			width: 56px;
			height: 56px;
		}

		.empty-actions {
			flex-direction: column;
			align-items: center;
		}
	}
</style>