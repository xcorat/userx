<script lang="ts">
	import { ArrowRight, Check } from 'lucide-svelte';

	interface Props {
		label?: string;
		onComplete: () => void;
	}

	let { label = 'Swipe to continue', onComplete }: Props = $props();

	let trackEl = $state<HTMLDivElement | null>(null);
	let dragX = $state(0);
	let isDragging = $state(false);
	let completed = $state(false);
	let startX = 0;
	let pointerId: number | null = null;

	const THUMB_SIZE = 52;
	const TRACK_PADDING = 4;

	let maxTravel = $derived(
		trackEl ? Math.max(120, trackEl.clientWidth - THUMB_SIZE - TRACK_PADDING * 2) : 240
	);

	let progress = $derived(Math.min(1, Math.max(0, dragX / maxTravel)));

	function handlePointerDown(event: PointerEvent) {
		if (completed) return;
		isDragging = true;
		startX = event.clientX - dragX;
		pointerId = event.pointerId;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isDragging || event.pointerId !== pointerId) return;
		const next = event.clientX - startX;
		dragX = Math.max(0, Math.min(maxTravel, next));
	}

	function handlePointerUp(event: PointerEvent) {
		if (!isDragging || event.pointerId !== pointerId) return;
		isDragging = false;
		pointerId = null;

		if (dragX >= maxTravel * 0.68) {
			completeSwipe();
		} else {
			dragX = 0;
		}
	}

	function completeSwipe() {
		if (completed) return;
		completed = true;
		dragX = maxTravel;
		setTimeout(() => {
			onComplete();
		}, 180);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowRight') {
			event.preventDefault();
			completeSwipe();
		}
	}
</script>

<div class="space-y-2">
	<div
		bind:this={trackEl}
		class="relative flex h-[60px] w-full items-center overflow-hidden rounded-full border border-border bg-card/90 p-1 shadow-lg backdrop-blur-md select-none"
	>
		<!-- Dynamic progress fill -->
		<div
			class="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-primary/20 transition-[width]"
			style={`width: calc(${progress * 100}% + ${THUMB_SIZE / 2}px); transition-duration: ${isDragging ? '0ms' : '220ms'};`}
		></div>

		<!-- Draggable thumb -->
		<button
			type="button"
			aria-label={label}
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointercancel={handlePointerUp}
			onkeydown={handleKeyDown}
			style={`transform: translateX(${dragX}px); transition: ${isDragging ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)'}; touch-action: none;`}
			class="relative z-10 flex h-[52px] w-[52px] shrink-0 cursor-grab items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-ring"
		>
			{#if completed}
				<Check class="h-5 w-5" />
			{:else}
				<ArrowRight class="h-5 w-5" />
			{/if}
		</button>

		<!-- Centered prompt label -->
		<div
			class="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 pl-10 text-sm font-medium tracking-wide text-muted-foreground transition-opacity"
			style={`opacity: ${Math.max(0.15, 1 - progress * 1.15)};`}
		>
			<span>{completed ? 'Continuing...' : label}</span>
			<ArrowRight class="h-4 w-4 animate-pulse" />
		</div>
	</div>

	<div class="flex justify-center">
		<button
			type="button"
			onclick={completeSwipe}
			class="text-[11px] font-medium text-muted-foreground/80 underline-offset-4 hover:text-foreground hover:underline cursor-pointer"
		>
			Or tap here to continue
		</button>
	</div>
</div>
