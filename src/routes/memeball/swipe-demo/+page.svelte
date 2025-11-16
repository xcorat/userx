<script lang="ts">
	import SwipeCardStack from '$lib/components/ui/SwipeCardStack.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Heart, X, RotateCcw } from 'lucide-svelte';
	
	let swipeStack: any = $state(null);
	let cards = $state([
		{ id: 1, color: 'bg-gradient-to-br from-pink-400 to-purple-500', label: 'Card 1' },
		{ id: 2, color: 'bg-gradient-to-br from-blue-400 to-cyan-500', label: 'Card 2' },
		{ id: 3, color: 'bg-gradient-to-br from-green-400 to-emerald-500', label: 'Card 3' },
		{ id: 4, color: 'bg-gradient-to-br from-orange-400 to-red-500', label: 'Card 4' },
		{ id: 5, color: 'bg-gradient-to-br from-indigo-400 to-purple-500', label: 'Card 5' },
	]);

	function handleSwipeLeft(card: any) {
		// Left swipe handled
	}

	function handleSwipeRight(card: any) {
		// Right swipe handled
	}

	function handleCardsEmpty() {
		// All cards have been swiped
	}

	function resetCards() {
		cards = [
			{ id: Date.now() + 1, color: 'bg-gradient-to-br from-pink-400 to-purple-500', label: 'Card 1' },
			{ id: Date.now() + 2, color: 'bg-gradient-to-br from-blue-400 to-cyan-500', label: 'Card 2' },
			{ id: Date.now() + 3, color: 'bg-gradient-to-br from-green-400 to-emerald-500', label: 'Card 3' },
			{ id: Date.now() + 4, color: 'bg-gradient-to-br from-orange-400 to-red-500', label: 'Card 4' },
			{ id: Date.now() + 5, color: 'bg-gradient-to-br from-indigo-400 to-purple-500', label: 'Card 5' },
		];
	}

	function swipeLeft() {
		swipeStack?.swipeLeft();
	}

	function swipeRight() {
		swipeStack?.swipeRight();
	}
</script>

<svelte:head>
	<title>Swipe Card Stack Demo</title>
	<meta name="description" content="Demo of the new swipeable card stack component" />
</svelte:head>

<div class="demo-container">
	<div class="demo-header">
		<h1>Swipe Card Stack Demo</h1>
		<p>Drag cards left or right, or use the buttons below</p>
	</div>

	<div class="card-stack-container">
		<SwipeCardStack
			bind:this={swipeStack}
			bind:cards
			onSwipeLeft={handleSwipeLeft}
			onSwipeRight={handleSwipeRight}
			onCardsEmpty={handleCardsEmpty}
			swipeThreshold={100}
			maxVisibleCards={3}
		>
			{#snippet children(card: any, index: number)}
				<div class="demo-card {card.color}">
					<div class="card-content">
						<span class="card-number">{card.id}</span>
						<span class="card-label">{card.label}</span>
						<span class="card-index">Index: {index}</span>
					</div>
				</div>
			{/snippet}
			{#snippet empty()}
				<div class="empty-state-inner">
					<p class="empty-message">All cards cleared!</p>
					<Button onclick={resetCards} class="reset-btn">
						<RotateCcw size={16} />
						Reset Cards
					</Button>
				</div>
			{/snippet}
		</SwipeCardStack>
	</div>

	<div class="action-controls">
		<button
			class="control-btn reject-btn"
			onclick={swipeLeft}
			disabled={cards.length === 0}
		>
			<X size={28} />
		</button>
		<button
			class="control-btn reset-btn-circle"
			onclick={resetCards}
		>
			<RotateCcw size={24} />
		</button>
		<button
			class="control-btn pick-btn"
			onclick={swipeRight}
			disabled={cards.length === 0}
		>
			<Heart size={28} />
		</button>
	</div>

	<div class="info-panel">
		<p class="info-text">Cards remaining: <strong>{cards.length}</strong></p>
		<p class="info-hint">
			💡 Try dragging the top card or use the buttons below
		</p>
	</div>
</div>

<style>
	.demo-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 2rem;
	}

	.demo-header {
		text-align: center;
		color: white;
	}

	.demo-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.demo-header p {
		font-size: 1rem;
		opacity: 0.9;
	}

	.card-stack-container {
		position: relative;
		width: 100%;
		max-width: 400px;
		height: 600px;
		border-radius: 24px;
	}

	.demo-card {
		width: 100%;
		height: 100%;
		border-radius: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
	}

	.card-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		color: white;
	}

	.card-number {
		font-size: 8rem;
		font-weight: 900;
		opacity: 0.3;
		line-height: 1;
	}

	.card-label {
		font-size: 2rem;
		font-weight: 600;
	}

	.card-index {
		font-size: 1rem;
		opacity: 0.7;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		padding: 2rem;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(12px);
		border-radius: 24px;
		border: 2px dashed rgba(255, 255, 255, 0.3);
	}

	.empty-state-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.empty-message {
		font-size: 1.5rem;
		color: white;
		font-weight: 600;
	}

	.action-controls {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		justify-content: center;
	}

	.control-btn {
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

	.control-btn:hover:not(:disabled) {
		transform: scale(1.1);
	}

	.control-btn:active:not(:disabled) {
		transform: scale(0.95);
	}

	.control-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.reject-btn {
		background: linear-gradient(135deg, #ef4444, #dc2626);
		box-shadow: 0 8px 16px rgba(239, 68, 68, 0.4);
	}

	.pick-btn {
		background: linear-gradient(135deg, #10b981, #059669);
		box-shadow: 0 8px 16px rgba(16, 185, 129, 0.4);
	}

	.reset-btn-circle {
		background: linear-gradient(135deg, #8b5cf6, #7c3aed);
		box-shadow: 0 8px 16px rgba(139, 92, 246, 0.4);
		width: 56px;
		height: 56px;
	}

	.info-panel {
		text-align: center;
		color: white;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(12px);
		border-radius: 16px;
		padding: 1rem 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.info-text {
		font-size: 1.125rem;
		margin-bottom: 0.5rem;
	}

	.info-hint {
		font-size: 0.875rem;
		opacity: 0.8;
	}

	@media (max-width: 640px) {
		.demo-header h1 {
			font-size: 2rem;
		}

		.card-stack-container {
			max-width: 350px;
			height: 500px;
		}

		.card-number {
			font-size: 6rem;
		}

		.card-label {
			font-size: 1.5rem;
		}

		.control-btn {
			width: 56px;
			height: 56px;
		}

		.reset-btn-circle {
			width: 48px;
			height: 48px;
		}
	}
</style>
