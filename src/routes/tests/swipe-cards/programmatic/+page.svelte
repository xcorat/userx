<script lang="ts">
	import SwipeCardStack from '$lib/components/ui/SwipeCardStack.svelte';
	import { X, Heart, RotateCcw } from 'lucide-svelte';
	
	let swipeStack: any;
	
	let cards = $state([
		{ id: 1, title: 'Card 1', emoji: '🎨', color: 'bg-gradient-to-br from-purple-400 to-purple-600' },
		{ id: 2, title: 'Card 2', emoji: '🚀', color: 'bg-gradient-to-br from-blue-400 to-blue-600' },
		{ id: 3, title: 'Card 3', emoji: '🌟', color: 'bg-gradient-to-br from-yellow-400 to-yellow-600' },
		{ id: 4, title: 'Card 4', emoji: '🎮', color: 'bg-gradient-to-br from-green-400 to-green-600' },
		{ id: 5, title: 'Card 5', emoji: '🎭', color: 'bg-gradient-to-br from-pink-400 to-pink-600' },
		{ id: 6, title: 'Card 6', emoji: '🎪', color: 'bg-gradient-to-br from-red-400 to-red-600' }
	]);
	
	let actions = $state<Array<{ type: string; card?: any; time: string }>>([]);
	
	function logAction(type: string, card?: any) {
		actions = [{ type, card, time: new Date().toLocaleTimeString() }, ...actions].slice(0, 15);
	}
	
	function handleSwipeLeft(card: any) {
		logAction('Swiped LEFT (gesture)', card);
	}
	
	function handleSwipeRight(card: any) {
		logAction('Swiped RIGHT (gesture)', card);
	}
	
	function handleCardsEmpty() {
		logAction('Cards empty');
	}
	
	function programmaticSwipeLeft() {
		const currentCard = cards[0];
		swipeStack?.swipeLeft();
		if (currentCard) {
			logAction('Swiped LEFT (programmatic)', currentCard);
		}
	}
	
	function programmaticSwipeRight() {
		const currentCard = cards[0];
		swipeStack?.swipeRight();
		if (currentCard) {
			logAction('Swiped RIGHT (programmatic)', currentCard);
		}
	}
	
	function resetCards() {
		const newCards = [
			{ id: Date.now() + 1, title: 'Card 1', emoji: '🎨', color: 'bg-gradient-to-br from-purple-400 to-purple-600' },
			{ id: Date.now() + 2, title: 'Card 2', emoji: '🚀', color: 'bg-gradient-to-br from-blue-400 to-blue-600' },
			{ id: Date.now() + 3, title: 'Card 3', emoji: '🌟', color: 'bg-gradient-to-br from-yellow-400 to-yellow-600' },
			{ id: Date.now() + 4, title: 'Card 4', emoji: '🎮', color: 'bg-gradient-to-br from-green-400 to-green-600' },
			{ id: Date.now() + 5, title: 'Card 5', emoji: '🎭', color: 'bg-gradient-to-br from-pink-400 to-pink-600' },
			{ id: Date.now() + 6, title: 'Card 6', emoji: '🎪', color: 'bg-gradient-to-br from-red-400 to-red-600' }
		];
		swipeStack?.reset(newCards);
		cards = newCards;
		logAction('Reset cards');
	}
</script>

<svelte:head>
	<title>Programmatic Control Demo - Swipe Cards</title>
</svelte:head>

