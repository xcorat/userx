<!-- MemeCard component for displaying memes in full-screen swipe interface -->
<script lang="ts">
	import type { MemeWithStats } from '$lib/models/meme.model';
	
	interface Props {
		meme: MemeWithStats;
		onPick: () => void;
		onReject: () => void;
		disabled?: boolean;
	}

	let { meme, onPick, onReject, disabled = false }: Props = $props();
	
	let imageLoaded = $state(false);
	let imageError = $state(false);

	function handleImageLoad() {
		imageLoaded = true;
		imageError = false;
	}

	function handleImageError() {
		imageLoaded = false;
		imageError = true;
	}
</script>

<div class="meme-card" class:disabled>
	<!-- Loading state -->
	{#if !imageLoaded && !imageError}
		<div class="image-loading">
			<div class="loading-spinner"></div>
			<div class="loading-text">Loading meme...</div>
		</div>
	{/if}

	<!-- Error state -->
	{#if imageError}
		<div class="image-error">
			<div class="error-icon">⚠️</div>
			<div class="error-text">Failed to load meme</div>
			<div class="error-url">{meme.imageUrl}</div>
		</div>
	{/if}

	<!-- Main meme image -->
	<img
		src={meme.imageUrl}
		alt={meme.altText || 'Meme image'}
		class="meme-image"
		class:loaded={imageLoaded}
		onload={handleImageLoad}
		onerror={handleImageError}
	/>

	<!-- Meme info overlay (bottom) -->
	<div class="meme-info">
		{#if meme.altText}
			<div class="meme-alt-text">{meme.altText}</div>
		{/if}
		
		<div class="meme-stats">
			<div class="stat">
				<span class="stat-value">{meme.totalPicks}</span>
				<span class="stat-label">picks</span>
			</div>
			<div class="stat">
				<span class="stat-value">{meme.totalRejects}</span>
				<span class="stat-label">rejects</span>
			</div>
		</div>
	</div>

	<!-- Swipe action buttons (for non-touch devices) -->
	<div class="action-buttons">
		<button
			class="action-btn reject"
			onclick={onReject}
			{disabled}
			aria-label="Reject meme"
		>
			✕
		</button>
		<button
			class="action-btn pick"
			onclick={onPick}
			{disabled}
			aria-label="Pick meme"
		>
			♥
		</button>
	</div>
</div>

<style>
	.meme-card {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: 24px;
		overflow: hidden;
		background: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
	}

	.meme-card.disabled {
		pointer-events: none;
		opacity: 0.7;
	}

	.meme-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		opacity: 0;
		transition: opacity 300ms ease;
	}

	.meme-image.loaded {
		opacity: 1;
	}

	.image-loading {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(3, 1, 20, 0.8);
		color: #f8f5ff;
	}

	.loading-spinner {
		width: 32px;
		height: 32px;
		border: 2px solid rgba(248, 245, 255, 0.2);
		border-top: 2px solid #f8f5ff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading-text {
		font-size: 0.9rem;
		color: rgba(248, 245, 255, 0.7);
	}

	.image-error {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(20, 1, 3, 0.8);
		color: #f8f5ff;
		padding: 2rem;
		text-align: center;
	}

	.error-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.error-text {
		font-size: 1.1rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
		color: #f87171;
	}

	.error-url {
		font-size: 0.8rem;
		color: rgba(248, 245, 255, 0.6);
		word-break: break-all;
	}

	.meme-info {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
		padding: 2rem 1.5rem 1.5rem;
		color: #f8f5ff;
		pointer-events: none;
	}

	.meme-alt-text {
		font-size: 0.9rem;
		line-height: 1.4;
		margin-bottom: 1rem;
		color: rgba(248, 245, 255, 0.9);
	}

	.meme-stats {
		display: flex;
		gap: 1.5rem;
	}

	.stat {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
	}

	.stat-value {
		font-size: 1.1rem;
		font-weight: 600;
		color: #f8f5ff;
	}

	.stat-label {
		font-size: 0.8rem;
		color: rgba(248, 245, 255, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.action-buttons {
		position: absolute;
		bottom: 1.5rem;
		right: 1.5rem;
		display: flex;
		gap: 1rem;
		pointer-events: all;
	}

	.action-btn {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.2);
		background: rgba(3, 1, 20, 0.8);
		backdrop-filter: blur(12px);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		cursor: pointer;
		transition: all 200ms ease;
		color: #f8f5ff;
	}

	.action-btn:hover {
		transform: scale(1.05);
		border-color: rgba(255, 255, 255, 0.4);
	}

	.action-btn:active {
		transform: scale(0.95);
	}

	.action-btn.reject {
		color: #f87171;
	}

	.action-btn.reject:hover {
		background: rgba(248, 113, 113, 0.2);
		border-color: #f87171;
	}

	.action-btn.pick {
		color: #10b981;
	}

	.action-btn.pick:hover {
		background: rgba(16, 185, 129, 0.2);
		border-color: #10b981;
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	/* Hide action buttons on touch devices */
	@media (hover: none) {
		.action-buttons {
			display: none;
		}
		
		.meme-info {
			padding-right: 1.5rem;
		}
	}

	@media (max-width: 640px) {
		.meme-info {
			padding: 1.5rem 1rem 1rem;
		}

		.meme-alt-text {
			font-size: 0.8rem;
			margin-bottom: 0.75rem;
		}

		.stat {
			gap: 0.2rem;
		}

		.stat-value {
			font-size: 1rem;
		}

		.stat-label {
			font-size: 0.7rem;
		}

		.action-buttons {
			bottom: 1rem;
			right: 1rem;
			gap: 0.75rem;
		}

		.action-btn {
			width: 48px;
			height: 48px;
			font-size: 1.3rem;
		}
	}
</style>