<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';

	interface Props {
		data?: any;
		onSwipeLeft: (data: any) => void;
		onSwipeRight: (data: any) => void;
		swipeThreshold?: number;
		maxRotation?: number;
		snapBackDuration?: number;
		className?: string;
		disabled?: boolean;
		onDragStart?: () => void;
		onDragEnd?: () => void;
		children?: any;
	}

	let {
		data = null,
		onSwipeLeft,
		onSwipeRight,
		swipeThreshold = 120,
		maxRotation = 15,
		snapBackDuration = 300,
		className = '',
		disabled = false,
		onDragStart,
		onDragEnd,
		children
	}: Props = $props();

	type DragState = 'idle' | 'dragging' | 'swiping';

	let dragState = $state<DragState>('idle');
	let dragOffset = $state({ x: 0, y: 0 });
	let isDragging = $state(false);
	let pointerId = $state<number | null>(null);
	let originPos = { x: 0, y: 0 };
	let cardElement = $state<HTMLElement | null>(null);

	// Derived component state instead of classes
	let isDraggingState = $derived(dragState === 'dragging');
	let isDisabledState = $derived(disabled);
	let isSwiping = $derived(dragState === 'swiping');

	// Derived values for visual feedback
	let rotation = $derived(() => {
		const maxScreenWidth = 400;
		return Math.min(Math.max((dragOffset.x / maxScreenWidth) * maxRotation, -maxRotation), maxRotation);
	});

	// Make indicators appear earlier and more prominently
	let indicatorOpacity = $derived(() => {
		const threshold = swipeThreshold * 0.3; // Appear at 30% of threshold instead of 100%
		return Math.min(Math.abs(dragOffset.x) / threshold, 1);
	});

	let leftIndicatorOpacity = $derived(() => {
		return dragOffset.x < 0 ? indicatorOpacity() : 0;
	});

	let rightIndicatorOpacity = $derived(() => {
		return dragOffset.x > 0 ? indicatorOpacity() : 0;
	});

	// Enhanced scale effect for bigger appearance
	let leftIndicatorScale = $derived(() => {
		return 0.6 + leftIndicatorOpacity() * 0.8; // Scale from 0.6 to 1.4
	});

	let rightIndicatorScale = $derived(() => {
		return 0.6 + rightIndicatorOpacity() * 0.8; // Scale from 0.6 to 1.4
	});

	let cardTransform = $derived(() => {
		if (isSwiping) return '';
		const verticalLift = Math.min(Math.abs(dragOffset.x) * 0.02, 10);
		return `translate3d(${dragOffset.x}px, ${dragOffset.y - verticalLift}px, 0) rotate(${rotation()}deg)`;
	});

	function handlePointerDown(event: PointerEvent) {
		if (disabled || isDragging) return;
		
		event.preventDefault();
		const target = event.currentTarget as HTMLElement;
		pointerId = event.pointerId;
		target.setPointerCapture(pointerId);
		
		dragState = 'dragging';
		isDragging = true;
		originPos = { x: event.clientX, y: event.clientY };
		dragOffset = { x: 0, y: 0 };
		
		onDragStart?.();
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isDragging || pointerId !== event.pointerId) return;
		
		dragOffset = {
			x: event.clientX - originPos.x,
			y: event.clientY - originPos.y
		};
	}

	function handlePointerUp(event: PointerEvent) {
		if (!isDragging || pointerId !== event.pointerId) return;
		
		const target = event.currentTarget as HTMLElement;
		target.releasePointerCapture(pointerId);
		pointerId = null;
		
		finalizeDrag();
	}

	function handlePointerCancel() {
		pointerId = null;
		resetDrag();
	}

	function finalizeDrag() {
		if (!isDragging) return;
		
		isDragging = false;
		onDragEnd?.();
		
		// Check if threshold was exceeded
		if (Math.abs(dragOffset.x) >= swipeThreshold) {
			performSwipe(dragOffset.x > 0 ? 'right' : 'left');
		} else {
			snapBack();
		}
	}

	function performSwipe(direction: 'left' | 'right') {
		dragState = 'swiping';
		
		// Animate off-screen
		if (cardElement) {
			const exitDistance = window.innerWidth + 100;
			const exitX = direction === 'right' ? exitDistance : -exitDistance;
			const finalRotation = direction === 'right' ? maxRotation * 1.5 : -maxRotation * 1.5;
			
			cardElement.style.transition = `transform 300ms ease-out`;
			cardElement.style.transform = `translate3d(${exitX}px, ${dragOffset.y}px, 0) rotate(${finalRotation}deg)`;
			
			// Fire callback after animation starts
			setTimeout(() => {
				if (direction === 'right') {
					onSwipeRight(data);
				} else {
					onSwipeLeft(data);
				}
			}, 150);
		}
	}

	function snapBack() {
		if (cardElement) {
			cardElement.style.transition = `transform ${snapBackDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
			cardElement.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';
			
			setTimeout(() => {
				resetDrag();
			}, snapBackDuration);
		} else {
			resetDrag();
		}
	}

	function resetDrag() {
		dragState = 'idle';
		dragOffset = { x: 0, y: 0 };
		
		if (cardElement) {
			cardElement.style.transition = '';
			cardElement.style.transform = '';
		}
	}
</script>

<Card.Root
	bind:ref={cardElement}
	class={`swipe-card ${className} ${isDraggingState ? 'dragging' : ''} ${isDisabledState ? 'disabled' : ''}`}
	style={!isSwiping ? `transform: ${cardTransform()}; will-change: transform;` : ''}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerCancel}
	role="button"
	tabindex={isDisabledState ? -1 : 0}
	aria-label="Swipeable card. Drag left to reject, right to accept."
>
	<!-- Left Arrow Indicator (No/Reject) -->
	<div 
		class="indicator left-indicator"
		style={`opacity: ${leftIndicatorOpacity()}; transform: translate(-50%, -50%) scale(${leftIndicatorScale()});`}
	>
		<ChevronLeft size={64} class="arrow-icon reject" />
		<span class="indicator-text reject">NO</span>
	</div>
	
	<!-- Right Arrow Indicator (Yes/Accept) -->
	<div 
		class="indicator right-indicator"
		style={`opacity: ${rightIndicatorOpacity()}; transform: translate(50%, -50%) scale(${rightIndicatorScale()});`}
	>
		<ChevronRight size={64} class="arrow-icon accept" />
		<span class="indicator-text accept">YES</span>
	</div>
	
	<!-- Card Content -->
	<Card.Content class="card-content">
		{@render children?.()}
	</Card.Content>
</Card.Root>

<style>
	:global(.swipe-card) {
		position: relative;
		width: 100%;
		height: 100%;
		cursor: grab;
		touch-action: none;
		user-select: none;
		/* Override shadcn defaults for swipe functionality */
		border-radius: 16px !important;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
		overflow: hidden;
		padding: 0 !important; /* Remove default padding to allow custom content */
		gap: 0 !important; /* Remove default gap */
	}
	
	:global(.swipe-card.dragging) {
		cursor: grabbing;
	}
	
	:global(.swipe-card.disabled) {
		cursor: default;
		pointer-events: none;
	}
	
	.indicator {
		position: absolute;
		top: 50%;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		opacity: 0;
		transition: opacity 100ms ease;
		pointer-events: none;
	}
	
	.left-indicator {
		left: 50%;
		transform: translate(-50%, -50%);
	}
	
	.right-indicator {
		right: 50%;
		transform: translate(50%, -50%);
	}
	
	:global(.arrow-icon) {
		filter: drop-shadow(0 3px 12px rgba(0, 0, 0, 0.4));
	}
	
	:global(.arrow-icon.accept) {
		color: #10b981; /* green-500 */
	}
	
	:global(.arrow-icon.reject) {
		color: #ef4444; /* red-500 */
	}
	
	:global(.indicator-text) {
		font-weight: bold;
		font-size: 2rem;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		filter: drop-shadow(0 3px 12px rgba(0, 0, 0, 0.6));
	}
	
	:global(.indicator-text.accept) {
		color: #10b981; /* green-500 */
	}
	
	:global(.indicator-text.reject) {
		color: #ef4444; /* red-500 */
	}
	
	:global(.swipe-card .card-content) {
		width: 100%;
		height: 100%;
		position: relative;
		z-index: 1;
		padding: 2rem; /* Add back content padding */
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	
	/* Keyboard accessibility */
	:global(.swipe-card:focus-visible) {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
</style>