<div class="demo-container">
	<h1 class="title">Programmatic Control Demo</h1>
	<p class="subtitle">Use buttons to control card swipes programmatically</p>
	
	<div class="content">
		<div class="main-area">
			<div class="card-stack-wrapper">
				<SwipeCardStack
					bind:this={swipeStack}
					bind:cards
					onSwipeLeft={handleSwipeLeft}
					onSwipeRight={handleSwipeRight}
					onCardsEmpty={handleCardsEmpty}
					swipeThreshold={100}
				>
					{#snippet children(card)}
						<div class="demo-card {card.color}">
							<div class="card-content">
								<div class="card-emoji">{card.emoji}</div>
								<h2 class="card-title">{card.title}</h2>
								<p class="card-info">Swipe or use buttons below</p>
							</div>
						</div>
					{/snippet}
					
					{#snippet empty()}
						<div class="empty-content">
							<div class="empty-emoji">🎉</div>
							<h2>All Done!</h2>
							<p>Click reset to start over</p>
						</div>
					{/snippet}
				</SwipeCardStack>
			</div>
			
			<div class="controls">
				<button
					class="control-button reject"
					onclick={programmaticSwipeLeft}
					disabled={cards.length === 0}
					title="Swipe left programmatically"
				>
					<X size={32} />
					<span>Reject</span>
				</button>
				
				<button
					class="control-button reset"
					onclick={resetCards}
					title="Reset all cards"
				>
					<RotateCcw size={28} />
					<span>Reset</span>
				</button>
				
				<button
					class="control-button accept"
					onclick={programmaticSwipeRight}
					disabled={cards.length === 0}
					title="Swipe right programmatically"
				>
					<Heart size={32} />
					<span>Accept</span>
				</button>
			</div>
			
			<div class="info-box">
				<p><strong>Cards remaining:</strong> {cards.length}</p>
				<p><strong>Methods:</strong> swipeLeft(), swipeRight(), reset()</p>
			</div>
		</div>
		
		<div class="side-panel">
			<h3>Action Log</h3>
			<p class="panel-description">
				Track both programmatic and gesture-based swipes
			</p>
			
			{#if actions.length > 0}
				<div class="action-log">
					{#each actions as action}
						<div class="action-item">
							<span class="action-type">
								{#if action.type.includes('LEFT')}
									<span class="action-icon left">←</span>
								{:else if action.type.includes('RIGHT')}
									<span class="action-icon right">→</span>
								{:else if action.type.includes('Reset')}
									<span class="action-icon reset">↻</span>
								{:else}
									<span class="action-icon">•</span>
								{/if}
							</span>
							<div class="action-details">
								<div class="action-text">{action.type}</div>
								{#if action.card}
									<div class="action-card">{action.card.emoji} {action.card.title}</div>
								{/if}
								<div class="action-time">{action.time}</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="no-actions">No actions yet. Try swiping cards or using the buttons!</p>
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
		grid-template-columns: 1fr 350px;
		gap: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}
	
	@media (max-width: 768px) {
		.content {
			grid-template-columns: 1fr;
		}
	}
	
	.main-area {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.card-stack-wrapper {
		height: 500px;
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
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	}
	
	.card-content {
		text-align: center;
		padding: 2rem;
	}
	
	.card-emoji {
		font-size: 6rem;
		margin-bottom: 1rem;
	}
	
	.card-title {
		font-size: 2.5rem;
		font-weight: bold;
		margin-bottom: 0.5rem;
	}
	
	.card-info {
		font-size: 1.125rem;
		opacity: 0.9;
	}
	
	.empty-content {
		text-align: center;
		color: white;
	}
	
	.empty-emoji {
		font-size: 5rem;
		margin-bottom: 1rem;
	}
	
	.empty-content h2 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}
	
	.empty-content p {
		font-size: 1.125rem;
		opacity: 0.9;
	}
	
	.controls {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
	}
	
	.control-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem 2rem;
		border: none;
		border-radius: 1rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		color: white;
		min-width: 120px;
	}
	
	.control-button.reject {
		background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
	}
	
	.control-button.accept {
		background: linear-gradient(135deg, #51cf66, #37b24d);
	}
	
	.control-button.reset {
		background: linear-gradient(135deg, #4dabf7, #339af0);
	}
	
	.control-button:hover:not(:disabled) {
		transform: translateY(-4px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
	}
	
	.control-button:active:not(:disabled) {
		transform: translateY(-2px);
	}
	
	.control-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.info-box {
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 1rem;
		text-align: center;
	}
	
	.info-box p {
		margin-bottom: 0.5rem;
		color: #666;
	}
	
	.info-box p:last-child {
		margin-bottom: 0;
	}
	
	.side-panel {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 1rem;
		padding: 1.5rem;
		height: fit-content;
		max-height: calc(100vh - 4rem);
		display: flex;
		flex-direction: column;
	}
	
	.side-panel h3 {
		font-size: 1.5rem;
		font-weight: bold;
		margin-bottom: 0.5rem;
		color: #333;
	}
	
	.panel-description {
		color: #666;
		font-size: 0.875rem;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e0e0e0;
	}
	
	.action-log {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		overflow-y: auto;
		flex: 1;
	}
	
	.action-item {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 0.5rem;
		border-left: 3px solid #667eea;
	}
	
	.action-type {
		flex-shrink: 0;
	}
	
	.action-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		font-size: 1.25rem;
		font-weight: bold;
	}
	
	.action-icon.left {
		background: #ffe0e0;
		color: #ef4444;
	}
	
	.action-icon.right {
		background: #d0f0e0;
		color: #10b981;
	}
	
	.action-icon.reset {
		background: #dbe4ff;
		color: #4dabf7;
	}
	
	.action-details {
		flex: 1;
	}
	
	.action-text {
		font-weight: 600;
		color: #333;
		margin-bottom: 0.25rem;
		font-size: 0.875rem;
	}
	
	.action-card {
		color: #666;
		font-size: 0.875rem;
		margin-bottom: 0.25rem;
	}
	
	.action-time {
		color: #999;
		font-size: 0.75rem;
	}
	
	.no-actions {
		padding: 3rem 1rem;
		text-align: center;
		color: #999;
		font-style: italic;
	}
</style>

