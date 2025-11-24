<!-- Meme Stats Page - Display all memes sorted by acceptance ratio -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { MemeWithStats } from '$lib/models/meme.model';
	import { Heart, X, TrendingUp } from 'lucide-svelte';

	let memes = $state<MemeWithStats[]>([]);
	let memesWithRanks = $state<Array<MemeWithStats & { rank: number }>>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			const response = await fetch('/api/memes/stats');
			if (!response.ok) {
				throw new Error('Failed to fetch meme stats');
			}
			const data = await response.json() as MemeWithStats[];
			const sorted = sortMemesByAcceptanceRatio(data);
			memes = sorted;
			memesWithRanks = calculateRanks(sorted);
			isLoading = false;
		} catch (e) {
			console.error('Error loading meme stats:', e);
			error = e instanceof Error ? e.message : 'Failed to load meme stats';
			isLoading = false;
		}
	});

	function calculateAcceptanceRatio(picks: number, rejects: number): number | null {
		const total = picks + rejects;
		if (total === 0) return null;
		return picks / total;
	}

	function sortMemesByAcceptanceRatio(memesList: MemeWithStats[]): MemeWithStats[] {
		return [...memesList].sort((a, b) => {
			const ratioA = calculateAcceptanceRatio(a.totalPicks, a.totalRejects);
			const ratioB = calculateAcceptanceRatio(b.totalPicks, b.totalRejects);
			
			// Memes with no responses go to the bottom
			if (ratioA === null && ratioB === null) return 0;
			if (ratioA === null) return 1;
			if (ratioB === null) return -1;
			
			// Sort by acceptance ratio (descending)
			if (ratioA !== ratioB) {
				return (ratioB as number) - (ratioA as number);
			}
			
			// Tiebreaker: more total responses = higher rank
			const totalA = a.totalPicks + a.totalRejects;
			const totalB = b.totalPicks + b.totalRejects;
			return totalB - totalA;
		});
	}

	function calculateRanks(memesList: MemeWithStats[]): Array<MemeWithStats & { rank: number }> {
		const memesWithRanks: Array<MemeWithStats & { rank: number }> = [];
		let currentRank = 1;
		let i = 0;

		while (i < memesList.length) {
			const currentMeme = memesList[i];
			const currentRatio = calculateAcceptanceRatio(currentMeme.totalPicks, currentMeme.totalRejects);
			
			// Round ratio to 3 decimal places for comparison
			const roundedRatio = currentRatio === null ? null : Math.round(currentRatio * 1000) / 1000;
			
			// Find all memes with the same rounded ratio
			const tiedMemes: MemeWithStats[] = [currentMeme];
			let j = i + 1;
			
			while (j < memesList.length) {
				const nextMeme = memesList[j];
				const nextRatio = calculateAcceptanceRatio(nextMeme.totalPicks, nextMeme.totalRejects);
				const nextRoundedRatio = nextRatio === null ? null : Math.round(nextRatio * 1000) / 1000;
				
				if (roundedRatio === nextRoundedRatio) {
					tiedMemes.push(nextMeme);
					j++;
				} else {
					break;
				}
			}
			
			// Assign the same rank to all tied memes
			for (const meme of tiedMemes) {
				memesWithRanks.push({ ...meme, rank: currentRank });
			}
			
			// Move to next rank (skip by the number of tied memes)
			currentRank += tiedMemes.length;
			i = j;
		}
		
		return memesWithRanks;
	}

	function calculateRatio(picks: number, rejects: number): string {
		const total = picks + rejects;
		if (total === 0) return '0:0';
		if (picks === 0) return '0:1';
		if (rejects === 0) return '1:0';
		// Find GCD to simplify ratio
		const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
		const divisor = gcd(picks, rejects);
		return `${picks / divisor}:${rejects / divisor}`;
	}

	function calculatePercentage(picks: number, rejects: number): number {
		const total = picks + rejects;
		if (total === 0) return 0;
		return Math.round((picks / total) * 100);
	}
