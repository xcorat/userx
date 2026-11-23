<script lang="ts">
	import { swipe } from '$lib/actions/swipe';
	import { sessionStore } from '$lib/stores/session.svelte';
	import SwipeToContinue from '$lib/components/ui/SwipeToContinue.svelte';
	import { ArrowLeft } from 'lucide-svelte';

	let dragOffsetX = $state(0);
	let isDragging = $state(false);

	function handleNext() {
		sessionStore.setOnboardingStep('username');
	}

	function handleBack() {
		sessionStore.setOnboardingStep('login');
	}
</script>

<div
	class="flex h-full flex-col justify-between px-6 py-6 select-none"
	use:swipe={{
		onStart: () => {
			isDragging = true;
		},
		onMove: ({ dx }) => {
			dragOffsetX = Math.min(0, Math.max(-140, dx));
		},
		onEnd: ({ dx }) => {
			isDragging = false;
			if (dx < -75) {
				dragOffsetX = 0;
				handleNext();
			} else {
				dragOffsetX = 0;
			}
		}
	}}
	style={`transform: translateX(${dragOffsetX * 0.35}px); transition: ${
		isDragging ? 'none' : 'transform 220ms ease-out'
	};`}
>
	<!-- Minimal Top Step Bar -->
	<div class="flex items-center justify-between pt-1">
		<button
			type="button"
			onclick={handleBack}
			class="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="h-3.5 w-3.5" />
			Back
		</button>
		<span class="font-mono text-[11px] text-muted-foreground">01 / 04</span>
	</div>

	<!-- Text-Only Manifesto Copy -->
	<div class="my-auto space-y-6 py-8">
		<div class="h-1 w-10 rounded-full bg-primary"></div>
		<blockquote class="font-heading text-2xl leading-snug font-semibold tracking-tight text-foreground sm:text-3xl">
			“We are building a social network where the you own your data, and have no central authority that manages it”
		</blockquote>
	</div>

	<!-- Bottom Swipe Button -->
	<div class="pb-4">
		<SwipeToContinue label="Swipe for next screen" onComplete={handleNext} />
	</div>
</div>
