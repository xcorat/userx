<script lang="ts">
	import SwipeCardStack from '$lib/components/ui/SwipeCardStack.svelte';
	
	let cards = $state([
		{ id: 1, title: 'Card 1', color: 'bg-blue-500', description: 'Swipe left or right' },
		{ id: 2, title: 'Card 2', color: 'bg-green-500', description: 'Drag with mouse or touch' },
		{ id: 3, title: 'Card 3', color: 'bg-purple-500', description: 'Try swiping all cards' },
		{ id: 4, title: 'Card 4', color: 'bg-red-500', description: 'This is card four' },
		{ id: 5, title: 'Card 5', color: 'bg-yellow-500', description: 'Almost done!' },
		{ id: 6, title: 'Card 6', color: 'bg-pink-500', description: 'Last card!' }
	]);
	
	let swipeHistory = $state<Array<{ card: any; direction: string; time: string }>>([]);
	
	function handleSwipeLeft(card: any, index: number) {
		console.log('Swiped left:', card.title, 'at index', index);
		swipeHistory = [...swipeHistory, {
			card,
			direction: 'left',
			time: new Date().toLocaleTimeString()
		}];
	}
	
	function handleSwipeRight(card: any, index: number) {
		console.log('Swiped right:', card.title, 'at index', index);
		swipeHistory = [...swipeHistory, {
			card,
			direction: 'right',
			time: new Date().toLocaleTimeString()
		}];
	}
	
	function handleCardsEmpty() {
		console.log('All cards swiped!');
	}
	
	function resetCards() {
		cards = [
			{ id: 1, title: 'Card 1', color: 'bg-blue-500', description: 'Swipe left or right' },
			{ id: 2, title: 'Card 2', color: 'bg-green-500', description: 'Drag with mouse or touch' },
			{ id: 3, title: 'Card 3', color: 'bg-purple-500', description: 'Try swiping all cards' },
			{ id: 4, title: 'Card 4', color: 'bg-red-500', description: 'This is card four' },
			{ id: 5, title: 'Card 5', color: 'bg-yellow-500', description: 'Almost done!' },
			{ id: 6, title: 'Card 6', color: 'bg-pink-500', description: 'Last card!' }
		];
		swipeHistory = [];
	}
</script>

<svelte:head>
	<title>Basic Swipe Cards Demo</title>
</svelte:head>

<div class="demo-container">
	<h1 class="title">Basic Swipe Cards Demo</h1>
	<p class="subtitle">Drag cards left or right to swipe them away</p>
	
	<div class="content">
		<div class="card-stack-wrapper">
			<SwipeCardStack
				bind:cards
				onSwipeLeft={handleSwipeLeft}
				onSwipeRight={handleSwipeRight}
				onCardsEmpty={handleCardsEmpty}
				swipeThreshold={100}
				maxVisibleCards={3}
			>
				{#snippet children(card, index)}
					<div class="demo-card {card.color}">
						<div class="card-content">
							<h2 class="card-title">{card.title}</h2>
							<p class="card-description">{card.description}</p>
							<p class="card-index">Position: {index + 1} of {cards.length}</p>
						</div>
					</div>
				{/snippet}
				
				{#snippet empty()}
					<div class="empty-content">
						<h2>All Done! 🎉</h2>
						<p>You swiped all the cards</p>
						<button class="reset-button" onclick={resetCards}>
							Reset Cards
						</button>
					</div>
				{/snippet}
			</SwipeCardStack>
		</div>
		
		<div class="info-panel">
			<h3>Info</h3>
			<p><strong>Cards remaining:</strong> {cards.length}</p>
			<p><strong>Threshold:</strong> 100px</p>
			<p><strong>Visible cards:</strong> 3</p>
			
			<button class="reset-button" onclick={resetCards} disabled={cards.length === 6}>
				Reset Cards
			</button>
			
			{#if swipeHistory.length > 0}
				<div class="history">
					<h4>Swipe History:</h4>
					<div class="history-list">
						{#each swipeHistory.slice(-5).reverse() as entry}
							<div class="history-item">
								<span class="history-direction {entry.direction === 'left' ? 'left' : 'right'}">
									{entry.direction === 'left' ? '←' : '→'}
								</span>
								<span class="history-card">{entry.card.title}</span>
								<span class="history-time">{entry.time}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.demo-container {
		min-height: 100vh;
		padding: 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
	
	.title {
		font-size: 2.5rem;
		font-weight: bold;
		color: white;
		text-align: center;
		margin-bottom: 0.5rem;
	}
	
	.subtitle {
		font-size: 1.125rem;
		color: rgba(255, 255, 255, 0.9);
		text-align: center;
		margin-bottom: 2rem;
	}
	
	.content {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}
	
	@media (max-width: 768px) {
		.content {
			grid-template-columns: 1fr;
		}
	}
	
	.card-stack-wrapper {
		height: 600px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 1rem;
	}
	
	.demo-card {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 1rem;
		color: white;
	}
	
	.card-content {
		text-align: center;
		padding: 2rem;
	}
	
	.card-title {
		font-size: 3rem;
		font-weight: bold;
		margin-bottom: 1rem;
	}
	
	.card-description {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		opacity: 0.9;
	}
	
	.card-index {
		font-size: 1rem;
		opacity: 0.7;
	}
	
	.empty-content {
		text-align: center;
		color: white;
	}
	
	.empty-content h2 {
		font-size: 2rem;
		margin-bottom: 1rem;
	}
	
	.empty-content p {
		font-size: 1.25rem;
		margin-bottom: 2rem;
		opacity: 0.9;
	}
	
	.info-panel {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 1rem;
		padding: 1.5rem;
		height: fit-content;
	}
	
	.info-panel h3 {
		font-size: 1.5rem;
		font-weight: bold;
		margin-bottom: 1rem;
		color: #333;
	}
	
	.info-panel p {
		margin-bottom: 0.5rem;
		color: #666;
	}
	
	.reset-button {
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
	}
	
	.reset-button:hover:not(:disabled) {
		background: #5568d3;
		transform: translateY(-2px);
	}
	
	.reset-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.history {
		margin-top: 2rem;
		border-top: 1px solid #e0e0e0;
		padding-top: 1rem;
	}
	
	.history h4 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: #333;
	}
	
	.history-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.history-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		padding: 0.5rem;
		background: #f5f5f5;
		border-radius: 0.25rem;
	}
	
	.history-direction {
		font-size: 1.25rem;
		font-weight: bold;
		width: 1.5rem;
		text-align: center;
	}
	
	.history-direction.left {
		color: #ef4444;
	}
	
	.history-direction.right {
		color: #10b981;
	}
	
	.history-card {
		flex: 1;
		color: #333;
		font-weight: 500;
	}
	
	.history-time {
		color: #999;
		font-size: 0.75rem;
	}
</style>

