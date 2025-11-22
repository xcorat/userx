<script lang="ts">
	import SwipeCardStack from '$lib/components/ui/SwipeCardStack.svelte';
	
	let cards = $state([
		{ id: 1, title: 'Card with Button', color: 'bg-blue-500' },
		{ id: 2, title: 'Card with Link', color: 'bg-green-500' },
		{ id: 3, title: 'Card with Input', color: 'bg-purple-500' },
		{ id: 4, title: 'Card with Multiple Elements', color: 'bg-red-500' }
	]);
	
	let interactions = $state<string[]>([]);
	let inputValues = $state<Record<number, string>>({});
	
	function handleSwipeLeft(card: any) {
		interactions = [`Swiped LEFT: ${card.title}`, ...interactions].slice(0, 10);
	}
	
	function handleSwipeRight(card: any) {
		interactions = [`Swiped RIGHT: ${card.title}`, ...interactions].slice(0, 10);
	}
	
	function handleButtonClick(card: any, event: Event) {
		event.stopPropagation();
		interactions = [`Button clicked in: ${card.title}`, ...interactions].slice(0, 10);
	}
	
	function handleLinkClick(card: any, event: Event) {
		event.preventDefault();
		interactions = [`Link clicked in: ${card.title}`, ...interactions].slice(0, 10);
	}
	
	function handleInputChange(cardId: number, value: string) {
		inputValues[cardId] = value;
		interactions = [`Input changed in card ${cardId}: "${value}"`, ...interactions].slice(0, 10);
	}
	
	function resetDemo() {
		cards = [
			{ id: 1, title: 'Card with Button', color: 'bg-blue-500' },
			{ id: 2, title: 'Card with Link', color: 'bg-green-500' },
			{ id: 3, title: 'Card with Input', color: 'bg-purple-500' },
			{ id: 4, title: 'Card with Multiple Elements', color: 'bg-red-500' }
		];
		interactions = [];
		inputValues = {};
	}
</script>

<svelte:head>
	<title>Interactive Elements Demo - Swipe Cards</title>
</svelte:head>

<div class="demo-container">
	<h1 class="title">Interactive Elements Demo</h1>
	<p class="subtitle">Interactive elements like buttons, links, and inputs work normally without triggering drag</p>
	
	<div class="content">
		<div class="card-stack-wrapper">
			<SwipeCardStack
				bind:cards
				onSwipeLeft={handleSwipeLeft}
				onSwipeRight={handleSwipeRight}
				swipeThreshold={120}
			>
				{#snippet children(card, index)}
					<div class="demo-card {card.color}">
						<div class="card-content">
							<h2 class="card-title">{card.title}</h2>
							
							{#if card.id === 1}
								<p class="description">Try clicking this button - it won't start a drag!</p>
								<button
									class="interactive-button"
									onclick={(e) => handleButtonClick(card, e)}
								>
									Click Me!
								</button>
								<p class="hint">💡 Drag from empty space to swipe</p>
							{/if}
							
							{#if card.id === 2}
								<p class="description">This link is clickable without dragging:</p>
								<a
									href="#"
									class="interactive-link"
									onclick={(e) => handleLinkClick(card, e)}
								>
									Click this link
								</a>
								<p class="hint">💡 Links don't trigger swipe</p>
							{/if}
							
							{#if card.id === 3}
								<p class="description">Type in this input:</p>
								<input
									type="text"
									class="interactive-input"
									placeholder="Type something..."
									value={inputValues[card.id] || ''}
									oninput={(e) => handleInputChange(card.id, e.currentTarget.value)}
								/>
								<p class="hint">💡 Inputs remain fully functional</p>
							{/if}
							
							{#if card.id === 4}
								<p class="description">Multiple interactive elements:</p>
								<div class="button-group">
									<button
										class="small-button"
										onclick={(e) => handleButtonClick(card, e)}
									>
										Button 1
									</button>
									<button
										class="small-button"
										onclick={(e) => handleButtonClick(card, e)}
									>
										Button 2
									</button>
								</div>
								<input
									type="text"
									class="interactive-input"
									placeholder="Input field"
									value={inputValues[card.id] || ''}
									oninput={(e) => handleInputChange(card.id, e.currentTarget.value)}
								/>
								<p class="hint">💡 All elements work independently</p>
							{/if}
							
							<p class="card-number">Card {index + 1}/{cards.length}</p>
						</div>
					</div>
				{/snippet}
			</SwipeCardStack>
		</div>
		
		<div class="info-panel">
			<h3>Interaction Log</h3>
			<p class="info-text">
				Interactive elements (buttons, links, inputs) should work normally without starting a drag.
				Drag from the background to swipe cards.
			</p>
			
			<button class="reset-button" onclick={resetDemo}>
				Reset Demo
			</button>
			
			{#if interactions.length > 0}
				<div class="interaction-log">
					{#each interactions as interaction}
						<div class="log-item">{interaction}</div>
					{/each}
				</div>
			{:else}
				<p class="no-interactions">No interactions yet. Try clicking buttons or swiping cards!</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.demo-container {
		min-height: 100vh;
		padding: 2rem;
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
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
		width: 100%;
		max-width: 400px;
	}
	
	.card-title {
		font-size: 2rem;
		font-weight: bold;
		margin-bottom: 1.5rem;
	}
	
	.description {
		font-size: 1.125rem;
		margin-bottom: 1.5rem;
		opacity: 0.95;
	}
	
	.interactive-button {
		padding: 1rem 2rem;
		background: white;
		color: #333;
		border: none;
		border-radius: 0.5rem;
		font-size: 1.125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		margin-bottom: 1rem;
	}
	
	.interactive-button:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}
	
	.interactive-link {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.2);
		color: white;
		text-decoration: none;
		border-radius: 0.5rem;
		font-size: 1.125rem;
		font-weight: 600;
		border: 2px solid white;
		transition: all 0.2s;
		margin-bottom: 1rem;
	}
	
	.interactive-link:hover {
		background: white;
		color: #f5576c;
	}
	
	.interactive-input {
		padding: 0.75rem 1rem;
		background: white;
		color: #333;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		width: 100%;
		max-width: 300px;
		margin-bottom: 1rem;
	}
	
	.interactive-input::placeholder {
		color: #999;
	}
	
	.button-group {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-bottom: 1rem;
	}
	
	.small-button {
		padding: 0.75rem 1.5rem;
		background: white;
		color: #333;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.small-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}
	
	.hint {
		font-size: 0.875rem;
		opacity: 0.8;
		margin-top: 1rem;
	}
	
	.card-number {
		margin-top: 1.5rem;
		font-size: 0.875rem;
		opacity: 0.7;
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
		margin-bottom: 0.75rem;
		color: #333;
	}
	
	.info-text {
		color: #666;
		font-size: 0.875rem;
		line-height: 1.5;
		margin-bottom: 1rem;
	}
	
	.reset-button {
		padding: 0.75rem 1.5rem;
		background: #f5576c;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
		margin-bottom: 1rem;
	}
	
	.reset-button:hover {
		background: #e04858;
		transform: translateY(-2px);
	}
	
	.interaction-log {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 400px;
		overflow-y: auto;
	}
	
	.log-item {
		padding: 0.75rem;
		background: #f5f5f5;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: #333;
		border-left: 3px solid #f5576c;
	}
	
	.no-interactions {
		padding: 2rem;
		text-align: center;
		color: #999;
		font-style: italic;
	}
</style>

