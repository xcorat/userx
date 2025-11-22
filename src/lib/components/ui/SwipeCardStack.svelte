<script lang="ts">
	/**
	 * SwipeCardStack - A smooth, swipeable card stack component
	 * Cards float away to reveal the next card below with smooth animations
	 */
	
import { onMount } from 'svelte';
import { gesture, type GestureContext } from '$lib/actions/gesture';
import { getInteractiveAncestor } from '$lib/utils/gesture';
	
	interface Props<T = any> {
		cards: T[];
		onSwipeLeft?: (card: T, index: number) => void;
		onSwipeRight?: (card: T, index: number) => void;
		onCardsEmpty?: () => void;
		swipeThreshold?: number;
		maxVisibleCards?: number;
		cardScaleOffset?: number;
		cardYOffset?: number;
		cardOpacityStep?: number;
		className?: string;
		disabled?: boolean;
		children: any;
		empty?: any;
	}
	
	let {
		cards = $bindable([]),
		onSwipeLeft,
		onSwipeRight,
		onCardsEmpty,
		swipeThreshold = 100,
		maxVisibleCards = 3,
		cardScaleOffset = 0.05,
		cardYOffset = 10,
		cardOpacityStep = 0.2,
		className = '',
		disabled = false,
		children,
		empty
	}: Props = $props();
	
	type DragState = 'idle' | 'dragging' | 'swiping' | 'swiped';
	
	let dragState = $state<DragState>('idle');
	let dragOffset = $state({ x: 0, y: 0 });
	let startPos = { x: 0, y: 0 };
	let topCardElement = $state<HTMLElement | null>(null);
	let removingState = $state<{ direction: 'left' | 'right'; x: number; y: number } | null>(null);
	
	// Computed values
	let isDragging = $derived(dragState === 'dragging');
	let isSwiping = $derived(dragState === 'swiping');
	let currentCard = $derived(cards[0] || null);
	let visibleCards = $derived(cards.slice(0, maxVisibleCards));
	
	// Calculate the transform for the top card during drag or removal
	function getTopCardTransform(): string {
		if (removingState) {
			const direction = removingState.direction === 'right' ? 1 : -1;
			// Continue from current position to off-screen
			// Add enough distance to ensure card exits screen completely
			const additionalDistance = Math.max(500, 500 - Math.abs(removingState.x));
			const finalX = removingState.x + direction * additionalDistance;
			const finalY = removingState.y + Math.abs(additionalDistance) * 0.2;
			const rotation = direction * 30;
			return `translate(${finalX}px, ${finalY}px) rotate(${rotation}deg)`;
		}
		
		if (isDragging) {
			const rotation = dragOffset.x / 20;
			return `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`;
		}
		
		return 'translate(0px, 0px) rotate(0deg)';
	}
	
	// Calculate the transform for background cards with animation on swipe
	function getBackgroundCardTransform(index: number): { transform: string; opacity: number } {
		// Calculate progress based on drag distance or removal state
		let progress = 0;
		
		if (removingState) {
			progress = 1; // Full transition when removing
		} else if (isDragging && Math.abs(dragOffset.x) > 0) {
			// Progress increases as the card is dragged
			progress = Math.min(Math.abs(dragOffset.x) / 150, 1);
		}
		
		// Current position
		const currentScale = 1 - index * cardScaleOffset;
		const currentY = index * cardYOffset;
		const currentOpacity = 1 - index * cardOpacityStep;
		
		// Target position (one level up)
		const targetScale = 1 - (index - 1) * cardScaleOffset;
		const targetY = (index - 1) * cardYOffset;
		const targetOpacity = 1 - (index - 1) * cardOpacityStep;
		
		// Interpolate between current and target
		const scale = currentScale + (targetScale - currentScale) * progress;
		const y = currentY + (targetY - currentY) * progress;
		const opacity = currentOpacity + (targetOpacity - currentOpacity) * progress;
		
		return {
			transform: `scale(${scale}) translateY(${y}px)`,
			opacity: Math.max(0, opacity)
		};
	}
	
	// Get top card opacity during removal
	function getTopCardOpacity(): number {
		// Opacity is handled by CSS transition now, so it fades smoothly
		// When removingState is set, CSS will transition from 1 to 0
		if (removingState) return 0;
		return 1;
	}
	
	// Swipe indicators opacity
	let leftIndicatorOpacity = $derived(() => {
		if (!isDragging) return 0;
		return Math.max(0, -dragOffset.x / 100);
	});
	
	let rightIndicatorOpacity = $derived(() => {
		if (!isDragging) return 0;
		return Math.max(0, dragOffset.x / 100);
	});
	
	// Event handlers
	function handleStart(ctx: GestureContext) {
		if (disabled || !currentCard) return;

		// If pointer started on an interactive element, bail out
		const matchedInteractive = getInteractiveAncestor(ctx.event.target as Element | null);
		if (matchedInteractive && matchedInteractive !== (ctx.event.currentTarget as HTMLElement)) {
			return;
		}

		dragState = 'dragging';
		startPos = { x: ctx.x, y: ctx.y };
		dragOffset = { x: 0, y: 0 };
	}
	
	function handleMove(ctx: GestureContext) {
		if (!isDragging) return;

		dragOffset = {
			x: ctx.dx,
			y: ctx.dy
		};
	}
	
	function handleEnd(ctx: GestureContext) {
		if (!isDragging) return;
		finalizeDrag();
	}
	
	function finalizeDrag() {
		if (!isDragging) return;
		
		// Check if threshold was exceeded
		if (Math.abs(dragOffset.x) > swipeThreshold) {
			performSwipe(dragOffset.x > 0 ? 'right' : 'left');
		} else {
			// Snap back
			dragState = 'idle';
			dragOffset = { x: 0, y: 0 };
		}
	}
	
	function performSwipe(direction: 'left' | 'right') {
		if (!currentCard) return;
		
		dragState = 'swiping';
		removingState = { direction, x: dragOffset.x, y: dragOffset.y };
		
		const cardToRemove = currentCard;
		const indexToRemove = 0;
		
		// Wait for animation to complete before removing card
		setTimeout(() => {
			// Call the appropriate callback
			if (direction === 'right') {
				onSwipeRight?.(cardToRemove, indexToRemove);
			} else {
				onSwipeLeft?.(cardToRemove, indexToRemove);
			}
			
			// Remove card from array BEFORE resetting removingState
			cards = cards.slice(1);
			
			// Reset state
			removingState = null;
			dragState = 'idle';
			dragOffset = { x: 0, y: 0 };
			
			// Check if we're out of cards
			if (cards.length === 0) {
				onCardsEmpty?.();
			}
		}, 300);
	}
	
	// Programmatic swipe functions
	export function swipeLeft() {
		if (disabled || !currentCard || dragState !== 'idle') return;
		dragOffset = { x: -200, y: 0 };
		performSwipe('left');
	}
	
	export function swipeRight() {
		if (disabled || !currentCard || dragState !== 'idle') return;
		dragOffset = { x: 200, y: 0 };
		performSwipe('right');
	}
	
	export function reset(newCards: any[]) {
		cards = newCards;
		dragState = 'idle';
		dragOffset = { x: 0, y: 0 };
		removingState = null;
	}
