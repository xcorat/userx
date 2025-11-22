/**
 * Gesture Action for Svelte 5
 * Provides unified pointer event handling for drag/swipe gestures
 * Supports mouse, touch, and stylus input via Pointer Events API
 */

export interface GestureContext {
	x: number;
	y: number;
	dx: number;
	dy: number;
	direction?: 'left' | 'right' | 'up' | 'down';
	event: PointerEvent;
}

export interface GestureActionConfig {
	onStart?: (ctx: GestureContext) => void;
	onMove?: (ctx: GestureContext) => void;
	onEnd?: (ctx: GestureContext) => void;
	onCancel?: (ctx: GestureContext) => void;
	interactiveSelector?: string;
}

interface GestureState {
	isActive: boolean;
	startX: number;
	startY: number;
	pointerId: number | null;
}

const DEFAULT_INTERACTIVE_SELECTOR = 
	'button, a, input, textarea, select, [role="button"], [data-interactive="true"], [data-no-drag]';

/**
 * Gesture action that handles pointer events for drag/swipe interactions
 * 
 * @param node - The HTML element to attach gesture handling to
 * @param config - Configuration object with callbacks and options
 * @returns ActionReturn object with update and destroy methods
 * 
 * @example
 * ```svelte
 * <div use:gesture={{ onStart, onMove, onEnd }}>
 *   Draggable content
 * </div>
 * ```
 */
export function gesture(node: HTMLElement, config: GestureActionConfig) {
	let state: GestureState = {
		isActive: false,
		startX: 0,
		startY: 0,
		pointerId: null
	};

	const interactiveSelector = config.interactiveSelector || DEFAULT_INTERACTIVE_SELECTOR;

	/**
	 * Check if the target element or its ancestors match the interactive selector
	 */
	function isInteractiveElement(target: EventTarget | null): boolean {
		if (!target || !(target instanceof Element)) return false;
		
		const matchedElement = (target as Element).closest(interactiveSelector);
		// If the matched element is the node itself, it's not considered interactive
		// (we want the node to be draggable)
		return matchedElement !== null && matchedElement !== node;
	}

	/**
	 * Handle pointer down event - start of gesture
	 */
	function handlePointerDown(event: PointerEvent) {
		// Check if pointer started on an interactive element
		if (isInteractiveElement(event.target)) {
			return;
		}

		// Prevent default to avoid text selection during drag
		event.preventDefault();

		// Set pointer capture to receive all pointer events
		node.setPointerCapture(event.pointerId);

		// Initialize state
		state = {
			isActive: true,
			startX: event.clientX,
			startY: event.clientY,
			pointerId: event.pointerId
		};

		// Call onStart callback
		if (config.onStart) {
			config.onStart({
				x: event.clientX,
				y: event.clientY,
				dx: 0,
				dy: 0,
				event
			});
		}
	}

	/**
	 * Handle pointer move event - during gesture
	 */
	function handlePointerMove(event: PointerEvent) {
		if (!state.isActive || event.pointerId !== state.pointerId) return;

		// Calculate deltas from start position
		const dx = event.clientX - state.startX;
		const dy = event.clientY - state.startY;

		// Call onMove callback
		if (config.onMove) {
			config.onMove({
				x: event.clientX,
				y: event.clientY,
				dx,
				dy,
				event
			});
		}
	}

	/**
	 * Handle pointer up event - end of gesture
	 */
	function handlePointerUp(event: PointerEvent) {
		if (!state.isActive || event.pointerId !== state.pointerId) return;

		// Release pointer capture
		if (node.hasPointerCapture(event.pointerId)) {
			node.releasePointerCapture(event.pointerId);
		}

		// Calculate final deltas
		const dx = event.clientX - state.startX;
		const dy = event.clientY - state.startY;

		// Reset state
		state = {
			isActive: false,
			startX: 0,
			startY: 0,
			pointerId: null
		};

		// Call onEnd callback
		if (config.onEnd) {
			config.onEnd({
				x: event.clientX,
				y: event.clientY,
				dx,
				dy,
				event
			});
		}
	}

	/**
	 * Handle pointer cancel event - gesture interrupted
	 */
	function handlePointerCancel(event: PointerEvent) {
		if (!state.isActive || event.pointerId !== state.pointerId) return;

		// Release pointer capture
		if (node.hasPointerCapture(event.pointerId)) {
			node.releasePointerCapture(event.pointerId);
		}

		// Calculate deltas at cancel point
		const dx = event.clientX - state.startX;
		const dy = event.clientY - state.startY;

		// Reset state
		state = {
			isActive: false,
			startX: 0,
			startY: 0,
			pointerId: null
		};

		// Call onCancel callback (or onEnd if onCancel not provided)
		if (config.onCancel) {
			config.onCancel({
				x: event.clientX,
				y: event.clientY,
				dx,
				dy,
				event
			});
		} else if (config.onEnd) {
			config.onEnd({
				x: event.clientX,
				y: event.clientY,
				dx,
				dy,
				event
			});
		}
	}

	// Attach event listeners
	node.addEventListener('pointerdown', handlePointerDown);
	node.addEventListener('pointermove', handlePointerMove);
	node.addEventListener('pointerup', handlePointerUp);
	node.addEventListener('pointercancel', handlePointerCancel);

	// Set touch-action to prevent browser handling of pan/zoom
	const originalTouchAction = node.style.touchAction;
	node.style.touchAction = 'none';

	return {
		update(newConfig: GestureActionConfig) {
			config = newConfig;
		},
		destroy() {
			// Clean up event listeners
			node.removeEventListener('pointerdown', handlePointerDown);
			node.removeEventListener('pointermove', handlePointerMove);
			node.removeEventListener('pointerup', handlePointerUp);
			node.removeEventListener('pointercancel', handlePointerCancel);

			// Restore original touch-action
			node.style.touchAction = originalTouchAction;

			// Release pointer capture if still active
			if (state.isActive && state.pointerId !== null) {
				if (node.hasPointerCapture(state.pointerId)) {
					node.releasePointerCapture(state.pointerId);
				}
			}
		}
	};
}

