/**
 * Pointer-based swipe/drag action for Svelte 5.
 * Handles mouse, touch, and stylus uniformly via the Pointer Events API.
 */

export interface SwipeDelta {
	dx: number;
	dy: number;
}

export interface SwipeConfig {
	disabled?: boolean;
	interactiveSelector?: string;
	onStart?: () => void;
	onMove?: (delta: SwipeDelta) => void;
	onEnd?: (delta: SwipeDelta) => void;
}

const DEFAULT_INTERACTIVE_SELECTOR =
	'button, a, input, textarea, select, label, [role="button"], [data-no-drag]';

export function swipe(node: HTMLElement, config: SwipeConfig) {
	let active = false;
	let pointerId: number | null = null;
	let startX = 0;
	let startY = 0;

	function isInteractiveTarget(target: EventTarget | null): boolean {
		if (!target || !(target instanceof Element)) return false;
		const selector = config.interactiveSelector ?? DEFAULT_INTERACTIVE_SELECTOR;
		const matched = target.closest(selector);
		return matched !== null && matched !== node;
	}

	function handlePointerDown(event: PointerEvent) {
		if (config.disabled || isInteractiveTarget(event.target)) return;
		active = true;
		pointerId = event.pointerId;
		startX = event.clientX;
		startY = event.clientY;
		node.setPointerCapture(event.pointerId);
		config.onStart?.();
	}

	function handlePointerMove(event: PointerEvent) {
		if (!active || event.pointerId !== pointerId) return;
		config.onMove?.({
			dx: event.clientX - startX,
			dy: event.clientY - startY
		});
	}

	function finish(event: PointerEvent) {
		if (!active || event.pointerId !== pointerId) return;
		if (node.hasPointerCapture(event.pointerId)) {
			node.releasePointerCapture(event.pointerId);
		}
		const dx = event.clientX - startX;
		const dy = event.clientY - startY;
		active = false;
		pointerId = null;
		config.onEnd?.({ dx, dy });
	}

	node.addEventListener('pointerdown', handlePointerDown);
	node.addEventListener('pointermove', handlePointerMove);
	node.addEventListener('pointerup', finish);
	node.addEventListener('pointercancel', finish);

	return {
		update(nextConfig: SwipeConfig) {
			config = nextConfig;
		},
		destroy() {
			node.removeEventListener('pointerdown', handlePointerDown);
			node.removeEventListener('pointermove', handlePointerMove);
			node.removeEventListener('pointerup', finish);
			node.removeEventListener('pointercancel', finish);
		}
	};
}