</script>

<svelte:head>
	<title>Memeball Stats</title>
	<meta name="description" content="View meme statistics and acceptance ratios" />
</svelte:head>

<div class="stats-page">
	<div class="stats-header">
		<h1 class="stats-title">Meme Statistics</h1>
		<p class="stats-subtitle">Acceptance and rejection ratios for all memes</p>
	</div>

	{#if isLoading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<div class="loading-text">Loading stats...</div>
		</div>
	{:else if error}
		<div class="error-state">
			<div class="error-icon">⚠️</div>
			<h2 class="error-title">Failed to Load Stats</h2>
			<p class="error-message">{error}</p>
		</div>
	{:else if memes.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📊</div>
			<h2 class="empty-title">No Memes Yet</h2>
			<p class="empty-message">No memes have been submitted yet. Be the first!</p>
		</div>
	{:else}
		<div class="stats-grid">
			{#each memesWithRanks as meme (meme.id)}
				<div class="meme-card">
					<div class="meme-image-container">
						<img
							src={meme.imageUrl}
							alt={meme.altText || 'Meme'}
							class="meme-thumbnail"
							loading="lazy"
						/>
					</div>
					<div class="meme-info">
						<div class="meme-header">
							<div class="rank-badge">#{meme.rank}</div>
							<div class="meme-id">ID: {meme.id.slice(0, 8)}...</div>
						</div>
						{#if meme.altText}
							<div class="meme-alt-text">{meme.altText}</div>
						{/if}
					</div>
					<div class="meme-stats">
						<div class="stat-row">
							<div class="stat-item stat-accepted">
								<Heart size={16} />
								<span class="stat-label">Accepted</span>
								<span class="stat-value">{meme.totalPicks}</span>
							</div>
							<div class="stat-item stat-rejected">
								<X size={16} />
								<span class="stat-label">Rejected</span>
								<span class="stat-value">{meme.totalRejects}</span>
							</div>
						</div>
						<div class="stat-row stat-ratio">
							<div class="ratio-display">
								<TrendingUp size={14} />
								<span class="ratio-text">Ratio: {calculateRatio(meme.totalPicks, meme.totalRejects)}</span>
							</div>
							<div class="percentage-display" style="--acceptance: {calculatePercentage(meme.totalPicks, meme.totalRejects)}%">
								<div class="percentage-bar">
									<div class="percentage-fill"></div>
								</div>
								<span class="percentage-text">{calculatePercentage(meme.totalPicks, meme.totalRejects)}%</span>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.stats-page {
		position: absolute;
		inset: 0;
		overflow-x: hidden;
		overflow-y: auto;
		/* Added significant padding to avoid header overlap */
		padding: calc(var(--memeball-space-4xl) * 2) var(--memeball-space-2xl) var(--memeball-space-2xl);
		color: var(--memeball-foreground);
	}

	.stats-header {
		text-align: center;
		margin-bottom: var(--memeball-space-4xl);
	}

	.stats-title {
		font-size: var(--memeball-text-3xl);
		font-weight: var(--memeball-font-semibold);
		margin-bottom: var(--memeball-space-md);
		color: var(--memeball-foreground);
		text-transform: uppercase;
		letter-spacing: var(--memeball-tracking-wide);
	}

	.stats-subtitle {
		font-size: var(--memeball-text-base);
		color: var(--memeball-muted-foreground);
		margin: 0;
	}

	/* Loading state */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
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
		font-size: var(--memeball-text-lg);
		color: var(--memeball-muted-foreground);
	}

	@keyframes memeball-spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Error state */
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		text-align: center;
		color: var(--memeball-foreground);
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
	}

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		text-align: center;
		color: var(--memeball-foreground);
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
	}

	/* Stats grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--memeball-space-2xl);
		max-width: 1400px;
		margin: 0 auto;
	}

	.meme-card {
		background: var(--memeball-card-background);
		border: 1px solid var(--memeball-card-border);
		border-radius: var(--memeball-radius-xl);
		box-shadow: var(--memeball-shadow-md);
		backdrop-filter: var(--memeball-backdrop-blur-md);
		overflow: hidden;
		transition: transform var(--memeball-duration-normal) var(--memeball-ease),
			box-shadow var(--memeball-duration-normal) var(--memeball-ease);
	}

	.meme-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--memeball-shadow-lg);
	}

	.meme-image-container {
		width: 100%;
		height: 200px;
		overflow: hidden;
		background: #000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.meme-thumbnail {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.meme-info {
		padding: var(--memeball-space-lg);
		border-bottom: 1px solid var(--memeball-border);
	}

	.meme-header {
		display: flex;
		align-items: center;
		gap: var(--memeball-space-md);
		margin-bottom: var(--memeball-space-xs);
	}

	.rank-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 36px;
		height: 36px;
		padding: 0 var(--memeball-space-sm);
		background: linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(74, 222, 128, 0.1));
		border: 2px solid rgba(74, 222, 128, 0.4);
		border-radius: var(--memeball-radius-md);
		font-size: var(--memeball-text-lg);
		font-weight: var(--memeball-font-bold);
		color: rgba(74, 222, 128, 0.9);
		font-family: monospace;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.meme-id {
		font-size: var(--memeball-text-xs);
		color: var(--memeball-muted-foreground);
		font-family: monospace;
		flex: 1;
	}

	.meme-alt-text {
		font-size: var(--memeball-text-sm);
		color: var(--memeball-foreground);
		opacity: 0.9;
		line-height: var(--memeball-leading-relaxed);
	}

	.meme-stats {
		padding: var(--memeball-space-lg);
	}

	.stat-row {
		display: flex;
		align-items: center;
		gap: var(--memeball-space-md);
		margin-bottom: var(--memeball-space-md);
	}

	.stat-row:last-child {
		margin-bottom: 0;
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: var(--memeball-space-xs);
		flex: 1;
		padding: var(--memeball-space-sm);
		border-radius: var(--memeball-radius-md);
		background: var(--memeball-surface);
	}

	.stat-accepted {
		color: rgba(74, 222, 128, 0.9);
	}

	.stat-rejected {
		color: rgba(248, 113, 113, 0.9);
	}

	.stat-label {
		font-size: var(--memeball-text-sm);
		font-weight: var(--memeball-font-medium);
	}

	.stat-value {
		font-size: var(--memeball-text-lg);
		font-weight: var(--memeball-font-semibold);
		margin-left: auto;
	}

	.stat-ratio {
		flex-direction: column;
		gap: var(--memeball-space-sm);
	}

	.ratio-display {
		display: flex;
		align-items: center;
		gap: var(--memeball-space-xs);
		font-size: var(--memeball-text-sm);
		color: var(--memeball-muted-foreground);
		width: 100%;
	}

	.percentage-display {
		display: flex;
		align-items: center;
		gap: var(--memeball-space-sm);
		width: 100%;
	}

	.percentage-bar {
		flex: 1;
		height: 8px;
		background: var(--memeball-surface);
		border-radius: var(--memeball-radius-full);
		overflow: hidden;
	}

	.percentage-fill {
		height: 100%;
		width: var(--acceptance);
		background: linear-gradient(
			90deg,
			rgba(248, 113, 113, 0.8) 0%,
			rgba(74, 222, 128, 0.8) 100%
		);
		transition: width var(--memeball-duration-normal) var(--memeball-ease);
	}

	.percentage-text {
		font-size: var(--memeball-text-sm);
		font-weight: var(--memeball-font-semibold);
		color: var(--memeball-foreground);
		min-width: 40px;
		text-align: right;
	}

	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.stats-page {
			padding: var(--memeball-space-4xl) var(--memeball-space-lg) var(--memeball-space-lg);
		}

		.stats-grid {
			grid-template-columns: 1fr;
			gap: var(--memeball-space-lg);
		}

		.stats-title {
			font-size: var(--memeball-text-2xl);
		}
	}
</style>