</script>

<div class={`swipe-card-stack ${className}`}>
	{#if cards.length === 0}
		<div class="empty-state">
			{#if empty}
				{@render empty()}
			{:else}
				<p class="empty-message">No more cards</p>
			{/if}
		</div>
	{:else}
		<div class="card-container">
			{#each visibleCards as card, index (card.id || index)}
				{@const isTopCard = index === 0}
				{@const bgTransform = getBackgroundCardTransform(index)}
				
				{#if isTopCard}
					<!-- Top card - interactive -->
					<div
						bind:this={topCardElement}
						class="card top-card"
						style={`
							transform: ${getTopCardTransform()};
							opacity: ${getTopCardOpacity()};
							transition: ${isDragging ? 'none' : removingState ? 'all 0.3s ease-out' : 'all 0.3s ease-out'};
							z-index: ${cards.length - index};
							cursor: ${isDragging ? 'grabbing' : 'grab'};
						`}
						use:gesture={{ onStart: handleStart, onMove: handleMove, onEnd: handleEnd, onCancel: handleEnd, interactiveSelector: 'button, a, input, textarea, select, [role="button"], [data-interactive="true"], [data-no-drag]' }}
						role="button"
						tabindex={disabled ? -1 : 0}
					>
						{@render children(card, index)}
						
						<!-- Swipe indicators -->
						{#if isDragging}
							<div
								class="swipe-indicator left-indicator"
								style={`opacity: ${leftIndicatorOpacity()};`}
							>
								<span class="indicator-text">NOPE</span>
							</div>
							<div
								class="swipe-indicator right-indicator"
								style={`opacity: ${rightIndicatorOpacity()};`}
							>
								<span class="indicator-text">LIKE</span>
							</div>
						{/if}
					</div>
				{:else}
					<!-- Background cards - static with animated transform -->
					<div
						class="card background-card"
						style={`
							transform: ${bgTransform.transform};
							opacity: ${bgTransform.opacity};
							z-index: ${cards.length - index};
							transition: transform 0.3s ease-out, opacity 0.3s ease-out;
							pointer-events: none;
						`}
					>
						{@render children(card, index)}
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.swipe-card-stack {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}
	
	.empty-message {
		color: rgba(255, 255, 255, 0.6);
		font-size: 1.25rem;
		text-align: center;
	}
	
	.card-container {
		position: relative;
		width: 100%;
		height: 100%;
	}
	
	.card {
		position: absolute;
		inset: 0;
		border-radius: 0;
		background: white;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		user-select: none;
		touch-action: none;
		overflow: hidden;
	}
	
	.top-card {
		cursor: grab;
	}
	
	.top-card:active {
		cursor: grabbing;
	}
	
	.background-card {
		pointer-events: none;
	}
	
	/* Swipe indicators */
	.swipe-indicator {
		position: absolute;
		top: 10%;
		font-weight: bold;
		font-size: 4rem;
		opacity: 0;
		transition: opacity 100ms ease;
		pointer-events: none;
		z-index: 10;
		text-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
	}
	
	.left-indicator {
		right: 10%;
		color: #ef4444;
		transform: rotate(12deg);
	}
	
	.right-indicator {
		left: 10%;
		color: #10b981;
		transform: rotate(-12deg);
	}
	
	.indicator-text {
		display: block;
		letter-spacing: 0.15em;
		-webkit-text-stroke: 2px currentColor;
		-webkit-text-fill-color: transparent;
		font-weight: 900;
	}
	
	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.swipe-indicator {
			font-size: 3rem;
		}
	}

	/* Ensure interactive elements work correctly */
	:global(.swipe-card-stack button),
	:global(.swipe-card-stack a),
	:global(.swipe-card-stack input),
	:global(.swipe-card-stack textarea),
	:global(.swipe-card-stack select),
	:global(.swipe-card-stack [role="button"]),
	:global(.swipe-card-stack [data-no-drag]) {
		touch-action: auto;
		user-select: text;
		cursor: auto;
		pointer-events: auto;
	}
</style>
